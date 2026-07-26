import GenerateToken from "../helpers/GenerateToken.js";
import Database, { type Banner } from "./Database.js";

/**
    CREATE TABLE IF NOT EXISTS GachaData(
        UserToken TEXT NOT NULL,
        Banner TEXT NOT NULL,

        Count INTEGER NOT NULL,
        RollsWithoutSixStar INTEGER NOT NULL,
        Focused INTEGER NOT NULL,

        PRIMARY KEY (UserToken, Banner),
        FOREIGN KEY (UserToken) REFERENCES GachaProfiles(Token),

        CHECK (Focused IN (0, 1))
    );

    CREATE TABLE IF NOT EXISTS GachaStorage(
        UserToken TEXT NOT NULL,
        Banner TEXT NOT NULL,
        Rarity INTEGER NOT NULL,

        Storage TEXT NOT NULL,

        PRIMARY KEY (UserToken, Banner, Rarity),
        FOREIGN KEY (UserToken) REFERENCES GachaProfiles(Token),

        CHECK (Rarity IN (3, 4, 5, 6))
    );

    CREATE TABLE IF NOT EXISTS GachaProfiles(
        Token TEXT PRIMARY KEY
    );
 */

enum BannerType {
    Standard,
    Limited
}

export interface ProfileBanner {
    Count: number;
    RollsWithoutSixStar: number;
    Focused: boolean;
    Storage: {
        SixStars: string[];
        FiveStars: string[];
        FourStars: string[];
        ThreeStars: string[];
    };
}
export type GachaProfile = Record<string, ProfileBanner>;
interface GachaProfileStorageRow {
    Token: string;
    Banner: string;
    Rarity: 3 | 4 | 5 | 6;
    Storage: string;
}
interface GachaProfileDataRow {
    Token: string;
    Banner: string;
    Count: number;
    RollsWithoutSixStar: number;
    Focused: 0 | 1;
}

class GachaSystem {
    private readonly GachaProfiles: Record<string, GachaProfile> = {};
    private readonly CreateGachaProfileSTMT = Database.DB.prepare<[string]>(`
        INSERT INTO GachaProfiles
        (Token)
        VALUES(?)    
    `);

    public constructor() {
        const StorageQuery: GachaProfileStorageRow[] = Database.DB.prepare<[], GachaProfileStorageRow>(`
            SELECT GP.Token, GS.Banner, GS.Rarity, GS.Storage
            FROM GachaStorage GS JOIN GachaProfiles GP ON GP.Token = GS.UserToken
        `).all();
        const DataQuery: GachaProfileDataRow[] = Database.DB.prepare<[], GachaProfileDataRow>(`
            SELECT GP.Token, GD.Banner, GD.Focused, GD.RollsWithoutSixStar
            FROM GachaData GD JOIN GachaProfiles GP ON GP.TOKEN = GD.UserToken
        `).all();
        
        for(const Token of Database.DB.prepare<[], { Token: string }>("SELECT * FROM GachaProfiles").all().map(Row => Row.Token)) {
            this.GachaProfiles[Token] ??= {};

            for(const Storage of StorageQuery) {
                if(Storage.Token !== Token) 
                    continue;
                
                this.GachaProfiles[Token][Storage.Banner] ??= {
                    Count: 0,
                    RollsWithoutSixStar: 0,
                    Focused: false,
                    Storage: {
                        SixStars: [],
                        FiveStars: [],
                        FourStars: [],
                        ThreeStars: []
                    }
                };

                switch(Storage.Rarity) {
                    case 3:
                        this.GachaProfiles[Token][Storage.Banner].Storage.ThreeStars = JSON.parse(Storage.Storage);
                        break;

                    case 4:
                        this.GachaProfiles[Token][Storage.Banner].Storage.FourStars = JSON.parse(Storage.Storage);
                        break;

                    case 5:
                        this.GachaProfiles[Token][Storage.Banner].Storage.FiveStars = JSON.parse(Storage.Storage);
                        break;

                    case 6:
                        this.GachaProfiles[Token][Storage.Banner].Storage.SixStars = JSON.parse(Storage.Storage);
                        break;
                }
            }

            for(const Data of DataQuery) {
                if(Data.Token !== Token)
                    continue;

                this.GachaProfiles[Token][Data.Banner].Count = Data.Count;
                this.GachaProfiles[Token][Data.Banner].RollsWithoutSixStar = Data.RollsWithoutSixStar;
                this.GachaProfiles[Token][Data.Banner].Focused = !!Data.Focused;
            }
        }
    }
    public CreateProfile(): void {
        const Token: string = GenerateToken(Token => !!this.GachaProfiles[Token]);
        this.CreateGachaProfileSTMT.run(Token);
    }
    public Roll(Token: string, BannerName: string): string[] | undefined {
        const Profile: ProfileBanner = this.GachaProfiles[Token][BannerName];
        const Banner: Banner | undefined = Database.Manager.GetBanner(BannerName);

        if(!Profile || !Banner) 
            return undefined;
        
        const Type: BannerType = Banner.SixStarsPool.Secondary 
            ? BannerType.Limited
            : BannerType.Standard
        ;


    }
}

export default new GachaSystem();