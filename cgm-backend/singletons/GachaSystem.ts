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
    Focused: 0 | 1;
    TenRolls: 0 | 1;
}

export default new class {
    private readonly GachaProfiles: Record<string, GachaProfile> = {};
    private readonly CreateGachaProfileSTMT = Database.DB.prepare<[string], void>(`
        INSERT INTO GachaProfiles
        (Token)
        VALUES(?)    
    `);
    private readonly RefreshStorageSTMT = Database.DB.prepare<[string, string, number, string, number], void>(`
        INSERT INTO GachaStorage
        (UserToken, Banner, Rarity, ID, Count)
        VALUES(?, ?, ?, ?, ?)
        ON CONFLICT(UserToken, Banner, Rarity, ID) DO UPDATE SET
            Count = excluded.Count
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
            SELECT GP.Token, GS.Banner, GS.Rarity, GS.ID, GS.Count
            FROM GachaStorage GS JOIN GachaProfiles GP ON GP.Token = GS.UserToken
        `).all();
        const DataQuery: GachaProfileDataRow[] = Database.DB.prepare<[], GachaProfileDataRow>(`
            SELECT GP.Token, GD.Banner, GD.Focused, GD.RollsWithoutSixStar, GD.TenRolls, GD.Count
            FROM GachaData GD JOIN GachaProfiles GP ON GP.TOKEN = GD.UserToken
        `).all();
        
        // this is slow as shit but it's okay because it only runs once
        for(const Token of Database.DB.prepare<[], { Token: string }>("SELECT * FROM GachaProfiles").all().map(Row => Row.Token)) {
            this.GachaProfiles[Token] ??= {};

            for(const Storage of StorageQuery) {
                if(Storage.UserToken !== Token) 
                    continue;
                
                this.GachaProfiles[Token][Storage.Banner] ??= {
                    Count: 0,
                    RollsWithoutSixStar: 0,
                    Focused: false,
                    TenRolls: false,
                    Storage: {
                        SixStars: {},
                        FiveStars: {},
                        FourStars: {},
                        ThreeStars: {}
                    }
                };

                switch(Storage.Rarity) {
                    case 3:
                        this.GachaProfiles[Token][Storage.Banner].Storage.ThreeStars[Storage.ID] = Storage.Count;
                        break;

                    case 4:
                        this.GachaProfiles[Token][Storage.Banner].Storage.FourStars[Storage.ID] = Storage.Count;
                        break;

                    case 5:
                        this.GachaProfiles[Token][Storage.Banner].Storage.FiveStars[Storage.ID] = Storage.Count;
                        break;

                    case 6:
                        this.GachaProfiles[Token][Storage.Banner].Storage.SixStars[Storage.ID] = Storage.Count;
                        break;
                }
            }

            for(const Data of DataQuery) {
                if(Data.UserToken !== Token)
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
    public Roll(Token: string, BannerName: string, WriteDB: boolean = true): [string, 3 | 4 | 5 | 6] | undefined {
        const Banner: Banner | undefined = Database.Manager.GetBanner(BannerName);
        const Profile = this.GachaProfiles[Token];
        
        if(!Banner || !Profile) 
            return;

        this.GachaProfiles[Token][BannerName] ??= {
            Count: 0,
            RollsWithoutSixStar: 0,
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
        if(BannerProfile.Count === 9 && !BannerProfile.TenRolls) {
            StandardRate = [
                { Value: Items.SixStars, Chance: 2 },
                { Value: Items.FiveStars, Chance: 98 }
            ];
        }

        const Result: Items = Gacha(StandardRate)!;
        let Output: string;
        let OutputRarity: 3 | 4 | 5 | 6;

        switch(Banner.Type) {
            case BannerTypes.Standard:
                switch(Result) {
                    case Items.SixStars:
                        BannerProfile.RollsWithoutSixStar = 0;
                        if(BannerProfile.Count > 150 && !BannerProfile.Focused) {
                            Output = Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)];
                            BannerProfile.Focused = true;
                        }
                        else if(crypto.randomInt(2) === 0) 
                            Output = Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)];
                        else Output = Banner.SixStarsPool.Standard[crypto.randomInt(Banner.SixStarsPool.Standard.length)];
                        OutputRarity = 6;
                        break;

                    case Items.FiveStars:
                        Output = crypto.randomInt(2) === 0 
                            ? Banner.FiveStarsPool.Primary[crypto.randomInt(Banner.FiveStarsPool.Primary.length)]
                            : Banner.FiveStarsPool.Standard[crypto.randomInt(Banner.FiveStarsPool.Standard.length)]
                        ;
                        OutputRarity = 5;
                        break;

                    case Items.FourStars:
                        const IsRateUp: boolean = Gacha([
                            { Value: true, Chance: 20 },
                            { Value: false, Chance: 80 }
                        ])!;
                        Output = Banner.FourStarsPool.Primary.length && IsRateUp 
                            ? Banner.FourStarsPool.Primary[crypto.randomInt(Banner.FourStarsPool.Primary.length)]
                            : Banner.FourStarsPool.Standard[crypto.randomInt(Banner.FourStarsPool.Standard.length)]
                        ;
                        OutputRarity = 4;
                        break;

                    case Items.ThreeStars:
                        Output = Banner.ThreeStarsPool[crypto.randomInt(Banner.ThreeStarsPool.length)];
                        OutputRarity = 3;
                        break;
                }
                break;

            case BannerTypes.Limited:
                switch(Result) {
                    case Items.SixStars:
                        BannerProfile.RollsWithoutSixStar = 0;
                        const LimitedRateUp: GachaItems<RateUp>[] = [
                            { Value: RateUp.Primary, Chance: 70 },
                            { Value: RateUp.Secondary, Chance: 25 },
                            { Value: RateUp.None, Chance: 5 },
                        ];
                        const SixStarRateUpResult: RateUp = Gacha(LimitedRateUp)!;

                        switch(SixStarRateUpResult) {
                            case RateUp.Primary:
                                Output = Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)];
                                break;

                            case RateUp.Secondary:
                                Output = Banner.SixStarsPool.Secondary[crypto.randomInt(Banner.SixStarsPool.Secondary.length)];
                                break;

                            case RateUp.None:
                                Output = Banner.SixStarsPool.Standard[crypto.randomInt(Banner.SixStarsPool.Standard.length)];
                                break;
                        }
                        OutputRarity = 6;
                        break;
                        
                    case Items.FiveStars:
                        Output = crypto.randomInt(2) === 0 
                            ? Banner.FiveStarsPool.Primary[crypto.randomInt(Banner.FiveStarsPool.Primary.length)]
                            : Banner.FiveStarsPool.Standard[crypto.randomInt(Banner.FiveStarsPool.Standard.length)]
                        ;
                        OutputRarity = 5;
                        break;
                        
                    case Items.FourStars:
                        const IsRateUp: boolean = Gacha([
                            { Value: true, Chance: 20 },
                            { Value: false, Chance: 80 }
                        ])!;
                        Output = Banner.FourStarsPool.Primary.length && IsRateUp 
                            ? Banner.FourStarsPool.Primary[crypto.randomInt(Banner.FourStarsPool.Primary.length)]
                            : Banner.FourStarsPool.Standard[crypto.randomInt(Banner.FourStarsPool.Standard.length)]
                        ;
                        OutputRarity = 4;
                        break;
                        
                    case Items.ThreeStars:
                        Output = Banner.ThreeStarsPool[crypto.randomInt(Banner.ThreeStarsPool.length)];
                        OutputRarity = 3;
                        break;
                    }
                    break;
                    
            case BannerTypes.Orienteering:
                switch(Result) {
                    case Items.SixStars:
                        BannerProfile.RollsWithoutSixStar = 0;
                        Output = Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)];
                        OutputRarity = 6;
                        break;

                    case Items.FiveStars:
                        const IsRateUp: boolean = Gacha([
                            { Value: true, Chance: 60 },
                            { Value: false, Chance: 40 }
                        ])!;
                        Output = IsRateUp 
                            ? Banner.FiveStarsPool.Primary[crypto.randomInt(Banner.FiveStarsPool.Primary.length)]
                            : Banner.FiveStarsPool.Standard[crypto.randomInt(Banner.FiveStarsPool.Standard.length)]
                        ;
                        OutputRarity = 5;
                        break;

                    case Items.FourStars:
                        Output = Banner.FourStarsPool.Standard[crypto.randomInt(Banner.FourStarsPool.Standard.length)];
                        OutputRarity = 4;
                        break;

                    case Items.ThreeStars:
                        Output = Banner.ThreeStarsPool[crypto.randomInt(Banner.ThreeStarsPool.length)];
                        OutputRarity = 3;
                        break;
                }
                break;
            
            case BannerTypes.JointOperation:
                switch(Result) {
                    case Items.SixStars:
                        BannerProfile.RollsWithoutSixStar = 0;
                        Output = Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)];
                        OutputRarity = 6;
                        break;

                    case Items.FiveStars:
                        Output = Banner.FiveStarsPool.Primary[crypto.randomInt(Banner.FiveStarsPool.Primary.length)];
                        OutputRarity = 5;
                        break;

                    case Items.FourStars:
                        const IsRateUp: boolean = Gacha([
                            { Value: true, Chance: 20 },
                            { Value: false, Chance: 80 }
                        ])!;
                        if(Banner.FourStarsPool.Primary.length && IsRateUp)
                            Output = Banner.FourStarsPool.Primary[crypto.randomInt(Banner.FourStarsPool.Primary.length)]
                        else Output = Banner.FourStarsPool.Standard[crypto.randomInt(Banner.FourStarsPool.Standard.length)];
                        OutputRarity = 4;
                        break;

                    case Items.ThreeStars:
                        Output = Banner.ThreeStarsPool[crypto.randomInt(Banner.ThreeStarsPool.length)];
                        OutputRarity = 3;
                        break;
                }
                break;
                
            case BannerTypes.TFTW:
                switch(Result) {
                    case Items.SixStars:
                        BannerProfile.RollsWithoutSixStar = 0;
                        Output = Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)];
                        OutputRarity = 6;
                        break;

                    case Items.FiveStars:
                        const IsRateUp: boolean = Gacha([
                            { Value: true, Chance: 60 },
                            { Value: false, Chance: 40 }
                        ])!;
                        Output = IsRateUp 
                            ? Banner.FiveStarsPool.Primary[crypto.randomInt(Banner.FiveStarsPool.Primary.length)]
                            : Banner.FiveStarsPool.Standard[crypto.randomInt(Banner.FiveStarsPool.Standard.length)]
                        ;
                        OutputRarity = 5;
                        break;

                    case Items.FourStars:
                        const Is4StarsRateUp: boolean = Gacha([
                            { Value: true, Chance: 45 },
                            { Value: false, Chance: 55 }
                        ])!;
                        Output = Banner.FourStarsPool.Primary.length && Is4StarsRateUp 
                            ? Banner.FourStarsPool.Primary[crypto.randomInt(Banner.FourStarsPool.Primary.length)]
                            : Banner.FourStarsPool.Standard[crypto.randomInt(Banner.FourStarsPool.Standard.length)]
                        ;
                        OutputRarity = 4;
                        break;

                    case Items.ThreeStars:
                        Output = Banner.ThreeStarsPool[crypto.randomInt(Banner.ThreeStarsPool.length)];
                        OutputRarity = 3;
                        break;
                }
                break;
                
            default:
                console.log("Defected database, please fix this shit.");
                return;
        }

        if(OutputRarity === 5 || OutputRarity === 6) 
            BannerProfile.TenRolls = false;

        let ToWrite: number;
        switch(OutputRarity) {
            case 3:
                this.GachaProfiles[Token][BannerName].Storage.ThreeStars[Output] ??= 0;
                this.GachaProfiles[Token][BannerName].Storage.ThreeStars[Output] += 1;
                ToWrite = this.GachaProfiles[Token][BannerName].Storage.ThreeStars[Output];
                break;
            case 4:
                this.GachaProfiles[Token][BannerName].Storage.FourStars[Output] ??= 0;
                this.GachaProfiles[Token][BannerName].Storage.FourStars[Output] += 1;
                ToWrite = this.GachaProfiles[Token][BannerName].Storage.FourStars[Output];
                break;
            case 5:
                this.GachaProfiles[Token][BannerName].Storage.FiveStars[Output] ??= 0;
                this.GachaProfiles[Token][BannerName].Storage.FiveStars[Output] += 1;
                ToWrite = this.GachaProfiles[Token][BannerName].Storage.FiveStars[Output];
                break;
            case 6:
                this.GachaProfiles[Token][BannerName].Storage.SixStars[Output] ??= 0;
                this.GachaProfiles[Token][BannerName].Storage.SixStars[Output] += 1;
                ToWrite = this.GachaProfiles[Token][BannerName].Storage.SixStars[Output];
                break;
        }

        if(WriteDB) {
            this.RefreshStorageSTMT.run(
                Token, 
                BannerName, 
                OutputRarity, 
                Output, 
                ToWrite
            );

            this.RefreshDataSTMT.run(
                Token,
                BannerName,
                BannerProfile.Count,
                BannerProfile.RollsWithoutSixStar,
                Number(BannerProfile.Focused),
                Number(BannerProfile.TenRolls)
            );
        }
        return [Output, OutputRarity];
    }
    public RollMulti(Token: string, BannerName: string, Count: number): string[] | undefined {
        const Profile: ProfileBanner = this.GachaProfiles[Token][BannerName];

        if(!Profile)
            return;

        const Result: [string, 3 | 4 | 5 | 6][] = [];
        while(Result.push(this.Roll(Token, BannerName, false)!) < Count);
        const OperatorMap: Record<string, { Count: number, Rarity: 3 | 4 | 5 | 6 }> = Result.reduce(
            (Acc: Record<string, { Count: number, Rarity: 3 | 4 | 5 | 6 }>, Item: [string, 3 | 4 | 5 | 6]) => {
                Acc[Item[0]] ??= {
                    Count: 0,
                    Rarity: Item[1]
                };
                Acc[Item[0]].Count++;
                return Acc;
            }, 
            {}
        );
        
        for(const [ID, Roll] of Object.entries(OperatorMap)) {
            this.RefreshStorageSTMT.run(
                Token,
                BannerName,
                Roll.Rarity,
                ID,
                {
                    6: Profile.Storage.SixStars,
                    5: Profile.Storage.FiveStars,
                    4: Profile.Storage.FourStars,
                    3: Profile.Storage.ThreeStars
                }[Roll.Rarity][ID]
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
}();