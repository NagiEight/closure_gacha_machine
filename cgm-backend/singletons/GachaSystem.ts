import type { GachaItems } from "../helpers/Gacha.js";
import Database, { type Banner, BannerTypes } from "./Database.js";
import Gacha from "../helpers/Gacha.js";
import GenerateToken from "../helpers/GenerateToken.js";
import PityCalculator from "../helpers/PityCalculator.js";
import crypto from "crypto";

Database.DB.exec(`
    CREATE TABLE IF NOT EXISTS GachaData(
        UserToken TEXT NOT NULL,
        Banner TEXT NOT NULL,

        Count INTEGER NOT NULL,
        RollsWithoutSixStar INTEGER NOT NULL,
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

        Storage TEXT NOT NULL,

        PRIMARY KEY (UserToken, Banner, Rarity),
        FOREIGN KEY (UserToken) REFERENCES GachaProfiles(Token),

        CHECK(Rarity IN (3, 4, 5, 6))
    );

    CREATE TABLE IF NOT EXISTS GachaProfiles(
        Token TEXT PRIMARY KEY
    );
`);

export interface ProfileBanner {
    Count: number;
    RollsWithoutSixStar: number;
    Focused: boolean;
    TenRolls: boolean;
    Storage: {
        SixStars: string[];
        FiveStars: string[];
        FourStars: string[];
        ThreeStars: string[];
    };
}
export type GachaProfile = Record<string, ProfileBanner>;

export enum Items {
    SixStars,
    FiveStars,
    FourStars,
    ThreeStars
}

enum RateUp {
    Primary,
    Secondary,
    None
}

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
    TenRolls: 0 | 1;
}

class GachaSystem {
    private readonly GachaProfiles: Record<string, GachaProfile> = {};
    private readonly CreateGachaProfileSTMT = Database.DB.prepare<[string], void>(`
        INSERT INTO GachaProfiles
        (Token)
        VALUES(?)    
    `);
    private readonly RefreshStorageSTMT = Database.DB.prepare<[string, string, number, string], void>(`
        INSERT INTO GachaStorage
        (UserToken, Banner, Rarity, Storage)
        VALUES(?, ?, ?, ?)
        ON CONFLICT(UserToken, Banner, Rarity) DO UPDATE SET
            Storage = excluded.Storage
    `);
    private readonly RefreshDataSTMT = Database.DB.prepare<[string, string, number, number, number, number], void>(`
        INSERT INTO GachaData
        (UserToken, Banner, Count, RollsWithoutSixStar, Focused, TenRolls)
        VALUES(?, ?, ?, ?, ?, ?)
        ON CONFLICT(UserToken, Banner) DO UPDATE SET
            Count = excluded.Count,
            RollsWithoutSixStar = excluded.RollsWithoutSixStar,
            Focused = excluded.Focused,
            TenRolls = excluded.TenRolls
    `);
    private readonly DeleteProfileSTMT = Database.DB.transaction((Token: string): void => {
        Database.DB.prepare<[string], void>("DELETE FROM GachaStorage WHERE UserToken = ?").run(Token);
        Database.DB.prepare<[string], void>("DELETE FROM GachaData WHERE UserToken = ?").run(Token);
        Database.DB.prepare<[string], void>("DELETE FROM GachaProfiles WHERE UserToken = ?").run(Token);
    });

