import type { GachaItems } from "../helpers/Gacha.js";
import Database, { type Banner, BannerTypes } from "./Database.js";
import Gacha from "../helpers/Gacha.js";
import GenerateToken from "../helpers/GenerateToken.js";
import PityCalculator from "../helpers/PityCalculator.js";
import Switch from "../helpers/Switch.js";
import crypto from "crypto";

Database.DB.exec(`
    CREATE TABLE IF NOT EXISTS GachaData(
        UserToken TEXT NOT NULL,
        Banner TEXT NOT NULL,

        Count INTEGER NOT NULL,
        RollsWithoutSixStar INTEGER NOT NULL,
        RollsSinceLast6StarsRateUp INTEGER NOT NULL,
        RollsSinceLast5StarsRateUp INTEGER NOT NULL,
        RollsSinceLast4StarsRateUp INTEGER NOT NULL,
        Focused INTEGER NOT NULL,
        TenRolls INTEGER NOT NULL,

        PRIMARY KEY (UserToken, Banner),
        FOREIGN KEY (UserToken) REFERENCES GachaProfiles(Token),

        CHECK(Focused IN (0, 1)),
        CHECK(TenRolls IN (0, 1))
    );

    CREATE TABLE IF NOT EXISTS GachaStorage(
        UserToken TEXT NOT NULL,
        Banner TEXT NOT NULL,
        Rarity INTEGER NOT NULL,
        ID TEXT NOT NULL,

        Count INTEGER NOT NULL,

        PRIMARY KEY (UserToken, Banner, Rarity, ID),
        FOREIGN KEY (UserToken) REFERENCES GachaProfiles(Token),

        CHECK(Rarity IN (3, 4, 5, 6)),
        CHECK(Count >= 0)
    );

    CREATE TABLE IF NOT EXISTS GachaProfiles(
        Token TEXT PRIMARY KEY
    );
`);

export interface ProfileBanner {
    Count: number;
    RollsWithoutSixStar: number;
    RollsSinceLast6StarsRateUp: number;
    RollsSinceLast5StarsRateUp: number;
    RollsSinceLast4StarsRateUp: number;
    Focused: boolean;
    TenRolls: boolean;
    Storage: {
        SixStars: Record<string, number>;
        FiveStars: Record<string, number>;
        FourStars: Record<string, number>;
        ThreeStars: Record<string, number>;
    };
}
export type GachaProfile = Record<string, ProfileBanner>;

export enum Items {
    SixStars = 6,
    FiveStars = 5,
    FourStars = 4,
    ThreeStars = 3
}

enum RateUp {
    Primary,
    Secondary,
    None
}

interface GachaProfileStorageRow {
    UserToken: string;
    Banner: string;
    Rarity: 3 | 4 | 5 | 6;
    ID: string;
    Count: number;
}
interface GachaProfileDataRow {
    UserToken: string;
    Banner: string;
    Count: number;
    RollsWithoutSixStar: number;
    RollsSinceLast6StarsRateUp: number;
    RollsSinceLast5StarsRateUp: number;
    RollsSinceLast4StarsRateUp: number;
    Focused: 0 | 1;
    TenRolls: 0 | 1;
}

