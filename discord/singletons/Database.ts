import { EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import Database, { type Database as DatabaseType, type Statement } from "better-sqlite3";
import APIConnector from "./APIConnector.js";
import LoadEnv from "./LoadEnv.js";
import SendMessage from "../helpers/SendMessage.js";

const DB: DatabaseType = new Database("Mapping.db");
DB.pragma("journal_mode = WAL");
DB.pragma("foreign_key = ON");
// the bot backend maintains its own database both to reduce load on the main backend and to increase speed
DB.exec(`
    CREATE TABLE IF NOT EXISTS CachedBannerPools(
        BannerName TEXT NOT NULL,
        Rarity INTEGER NOT NULL,

        Prima TEXT,
        Secondary TEXT,
        Standard TEXT NOT NULL,

        PRIMARY KEY (BannerName, Rarity),
        FOREIGN KEY (BannerName) REFERENCES CachedBannerData(Name),

        CHECK(Rarity IN (3, 4, 5, 6))
    );

    CREATE TABLE IF NOT EXISTS CachedBannerData(
        Name TEXT PRIMARY KEY,
        ReleaseDate INTEGER NOT NULL,
        Type INTEGER NOT NULL,

        CHECK(Type IN (0, 1, 2, 3, 4))
    );

    CREATE TABLE IF NOT EXISTS CachedOperatorData(
        ID TEXT PRIMARY KEY,
        Name TEXT NOT NULL,
        Rarity INTEGER NOT NULL,
        ReleaseDate INTEGER NOT NULL,
        Limited INTEGER NOT NULL,

        CHECK(Rarity IN (3, 4, 5, 6))
    );

    CREATE TABLE IF NOT EXISTS GachaData(
        UserID TEXT NOT NULL,
        Banner TEXT NOT NULL,

        Count INTEGER NOT NULL,

        PRIMARY KEY (UserID, Banner),
        FOREIGN KEY (UserID) REFERENCES Mapping(UserID),

        CHECK(Focused IN (0, 1)),
        CHECK(TenRolls IN (0, 1))
    );

    CREATE TABLE IF NOT EXISTS GachaStorage(
        UserID TEXT NOT NULL,
        Banner TEXT NOT NULL,
        Rarity INTEGER NOT NULL,
        ID TEXT NOT NULL,

        Count INTEGER NOT NULL,

        PRIMARY KEY (UserID, Banner, Rarity, ID),
        FOREIGN KEY (UserID) REFERENCES Mapping(UserID),

        CHECK(Rarity IN (3, 4, 5, 6)),
        CHECK(Count >= 0)
    );
    
    CREATE TABLE IF NOT EXISTS User(
        UserID TEXT PRIMARY KEY,
        Token TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS TimeoutZone(
        UserID TEXT PRIMARY KEY,
        Timeout INTEGER NOT NULL
    );
`);

interface GetOperatorResponse {
    ID: string;
    Name: string;
    Rarity: 3 | 4 | 5 | 6;
    ReleaseDate: number;
    Limited: boolean;
}
interface GetBannerResponse {
    Name: string;
    ReleaseDate: number;
    Type: BannerTypes;
    OperatorPool: {
        SixStarsPool: {
            Primary: string[];
            Secondary: string[];
            Standard: string[];
        };
        FiveStarsPool: {
            Primary: string[];
            Standard: string[];
        };
        FourStarsPool: {
            Primary: string[];
            Standard: string[];
        };
        ThreeStarsPool: string[];
    };
}

export interface User {
    Token: string;
    Profile: Record<string, {
        Count: number;
        Storage: {
            SixStars: Record<string, number>;
            FiveStars: Record<string, number>;
            FourStars: Record<string, number>;
            ThreeStars: Record<string, number>;
        };
    }>
}
interface StorageRow {
    UserID: string;
    Banner: string;
    Rarity: 3 | 4 | 5 | 6;
    ID: string;
    Count: number;
}
interface DataRow {
    UserID: string;
    Banner: string;
    Count: number;
}
interface UserRow {
    UserID: string;
    Token: string;
}

export enum BannerTypes {
    Standard,
    Limited,
    Orienteering,
    JointOperation,
    TFTW
}
export interface Banner {
    ReleaseDate: number;
    Type: BannerTypes;
    SixStarsPool: {
        Primary: string[];
        Secondary: string[];
        Standard: string[];
    };
    FiveStarsPool: {
        Primary: string[];
        Standard: string[];
    };
    FourStarsPool: {
        Primary: string[];
        Standard: string[];
    };
    ThreeStarsPool: string[];
}
interface BannersRow {
    Name: string;
    ReleaseDate: number;
    Type: number;
    Rarity: 3 | 4 | 5 | 6;
    Prima: string | null;
    Secondary: string | null;
    Standard: string;
}
interface SixStarsPool {
    Primary: string[];
    Secondary: string[];
    Standard: string[];
}

interface FiveStarsPool {
    Primary: string[];
    Standard: string[];
}

export interface Operator {
    Name: string;
    Rarity: 3 | 4 | 5 | 6;
    ReleaseDate: number;
    Limited: boolean;
}
interface OperatorsRow {
    ID: string;
    Name: string;
    Rarity: 3 | 4 | 5 | 6;
    ReleaseDate: number;
    Limited: number;
}

class DataManager {
    public readonly CachedOperators: Map<string, Operator> = new Map(
        DB.prepare<[], OperatorsRow>("SELECT * FROM CachedOperatorData")
            .all()
            .map(Row => [
                Row.ID,
                {
                    Name: Row.Name,
                    Rarity: Row.Rarity,
                    ReleaseDate: Row.ReleaseDate,
                    Limited: !!Row.Limited
                }
            ])
    );
    public BannerNames!: string[];
    public readonly CachedBanners: Map<string, Banner> = new Map();
    public readonly Users: Map<string, User> = new Map(
        DB.prepare<[], UserRow>("SELECT * FROM User").all().map(
            Row => [
                Row.UserID,
                {
                    Token: Row.Token,
                    Profile: {}
                }
            ]
        )
    );
    public readonly RarityColorMap: Record<3 | 4 | 5 | 6, number> = {
        3: 0x00AAEE,
        4: 0xD6C5D6,
        5: 0xFFFFA9,
        6: 0xFFC800
    };
    public readonly TimeoutZone: Map<string, number> = new Map(
        DB.prepare<[], { UserID: string; Timeout: number; }>("SELECT * FROM TimeoutZone")
            .all()
            .map(Row => [Row.UserID, Row.Timeout])
    );
    public readonly AddTokenSTMT: Statement<[string, string], void> = DB.prepare<[string, string], void>(`
        INSERT INTO Mapping
        (UserID, Token)
        VALUES(?, ?)
    `);
    public readonly RefreshStorageSTMT = DB.prepare<[string, string, number, string, number], void>(`
        INSERT INTO GachaStorage
        (UserID, Banner, Rarity, ID, Count)
        VALUES(?, ?, ?, ?, ?)
        ON CONFLICT(UserToken, Banner, Rarity, ID) DO UPDATE SET
            Count = excluded.Count
    `);
    public readonly RefreshDataSTMT = DB.prepare<[string, string, number], void>(`
        INSERT INTO GachaData
        (UserID, Banner, Count)
        VALUES(?, ?, ?)
        ON CONFLICT(UserToken, Banner) DO UPDATE SET
            Count = excluded.Count
    `);
    public readonly TimeoutSTMT = DB.prepare<[string, number], void>(`
        INSERT INTO TimeoutZone
        (UserID, Timeout)
        VALUES(?, ?)
    `);
    public readonly CacheOperatorSTMT = DB.prepare<[string, string, 3 | 4 | 5 | 6, number, 0 | 1]>(`
        INSERT INTO CachedOperatorData
        (ID, Name, Rarity, ReleaseDate, Limited)
        VALUES(?, ?, ?, ?, ?)
    `);
    public readonly RemoveTimeoutSTMT = DB.prepare<[string], void>("DELETE FROM TimeoutZone WHERE UserID = ?");
    public readonly CacheBannerSTMT = DB.transaction((
        Name: string,
        ReleaseDate: number,
        Type: BannerTypes,
        SixStarPool: SixStarsPool,
        FiveStarsPool: FiveStarsPool,
        FourStarsPool: FiveStarsPool,
        ThreeStarsPool: string[]
    ) => {
        DB.prepare(`
            INSERT INTO CachedBannerData
            (Name, ReleaseDate, Type)
            VALUES(?, ?, ?)
        `).run(Name, ReleaseDate, Type);
        DB.prepare<[string, string, string, string], void>(`
            INSERT INTO CachedBannerPools
            (BannerName, Rarity, Prima, Secondary, Standard)
            VALUES(?, 6, ?, ?, ?)
        `).run(Name, JSON.stringify(SixStarPool.Primary), JSON.stringify(SixStarPool.Secondary), JSON.stringify(SixStarPool.Standard));
        DB.prepare<[string, string, string], void>(`
            INSERT INTO CachedBannerPools
            (BannerName, Rarity, Prima, Standard)
            VALUES(?, 5, ?, ?)
        `).run(Name, JSON.stringify(FiveStarsPool.Primary), JSON.stringify(FiveStarsPool.Standard));
        DB.prepare<[string, string, string], void>(`
            INSERT INTO CachedBannerPools
            (BannerName, Rarity, Prima, Standard)
            VALUES(?, 4, ?, ?)
        `).run(Name, JSON.stringify(FourStarsPool.Primary), JSON.stringify(FourStarsPool.Standard));
        DB.prepare<[string, string], void>(`
            INSERT INTO CachedBannerPools
            (BannerName, Rarity, Standard)
            VALUES(?, 3, ?)
        `).run(Name, JSON.stringify(ThreeStarsPool));
    });
    public readonly RemoveTokenSTMT = DB.transaction((UserID: string): void => {
        DB.prepare<[string], void>("DELETE FROM GachaStorage WHERE UserID = ?").run(UserID);
        DB.prepare<[string], void>("DELETE FROM GachaData WHERE UserID = ?").run(UserID);
        DB.prepare<[string], void>("DELETE FROM GachaProfiles WHERE UserID = ?").run(UserID);
    });
    
    public constructor() {
        const StorageQuery: StorageRow[] = DB.prepare<[], StorageRow>(`
            SELECT GS.UserID, GS.Banner, GS.Rarity, GS.ID
            FROM GachaStorage GS JOIN User U ON GS.UserID = U.UserID
        `).all();
        const DataQuery: DataRow[] = DB.prepare<[], DataRow>(`
            SELECT GD.UserID, GD.Banner, GD.Count
            FROM GachaData GD JOIN User U ON GD.UserID = U.UserID
        `).all();

        for(const UserID of this.Users.keys()) {
            const UserProfile: User = this.Users.get(UserID)!;
            const DataRows: DataRow[] = DataQuery.filter(Row => Row.UserID === UserID);
            const StorageRows: StorageRow[] = StorageQuery.filter(Row => Row.UserID === UserID);

            for(const Row of DataRows) {
                UserProfile.Profile[Row.Banner] ??= {
                    Count: Row.Count,
                    Storage: {
                        SixStars: {},
                        FiveStars: {},
                        FourStars: {},
                        ThreeStars: {}
                    }
                };
            }
            for(const Row of StorageRows) {
                switch(Row.Rarity) {
                    case 3:
                        UserProfile.Profile[Row.Banner].Storage.ThreeStars[Row.ID] = Row.Count;
                        break;

                    case 4:
                        UserProfile.Profile[Row.Banner].Storage.FourStars[Row.ID] = Row.Count;
                        break;

                    case 5:
                        UserProfile.Profile[Row.Banner].Storage.FiveStars[Row.ID] = Row.Count;
                        break;
                        
                    case 6:
                        UserProfile.Profile[Row.Banner].Storage.SixStars[Row.ID] = Row.Count;
                        break;
                }
            }
        }

        const Query: BannersRow[] = DB.prepare<[], BannersRow>(`
            SELECT B.Name, B.ReleaseDate, B.Type, BP.Rarity, BP.Prima, BP.Secondary, BP.Standard
            FROM CachedBannerPools BP JOIN CachedBannerData B ON BP.BannerName = B.Name
        `).all();
        for(const Row of Query) {
            const Name: string = Row.Name;
            const Banner: Banner = {
                ReleaseDate: 0,
                Type: BannerTypes.Standard,
                SixStarsPool: {
                    Primary: [],
                    Secondary: [],
                    Standard: []
                },
                FiveStarsPool: {
                    Primary: [],
                    Standard: []
                },
                FourStarsPool: {
                    Primary: [],
                    Standard: []
                },
                ThreeStarsPool: []
            };

            Banner.ReleaseDate = Row.ReleaseDate;
            Banner.Type = Row.Type;

            switch(Row.Rarity) {
                case 3:
                    Banner.ThreeStarsPool = JSON.parse(Row.Standard);
                    break;

                case 4:
                    if(Row.Prima)
                        Banner.FourStarsPool.Primary = JSON.parse(Row.Prima);
                    Banner.FourStarsPool.Standard = JSON.parse(Row.Standard);
                    break;

                case 5:
                    if(Row.Prima)
                        Banner.FiveStarsPool.Primary = JSON.parse(Row.Prima);
                    Banner.FiveStarsPool.Standard = JSON.parse(Row.Standard);
                    break;

                case 6:
                    if(Row.Prima)
                        Banner.SixStarsPool.Primary = JSON.parse(Row.Prima);
                    if(Row.Secondary)
                        Banner.SixStarsPool.Secondary = JSON.parse(Row.Secondary);
                    Banner.SixStarsPool.Standard = JSON.parse(Row.Standard);
                    break;
            }
            this.CachedBanners.set(Name, Banner);
        }
    }

    public BuildGachaEmbed(Interaction: ChatInputCommandInteraction, GachaResult: Record<string, number>, Rarity: 3 | 4 | 5 | 6): EmbedBuilder {
        return new EmbedBuilder()
            .setColor(this.RarityColorMap[Rarity])
            .setAuthor({
                name: Interaction.user.username,
                url: `https://discord.com/users/${Interaction.user.id}`,
                iconURL: Interaction.user.displayAvatarURL({ size: 256 })
            })
            .setThumbnail(Interaction.user.displayAvatarURL({ size: 512 }))
            .setTitle(`${Interaction.user.username}'s gacha result`)
            .addFields(
                ...Object.entries(GachaResult).map(([Operator, Count]) => ({
                    name: Operator,
                    value: `x${Count}`
                }))
            )
        ;
    }

    public async GetOperatorInfo(OperatorID: string): Promise<Operator> {
        if(this.CachedOperators.has(OperatorID))
            return this.CachedOperators.get(OperatorID)!;

        const Operator: GetOperatorResponse = await (await APIConnector.GetOperatorDetails(OperatorID)).json() as GetOperatorResponse;
        const { ID, ...OperatorData } = Operator;
        this.CachedOperators.set(OperatorID, OperatorData);
        this.CacheOperatorSTMT.run(
            OperatorID,
            Operator.Name,
            Operator.Rarity,
            Operator.ReleaseDate,
            Number(Operator.Limited) as 0 | 1
        );

        return OperatorData;
    }
    public async GetBannerInfo(BannerName: string): Promise<Banner> {
        if(this.CachedBanners.has(BannerName))
            return this.CachedBanners.get(BannerName)!;

        const Response: Response = await APIConnector.GetBannerDetails(BannerName);
        
        if(!Response.ok) {
            const Err: Error = new Error(`Banner ${BannerName} does not exists.`);
            Err.name = "UnknownBannerError";
            throw Err;
        }
            
        const Banner: GetBannerResponse = await Response.json() as GetBannerResponse;
        const { Name, ...Temp } = Banner;
        const BannerData: Banner = {
            ReleaseDate: Temp.ReleaseDate,
            Type: Temp.Type,
            ...Temp.OperatorPool
        };
        this.CachedBanners.set(BannerName, BannerData);
        this.CacheBannerSTMT(
            BannerName,
            BannerData.ReleaseDate,
            BannerData.Type,
            BannerData.SixStarsPool,
            BannerData.FiveStarsPool,
            BannerData.FourStarsPool,
            BannerData.ThreeStarsPool
        );

        return BannerData;
    }

    public async GetAllBanners(): Promise<string[]> {
        if(this.BannerNames)
            return this.BannerNames;
        const Response: Response = await APIConnector.GetAllBannerNames();
        this.BannerNames = await Response.json() as string[];
        return this.BannerNames;
    }

    public GetToken(UserID: string): string | undefined {
        return this.Users.get(UserID)?.Token;
    }
    public async Delete(Interaction: ChatInputCommandInteraction): Promise<void> {
        const UserID: string = Interaction.user.id;
        if(!this.Users.has(UserID)) 
            return await SendMessage(Interaction, `${Interaction.user.id}(${Interaction.user.username}) doesn't have a profile.`);

        const Token: string = this.Users.get(UserID)!.Token;

        await APIConnector.DeleteToken(Token);

        this.Users.delete(UserID);
        this.RemoveTokenSTMT(UserID);
        this.TimeoutSTMT.run(UserID, Date.now() + LoadEnv.TIMEOUT_DURATION * 1000);

        await SendMessage(Interaction, "Profile deleted successfully.");
    }
    public async CreateToken(Interaction: ChatInputCommandInteraction): Promise<void> {
        const UserID: string = Interaction.user.id;
        if(this.Users.has(UserID)) 
            return await SendMessage(Interaction, `${Interaction.user.id}(${Interaction.user.username}) already have a profile.`);

        const Timeout: number | undefined = this.TimeoutZone.get(UserID);
        if(Timeout) {
            if(Timeout > Date.now()) 
                return await SendMessage(Interaction, `${Interaction.user.id}(${Interaction.user.username}) is still in timeout, timeout will expire <t:${Math.ceil((Timeout - Date.now()) / 1000)}:R>.`);
            else {
                this.RemoveTimeoutSTMT.run(UserID);
                this.TimeoutZone.delete(UserID);
            }
        }

        const Response: Response = await APIConnector.CreateToken();
        const Token: string = Response.headers.get("Seession-Token")!;

        this.AddTokenSTMT.run(UserID, Token);
        this.Users.set(UserID, {
            Token,
            Profile: {}
        });

        await SendMessage(Interaction, "Profile created successfully.");
    }
}

export default {
    DB,
    Manager: new DataManager()
};