    public constructor() {
        const StorageQuery: GachaProfileStorageRow[] = Database.DB.prepare<[], GachaProfileStorageRow>(`
            SELECT GP.Token, GS.Banner, GS.Rarity, GS.Storage
            FROM GachaStorage GS JOIN GachaProfiles GP ON GP.Token = GS.UserToken
        `).all();
        const DataQuery: GachaProfileDataRow[] = Database.DB.prepare<[], GachaProfileDataRow>(`
            SELECT GP.Token, GD.Banner, GD.Focused, GD.RollsWithoutSixStar, GD.TenRolls
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
                    TenRolls: false,
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
                this.GachaProfiles[Token][Data.Banner].TenRolls = !!Data.TenRolls;
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
    public GetProfile(Token: string): GachaProfile | undefined {
        return this.GachaProfiles[Token];
    }
    public Roll(Token: string, BannerName: string, WriteDB: boolean = true): [string, number] | undefined {
        const Profile: ProfileBanner = this.GachaProfiles[Token][BannerName];
        const Banner: Banner | undefined = Database.Manager.GetBanner(BannerName);

        if(!Profile || !Banner) 
            return;

        Profile.Count += 1;

        let StandardRate: GachaItems<Items>[] = [
            { Value: Items.SixStars, Chance: 2 },
            { Value: Items.FiveStars, Chance: 8 },
            { Value: Items.FourStars, Chance: 50 },
            { Value: Items.ThreeStars, Chance: 40 }
        ];

        if(Profile.RollsWithoutSixStar > 50) 
            StandardRate = PityCalculator(StandardRate, Items.SixStars, (Profile.RollsWithoutSixStar - 50) * 2);
        if(Profile.Count === 9 && !Profile.TenRolls) {
            StandardRate = [
                { Value: Items.SixStars, Chance: 2 },
                { Value: Items.FiveStars, Chance: 98 }
            ];
        }

        const Result: Items = Gacha(StandardRate)!;

        const [Output, OutputRarity]: [string, 3 | 4 | 5 | 6] = {
            [BannerTypes.Standard]: {
                [Items.SixStars]: 
                    Profile.Count > 150 && !Profile.Focused 
                        ? (() => { 
                            Profile.Focused = true;
                            return [Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)], 6];
                        })()
                    : 
                    {
                        0: [Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)], 6],
                        1: [Banner.SixStarsPool.Standard[crypto.randomInt(Banner.SixStarsPool.Standard.length)], 6]
                    }[crypto.randomInt(2)],

                [Items.FiveStars]: {
                    0: [Banner.FiveStarsPool.Primary[crypto.randomInt(Banner.FiveStarsPool.Primary.length)], 5],
                    1: [Banner.FiveStarsPool.Standard[crypto.randomInt(Banner.FiveStarsPool.Standard.length)], 5]
                }[crypto.randomInt(2)],

                [Items.FourStars]: {
                    0: [Banner.FourStarsPool.Standard[crypto.randomInt(Banner.FourStarsPool.Standard.length)], 4],
                    1: [[Banner.FourStarsPool.Primary[crypto.randomInt(Banner.FourStarsPool.Primary.length)], 4]]
                }[Number(Banner.FourStarsPool.Primary.length && Gacha([{ Value: true, Chance: 20 }, { Value: false, Chance: 80 }])!)],

                [Items.ThreeStars]: [Banner.ThreeStarsPool[crypto.randomInt(Banner.ThreeStarsPool.length)], 3]
            }[Result],

            [BannerTypes.Limited]: {
                [Items.SixStars]: {
                    [RateUp.Primary]: [Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)], 6],
                    [RateUp.Secondary]: [Banner.SixStarsPool.Secondary[crypto.randomInt(Banner.SixStarsPool.Secondary.length)], 6],
                    [RateUp.None]: [Banner.SixStarsPool.Standard[crypto.randomInt(Banner.SixStarsPool.Standard.length)], 6]
                }[Gacha([{ Value: RateUp.Primary, Chance: 70 }, { Value: RateUp.Secondary, Chance: 25 }, { Value: RateUp.None, Chance: 5 }])!],

                [Items.FiveStars]: {
                    0: [Banner.FiveStarsPool.Primary[crypto.randomInt(Banner.FiveStarsPool.Primary.length)], 5],
                    1: [Banner.FiveStarsPool.Standard[crypto.randomInt(Banner.FiveStarsPool.Standard.length)], 5]
                }[crypto.randomInt(2)],

                [Items.FourStars]: {
                    0: [Banner.FourStarsPool.Standard[crypto.randomInt(Banner.FourStarsPool.Standard.length)], 4],
                    1: [[Banner.FourStarsPool.Primary[crypto.randomInt(Banner.FourStarsPool.Primary.length)], 4]]
                }[Number(Banner.FourStarsPool.Primary.length && Gacha([{ Value: true, Chance: 20 }, { Value: false, Chance: 80 }])!)],
                
                [Items.ThreeStars]: [Banner.ThreeStarsPool[crypto.randomInt(Banner.ThreeStarsPool.length)], 3]
            }[Result],

            [BannerTypes.Orienteering]: {
                [Items.SixStars]: [Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)], 6],

                [Items.FiveStars]: {
                    0: [Banner.FiveStarsPool.Standard[crypto.randomInt(Banner.FiveStarsPool.Standard.length)], 5],
                    1: [Banner.FiveStarsPool.Primary[crypto.randomInt(Banner.FiveStarsPool.Primary.length)], 5]
                }[Number(Gacha([{ Value: true, Chance: 60 }, { Value: false, Chance: 40 }])!)],

                [Items.FourStars]: {
                    0: [Banner.FourStarsPool.Standard[crypto.randomInt(Banner.FourStarsPool.Standard.length)], 4],
                    1: [[Banner.FourStarsPool.Primary[crypto.randomInt(Banner.FourStarsPool.Primary.length)], 4]]
                }[Number(Banner.FourStarsPool.Primary.length && Gacha([{ Value: true, Chance: 20 }, { Value: false, Chance: 80 }])!)],

                [Items.ThreeStars]: [Banner.ThreeStarsPool[crypto.randomInt(Banner.ThreeStarsPool.length)], 3]
            }[Result],

            [BannerTypes.JointOperation]: {
                [Items.SixStars]: [Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)], 6],

                [Items.FiveStars]: [Banner.FiveStarsPool.Primary[crypto.randomInt(Banner.FiveStarsPool.Primary.length)], 5],

                [Items.FourStars]: {
                    0: [Banner.FourStarsPool.Standard[crypto.randomInt(Banner.FourStarsPool.Standard.length)], 4],
                    1: [[Banner.FourStarsPool.Primary[crypto.randomInt(Banner.FourStarsPool.Primary.length)], 4]]
                }[Number(Banner.FourStarsPool.Primary.length && Gacha([{ Value: true, Chance: 20 }, { Value: false, Chance: 80 }])!)],

                [Items.ThreeStars]: [Banner.ThreeStarsPool[crypto.randomInt(Banner.ThreeStarsPool.length)], 3]
            }[Result],

            [BannerTypes.TFTW]: {
                [Items.SixStars]: [Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)], 6],

                [Items.FiveStars]: {
                    0: [Banner.FiveStarsPool.Standard[crypto.randomInt(Banner.FiveStarsPool.Standard.length)], 5],
                    1: [Banner.FiveStarsPool.Primary[crypto.randomInt(Banner.FiveStarsPool.Primary.length)], 5]
                }[Number(Gacha([{ Value: true, Chance: 60 }, { Value: false, Chance: 40 }])!)],

                [Items.FourStars]: {
                    0: [Banner.FourStarsPool.Standard[crypto.randomInt(Banner.FourStarsPool.Standard.length)], 4],
                    1: [[Banner.FourStarsPool.Primary[crypto.randomInt(Banner.FourStarsPool.Primary.length)], 4]]
                }[Number(Banner.FourStarsPool.Primary.length && Gacha([{ Value: true, Chance: 45 }, { Value: false, Chance: 55 }])!)],

                [Items.ThreeStars]: [Banner.ThreeStarsPool[crypto.randomInt(Banner.ThreeStarsPool.length)], 3]
            }[Result]
        }[Banner.Type] as [string, 3 | 4 | 5 | 6];


        const ToPush: string[] = {
            6: Profile.Storage.SixStars,
            5: Profile.Storage.FiveStars,
            4: Profile.Storage.FourStars,
            3: Profile.Storage.ThreeStars
        }[OutputRarity];
        ToPush.push(Output);

        if(OutputRarity === 6)
            Profile.RollsWithoutSixStar = 0;

        if(OutputRarity === 5 || OutputRarity === 6) 
            Profile.TenRolls = false;

        if(WriteDB) {
            this.RefreshStorageSTMT.run(
                Token,
                BannerName,
                OutputRarity,
                JSON.stringify(ToPush)
            );
            this.RefreshDataSTMT.run(
                Token,
                BannerName,
                Profile.Count,
                Profile.RollsWithoutSixStar,
                Number(Profile.Focused),
                Number(Profile.TenRolls)
            );
        }
        return [Output, OutputRarity];
    }
    public RollMulti(Token: string, BannerName: string, Count: number): string[] | undefined {
        const Profile: ProfileBanner = this.GachaProfiles[Token][BannerName];

        if(!Profile)
            return;

        const Result: [string, number][] = [];
        while(Result.push(this.Roll(Token, BannerName, false)!) < Count);
        const Rarities: Set<number> = new Set<number>(Result.map(Roll => Roll[1]));
        
        for(const OutputRarity of Rarities) {
            this.RefreshStorageSTMT.run(
                Token,
                BannerName,
                OutputRarity,
                JSON.stringify({
                    6: Profile.Storage.SixStars,
                    5: Profile.Storage.FiveStars,
                    4: Profile.Storage.FourStars,
                    3: Profile.Storage.ThreeStars
                }[OutputRarity])
            );
        }
        this.RefreshDataSTMT.run(
            Token, 
            BannerName, 
            Profile.Count, 
            Profile.RollsWithoutSixStar, 
            Number(Profile.Focused), 
            Number(Profile.TenRolls)
        );
        return Result.map(Roll => Roll[0]);
    }
}

export default new GachaSystem();