export default new class {
    private readonly GachaProfiles: Record<string, GachaProfile> = Object.fromEntries(
        Database.DB.prepare<[], { Token: string }>("SELECT * FROM GachaProfiles")
            .all()
            .map(Row => [Row.Token, {}])
    );
    private readonly CreateGachaProfileSTMT = Database.DB.prepare<[string], void>(`
        INSERT INTO GachaProfiles
        (Token)
        VALUES(?)    
    `);
    private readonly RefreshStorageSTMT = Database.DB.prepare<[string, string, 6 | 5 | 4 | 3, string, number], void>(`
        INSERT INTO GachaStorage
        (UserToken, Banner, Rarity, ID, Count)
        VALUES(?, ?, ?, ?, ?)
        ON CONFLICT(UserToken, Banner, Rarity, ID) DO UPDATE SET
            Count = excluded.Count
    `);
    private readonly RefreshDataSTMT = Database.DB.prepare<[string, string, number, number, number, number, number, number, number], void>(`
        INSERT INTO GachaData (
            UserToken,
            Banner,
            Count,
            RollsWithoutSixStar,
            RollsSinceLast6StarsRateUp,
            RollsSinceLast5StarsRateUp,
            RollsSinceLast4StarsRateUp,
            Focused,
            TenRolls
        )
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(UserToken, Banner) DO UPDATE SET
            Count = excluded.Count,
            RollsWithoutSixStar = excluded.RollsWithoutSixStar,
            RollsSinceLast6StarsRateUp = excluded.RollsSinceLast6StarsRateUp,
            RollsSinceLast5StarsRateUp = excluded.RollsSinceLast5StarsRateUp,
            RollsSinceLast4StarsRateUp = excluded.RollsSinceLast4StarsRateUp,
            Focused = excluded.Focused,
            TenRolls = excluded.TenRolls
    `);
    private readonly ResetBannerSTMT = Database.DB.transaction((Token: string, BannerName: string): void => {
        Database.DB.prepare<[string, string], void>(`
            DELETE FROM GachaData
            WHERE UserToken = ? AND Banner = ?
        `).run(Token, BannerName);
        Database.DB.prepare<[string, string], void>(`
            DELETE FROM GachaStorage
            WHERE UserToken = ? AND Banner = ?
        `).run(Token, BannerName);
    });
    private readonly DeleteProfileSTMT = Database.DB.transaction((Token: string): void => {
        Database.DB.prepare<[string], void>("DELETE FROM GachaStorage WHERE UserToken = ?").run(Token);
        Database.DB.prepare<[string], void>("DELETE FROM GachaData WHERE UserToken = ?").run(Token);
        Database.DB.prepare<[string], void>("DELETE FROM GachaProfiles WHERE Token = ?").run(Token);
    });

    public constructor() {
        const StorageQuery: GachaProfileStorageRow[] = Database.DB.prepare<[], GachaProfileStorageRow>(`
            SELECT GP.Token, GS.Banner, GS.Rarity, GS.ID, GS.Count
            FROM GachaStorage GS JOIN GachaProfiles GP ON GP.Token = GS.UserToken
        `).all();
        const DataQuery: GachaProfileDataRow[] = Database.DB.prepare<[], GachaProfileDataRow>(`
            SELECT
                GP.Token,
                GD.Banner,
                GD.Focused,
                GD.RollsWithoutSixStar,
                GD.RollsSinceLast6StarsRateUp,
                GD.RollsSinceLast5StarsRateUp,
                GD.RollsSinceLast4StarsRateUp,
                GD.TenRolls,
                GD.Count
            FROM GachaData GD JOIN GachaProfiles GP ON GP.TOKEN = GD.UserToken
        `).all();
        
        // this is slow as shit but it's okay because it only runs once per session
        for(const Token of Object.keys(this.GachaProfiles)) {
            const DataRows: GachaProfileDataRow[] = DataQuery.filter(Row => Row.UserToken === Token);
            const StorageRows: GachaProfileStorageRow[] = StorageQuery.filter(Row => Row.UserToken === Token);

            for(const Row of DataRows) {
                this.GachaProfiles[Token][Row.Banner] ??= {
                    Count: Row.Count,
                    RollsWithoutSixStar: Row.RollsWithoutSixStar,
                    RollsSinceLast6StarsRateUp: Row.RollsSinceLast6StarsRateUp,
                    RollsSinceLast5StarsRateUp: Row.RollsSinceLast5StarsRateUp,
                    RollsSinceLast4StarsRateUp: Row.RollsSinceLast4StarsRateUp,
                    Focused: !!Row.Focused,
                    TenRolls: !!Row.TenRolls,
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
                        this.GachaProfiles[Token][Row.Banner].Storage.ThreeStars[Row.ID] = Row.Count;
                        break;

                    case 4:
                        this.GachaProfiles[Token][Row.Banner].Storage.FourStars[Row.ID] = Row.Count;
                        break;

                    case 5:
                        this.GachaProfiles[Token][Row.Banner].Storage.FiveStars[Row.ID] = Row.Count;
                        break;

                    case 6:
                        this.GachaProfiles[Token][Row.Banner].Storage.SixStars[Row.ID] = Row.Count;
                        break;
                }
            }
        }
    }
    
    public CreateProfile(): string {
        const Token: string = GenerateToken(Token => !!this.GachaProfiles[Token]);
        this.CreateGachaProfileSTMT.run(Token);
        this.GachaProfiles[Token] = {};
        return Token;
    }
    public DeleteProfile(Token: string): void {
        delete this.GachaProfiles[Token];
        this.DeleteProfileSTMT(Token);
    }
    public ResetBanner(Token: string, BannerName: string): void {
        delete this.GachaProfiles[Token][BannerName];
        this.ResetBannerSTMT(Token, BannerName);
    }
    public GetProfile(Token: string): GachaProfile | undefined {
        return this.GachaProfiles[Token];
    }
    public Roll(Token: string, BannerName: string, WriteDB: boolean = true): [string, Items] | undefined {
        const Banner: Banner | undefined = Database.Manager.GetBanner(BannerName);
        
        if(!Banner || !this.GachaProfiles[Token])
            return;

        this.GachaProfiles[Token][BannerName] ??= {
            Count: 0,
            RollsWithoutSixStar: 0,
            RollsSinceLast6StarsRateUp: 0,
            RollsSinceLast5StarsRateUp: 0,
            RollsSinceLast4StarsRateUp: 0,
            Focused: false,
            TenRolls: false,
            Storage: {
                SixStars: {},
                FiveStars: {},
                FourStars: {},
                ThreeStars: {}
            }
        };
        
        const BannerProfile: ProfileBanner = this.GachaProfiles[Token][BannerName];
        BannerProfile.Count += 1;

        let StandardRate: GachaItems<Items>[] = [
            { Value: Items.SixStars, Chance: 2 },
            { Value: Items.FiveStars, Chance: 8 },
            { Value: Items.FourStars, Chance: 50 },
            { Value: Items.ThreeStars, Chance: 40 }
        ];

        if(BannerProfile.RollsWithoutSixStar > 50) 
            StandardRate = PityCalculator(StandardRate, Items.SixStars, (BannerProfile.RollsWithoutSixStar - 50) * 2);
        if(BannerProfile.Count === 9 && !BannerProfile.TenRolls) 
            StandardRate = [{ Value: Items.SixStars, Chance: 2 }, { Value: Items.FiveStars, Chance: 98 }];
        
        const Result: Items = Banner.Type === BannerTypes.Crossover && BannerProfile.RollsSinceLast6StarsRateUp >= 119
                ? Items.SixStars
            : Banner.Type === BannerTypes.Crossover && BannerProfile.RollsSinceLast5StarsRateUp >= 49
                ? Items.FiveStars
            : Gacha(StandardRate)
        ;

        const FourStarsHandler = (Rate?: GachaItems<boolean>[]) => {
            const IsRateUp: boolean = Gacha(Rate ?? [
                { Value: true, Chance: 20 },
                { Value: false, Chance: 80 }
            ]);

            if(Banner.FourStarsPool.Primary.length) {
                if(IsRateUp)
                    BannerProfile.RollsSinceLast4StarsRateUp = 0;
                else BannerProfile.RollsSinceLast4StarsRateUp++;
            }

            return IsRateUp && Banner.FourStarsPool.Primary.length
                ? Banner.FourStarsPool.Primary[crypto.randomInt(Banner.FourStarsPool.Primary.length)]
                : Banner.FourStarsPool.Standard[crypto.randomInt(Banner.FourStarsPool.Standard.length)]
            ;
        };

        const FiveStarsHandler = (Rate?: GachaItems<boolean>[]) => {            
            const IsRateUp: boolean = Gacha(Rate ?? [
                { Value: true, Chance: 50 },
                { Value: false, Chance: 50 }
            ]);

            if(IsRateUp)
                BannerProfile.RollsSinceLast5StarsRateUp = 0;
            else BannerProfile.RollsSinceLast5StarsRateUp++;

            return IsRateUp
                ? Banner.FiveStarsPool.Primary[crypto.randomInt(Banner.FiveStarsPool.Primary.length)]
                : Banner.FiveStarsPool.Standard[crypto.randomInt(Banner.FiveStarsPool.Standard.length)]
            ;
        };

        const Output: string = Switch(Banner.Type, {
            [BannerTypes.Standard]: (): string => Switch(Result, {
                [Items.SixStars]: (): string => {
                    if(BannerProfile.Count > 150 && !BannerProfile.Focused) {
                        BannerProfile.Focused = true;
                        BannerProfile.RollsSinceLast6StarsRateUp = 0;
                        return Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)];
                    }
                    else if(crypto.randomInt(2)) {
                        BannerProfile.RollsSinceLast6StarsRateUp = 0;
                        return Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)];
                    }

                    BannerProfile.RollsSinceLast6StarsRateUp++;
                    return Banner.SixStarsPool.Standard[crypto.randomInt(Banner.SixStarsPool.Standard.length)];
                },
                [Items.FiveStars]: FiveStarsHandler,
                [Items.FourStars]: FourStarsHandler,
                [Items.ThreeStars]: (): string => Banner.ThreeStarsPool[crypto.randomInt(Banner.ThreeStarsPool.length)]
            }),

            [BannerTypes.Limited]: (): string => Switch(Result, {
                [Items.SixStars]: (): string => {
                    const SixStarRateUpResult: RateUp = Gacha([
                        { Value: RateUp.Primary, Chance: 70 },
                        { Value: RateUp.Secondary, Chance: 25 },
                        { Value: RateUp.None, Chance: 5 }
                    ]);

                    if(SixStarRateUpResult === RateUp.Primary || SixStarRateUpResult === RateUp.Secondary)
                        BannerProfile.RollsSinceLast6StarsRateUp = 0;
                    else BannerProfile.RollsSinceLast6StarsRateUp++;

                    return Switch(SixStarRateUpResult, {
                        [RateUp.Primary]: (): string => Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)],
                        [RateUp.Secondary]:  (): string => Banner.SixStarsPool.Secondary[crypto.randomInt(Banner.SixStarsPool.Secondary.length)],
                        [RateUp.None]:  (): string => Banner.SixStarsPool.Standard[crypto.randomInt(Banner.SixStarsPool.Standard.length)]
                    });
                },
                [Items.FiveStars]: FiveStarsHandler,
                [Items.FourStars]: FourStarsHandler,
                [Items.ThreeStars]: (): string => Banner.ThreeStarsPool[crypto.randomInt(Banner.ThreeStarsPool.length)]
            }),

            [BannerTypes.Crossover]: (): string => Switch(Result, {
                [Items.SixStars]: (): string => {
                    const IsRateUp: boolean = Gacha([
                        { Value: true, Chance: 70 },
                        { Value: false, Chance: 30 }
                    ]);

                    if(BannerProfile.RollsSinceLast6StarsRateUp >= 119 || IsRateUp) {
                        BannerProfile.RollsSinceLast6StarsRateUp = 0;
                        return Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)];
                    }

                    BannerProfile.RollsSinceLast6StarsRateUp++;
                    return Banner.SixStarsPool.Standard[crypto.randomInt(Banner.SixStarsPool.Primary.length)];
                },
                [Items.FiveStars]: (): string => {
                    const IsRateUp: boolean = Gacha([{ Value: true, Chance: 50 }, { Value: false, Chance: 50 }]);

                    if(BannerProfile.RollsSinceLast5StarsRateUp >= 49 || IsRateUp) {
                        BannerProfile.RollsSinceLast5StarsRateUp = 0;
                        return Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)];
                    }

                    BannerProfile.RollsSinceLast5StarsRateUp++;
                    return Banner.FiveStarsPool.Standard[crypto.randomInt(Banner.FiveStarsPool.Standard.length)];
                },
                [Items.FourStars]: FourStarsHandler,
                [Items.ThreeStars]: (): string => Banner.ThreeStarsPool[crypto.randomInt(Banner.ThreeStarsPool.length)]
            }),

            [BannerTypes.Orienteering]: (): string => Switch(Result, {
                [Items.SixStars]: (): string => Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)],
                [Items.FiveStars]: (): string => FiveStarsHandler([{ Value: true, Chance: 60 }, { Value: false, Chance: 40 }]),
                [Items.FourStars]: FourStarsHandler,
                [Items.ThreeStars]: (): string => Banner.ThreeStarsPool[crypto.randomInt(Banner.ThreeStarsPool.length)]
            }),

            [BannerTypes.JointOperation]: (): string => Switch(Result, {
                [Items.SixStars]: (): string => Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)],
                [Items.FiveStars]: (): string => Banner.FiveStarsPool.Primary[crypto.randomInt(Banner.FiveStarsPool.Primary.length)],
                [Items.FourStars]: FourStarsHandler,
                [Items.ThreeStars]: (): string => Banner.ThreeStarsPool[crypto.randomInt(Banner.ThreeStarsPool.length)]
            }),

            [BannerTypes.TFTW]: (): string => Switch(Result, {
                [Items.SixStars]: (): string => Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)],
                [Items.FiveStars]: (): string => FiveStarsHandler([{ Value: true, Chance: 60 }, { Value: false, Chance: 40 }]),
                [Items.FourStars]: (): string => FourStarsHandler([{ Value: true, Chance: 45 }, { Value: false, Chance: 55 }]),
                [Items.ThreeStars]: (): string => Banner.ThreeStarsPool[crypto.randomInt(Banner.ThreeStarsPool.length)]
            })
        });

        if(Result >= 5) {
            if(Result === Items.SixStars)
                BannerProfile.RollsWithoutSixStar = 0;
            BannerProfile.TenRolls = false;
        }

        if(!WriteDB)
            return [Output, Result];

        const ToWrite: number = Switch(Result, {
            [Items.SixStars]: (): number => {
                this.GachaProfiles[Token][BannerName].Storage.SixStars[Output] ??= 0;
                return ++this.GachaProfiles[Token][BannerName].Storage.SixStars[Output];
            },
            [Items.FiveStars]: (): number => {
                this.GachaProfiles[Token][BannerName].Storage.FiveStars[Output] ??= 0;
                return ++this.GachaProfiles[Token][BannerName].Storage.FiveStars[Output];
            },
            [Items.FourStars]: (): number => {
                this.GachaProfiles[Token][BannerName].Storage.FourStars[Output] ??= 0;
                return ++this.GachaProfiles[Token][BannerName].Storage.FourStars[Output];
            },
            [Items.ThreeStars]: (): number => {
                this.GachaProfiles[Token][BannerName].Storage.ThreeStars[Output] ??= 0;
                return ++this.GachaProfiles[Token][BannerName].Storage.ThreeStars[Output];
            }
        });

        this.RefreshStorageSTMT.run(
            Token,
            BannerName,
            Result,
            Output,
            ToWrite
        );

        this.RefreshDataSTMT.run(
            Token,
            BannerName,
            BannerProfile.Count,
            BannerProfile.RollsWithoutSixStar,
            BannerProfile.RollsSinceLast6StarsRateUp,
            BannerProfile.RollsSinceLast5StarsRateUp,
            BannerProfile.RollsSinceLast4StarsRateUp,
            Number(BannerProfile.Focused),
            Number(BannerProfile.TenRolls)
        );
        
        return [Output, Result];
    }

    public RollMultiReduced(Token: string, BannerName: string, Count: number): Record<string, number> | undefined {
        return this.RollMulti(Token, BannerName, Count)?.reduce((Acc: Record<string, number>, Item: string): Record<string, number> => {
            Acc[Item] ??= 0;
            Acc[Item]++;
            return Acc;
        }, {});
    }
    public RollMulti(Token: string, BannerName: string, Count: number): string[] | undefined {
        if(!this.GachaProfiles[Token])
            return;

        this.GachaProfiles[Token][BannerName] ??= {
            Count: 0,
            RollsWithoutSixStar: 0,
            RollsSinceLast6StarsRateUp: 0,
            RollsSinceLast5StarsRateUp: 0,
            RollsSinceLast4StarsRateUp: 0,
            Focused: false,
            TenRolls: false,
            Storage: {
                SixStars: {},
                FiveStars: {},
                FourStars: {},
                ThreeStars: {}
            }
        };

        const BannerProfile: ProfileBanner = this.GachaProfiles[Token][BannerName];

        const Result: [string, Items][] = [];
        while(Result.push(this.Roll(Token, BannerName, false)!) < Count);
        const OperatorMap: Record<string, Items> = Object.fromEntries(Result);
        
        for(const [OperatorID, Rarity] of Object.entries(OperatorMap)) {
            this.RefreshStorageSTMT.run(
                Token,
                BannerName,
                Rarity,
                OperatorID,
                Switch(Rarity, {
                    [Items.SixStars]: (): Record<string, number> => BannerProfile.Storage.SixStars,
                    [Items.FiveStars]: (): Record<string, number> => BannerProfile.Storage.FiveStars,
                    [Items.FourStars]: (): Record<string, number> => BannerProfile.Storage.FourStars,
                    [Items.ThreeStars]: (): Record<string, number> => BannerProfile.Storage.ThreeStars
                })[OperatorID]
            );
        }

        this.RefreshDataSTMT.run(
            Token,
            BannerName,
            BannerProfile.Count,
            BannerProfile.RollsWithoutSixStar,
            BannerProfile.RollsSinceLast6StarsRateUp,
            BannerProfile.RollsSinceLast5StarsRateUp,
            BannerProfile.RollsSinceLast4StarsRateUp,
            Number(BannerProfile.Focused),
            Number(BannerProfile.TenRolls)
        );
        return Result.map(Item => Item[0]);
    }
}();