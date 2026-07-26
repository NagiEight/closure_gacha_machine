import type { GachaItems } from "../helpers/Gacha.js";
import Database, { type Banner, BannerTypes } from "./Database.js";
import Gacha from "../helpers/Gacha.js";
import GenerateToken from "../helpers/GenerateToken.js";
import PityCalculator from "../helpers/PityCalculator.js";
import crypto from "crypto";

/** 
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

        CHECK (Rarity IN (3, 4, 5, 6))
    );

    CREATE TABLE IF NOT EXISTS GachaProfiles(
        Token TEXT PRIMARY KEY
    );
*/

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
        (UserToken, Banner, Count, RollsWithoutSixStar, Focused)
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
        let Output: string;
        let OutputRarity: number;

        switch(Banner.Type) {
            case BannerTypes.Standard:
                switch(Result) {
                    case Items.SixStars:
                        Profile.RollsWithoutSixStar = 0;
                        if(Profile.Count > 150 && !Profile.Focused) {
                            Output = Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)];
                            Profile.Focused = true;
                        }
                        else if(crypto.randomInt(2) === 0) 
                            Output = Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)];
                        else Output = Banner.SixStarsPool.Standard[crypto.randomInt(Banner.SixStarsPool.Standard.length)];
                        Profile.Storage.SixStars.push(Output);
                        OutputRarity = 6;
                        break;

                    case Items.FiveStars:
                        if(crypto.randomInt(2) === 0) 
                            Output = Banner.FiveStarsPool.Primary[crypto.randomInt(Banner.FiveStarsPool.Primary.length)];
                        else Output = Banner.FiveStarsPool.Standard[crypto.randomInt(Banner.FiveStarsPool.Standard.length)];
                        Profile.Storage.FiveStars.push(Output);
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
                        Profile.Storage.FourStars.push(Output);
                        OutputRarity = 4;
                        break;

                    case Items.ThreeStars:
                        Output = Banner.ThreeStarsPool[crypto.randomInt(Banner.ThreeStarsPool.length)];
                        Profile.Storage.ThreeStars.push(Output);
                        OutputRarity = 3;
                        break;
                }
                break;

            case BannerTypes.Limited:
                switch(Result) {
                    case Items.SixStars:
                        Profile.RollsWithoutSixStar = 0;
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
                        Profile.Storage.SixStars.push(Output);
                        OutputRarity = 6;
                        break;
                        
                    case Items.FiveStars:
                        if(crypto.randomInt(2) === 0) 
                            Output = Banner.FiveStarsPool.Primary[crypto.randomInt(Banner.FiveStarsPool.Primary.length)];
                        else Output = Banner.FiveStarsPool.Standard[crypto.randomInt(Banner.FiveStarsPool.Standard.length)];
                        Profile.Storage.FiveStars.push(Output);
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
                        Profile.Storage.FourStars.push(Output);
                        OutputRarity = 4;
                        break;
                        
                    case Items.ThreeStars:
                        Output = Banner.ThreeStarsPool[crypto.randomInt(Banner.ThreeStarsPool.length)];
                        Profile.Storage.ThreeStars.push(Output);
                        OutputRarity = 3;
                        break;
                    }
                    break;
                    
            case BannerTypes.Orienteering:
                switch(Result) {
                    case Items.SixStars:
                        Profile.RollsWithoutSixStar = 0;
                        Output = Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)];
                        Profile.Storage.SixStars.push(Output);
                        OutputRarity = 6;
                        break;

                    case Items.FiveStars:
                        const IsRateUp: boolean = Gacha([
                            { Value: true, Chance: 60 },
                            { Value: false, Chance: 40 }
                        ])!;
                        if(IsRateUp) 
                            Output = Banner.FiveStarsPool.Primary[crypto.randomInt(Banner.FiveStarsPool.Primary.length)];
                        else Output = Banner.FiveStarsPool.Standard[crypto.randomInt(Banner.FiveStarsPool.Standard.length)];
                        Profile.Storage.FiveStars.push(Output);
                        OutputRarity = 5;
                        break;

                    case Items.FourStars:
                        Output = Banner.FourStarsPool.Standard[crypto.randomInt(Banner.FourStarsPool.Standard.length)];
                        Profile.Storage.FourStars.push(Output);
                        OutputRarity = 4;
                        break;

                    case Items.ThreeStars:
                        Output = Banner.ThreeStarsPool[crypto.randomInt(Banner.ThreeStarsPool.length)];
                        Profile.Storage.ThreeStars.push(Output);
                        OutputRarity = 3;
                        break;
                }
                break;
            
            case BannerTypes.JointOperation:
                switch(Result) {
                    case Items.SixStars:
                        Profile.RollsWithoutSixStar = 0;
                        Output = Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)];
                        Profile.Storage.SixStars.push(Output);
                        OutputRarity = 6;
                        break;

                    case Items.FiveStars:
                        Output = Banner.FiveStarsPool.Primary[crypto.randomInt(Banner.FiveStarsPool.Primary.length)];
                        Profile.Storage.FiveStars.push(Output);
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
                        Profile.Storage.FourStars.push(Output);
                        OutputRarity = 4;
                        break;

                    case Items.ThreeStars:
                        Output = Banner.ThreeStarsPool[crypto.randomInt(Banner.ThreeStarsPool.length)];
                        Profile.Storage.ThreeStars.push(Output);
                        OutputRarity = 3;
                        break;
                }
                break;
                
            case BannerTypes.TFTW:
                switch(Result) {
                    case Items.SixStars:
                        Profile.RollsWithoutSixStar = 0;
                        Output = Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)];
                        Profile.Storage.SixStars.push(Output);
                        OutputRarity = 6;
                        break;

                    case Items.FiveStars:
                        const Is5StarsRateUp: boolean = Gacha([
                            { Value: true, Chance: 60 },
                            { Value: false, Chance: 40 }
                        ])!;
                        if(Is5StarsRateUp) 
                            Output = Banner.FiveStarsPool.Primary[crypto.randomInt(Banner.FiveStarsPool.Primary.length)];
                        else Output = Banner.FiveStarsPool.Standard[crypto.randomInt(Banner.FiveStarsPool.Standard.length)];
                        Profile.Storage.FiveStars.push(Output);
                        OutputRarity = 5;
                        break;

                    case Items.FourStars:
                        const Is4StarsRateUp: boolean = Gacha([
                            { Value: true, Chance: 45 },
                            { Value: false, Chance: 55 }
                        ])!;
                        if(Banner.FourStarsPool.Primary.length && Is4StarsRateUp)
                            Output = Banner.FourStarsPool.Primary[crypto.randomInt(Banner.FourStarsPool.Primary.length)]
                        else Output = Banner.FourStarsPool.Standard[crypto.randomInt(Banner.FourStarsPool.Standard.length)];
                        Profile.Storage.FourStars.push(Output);
                        OutputRarity = 4;
                        break;

                    case Items.ThreeStars:
                        Output = Banner.ThreeStarsPool[crypto.randomInt(Banner.ThreeStarsPool.length)];
                        Profile.Storage.ThreeStars.push(Output);
                        OutputRarity = 3;
                        break;
                }
                break;
                
            default:
                console.log("Defected database, please fix this shit.");
                return;
        }

        if(OutputRarity === 5 || OutputRarity === 6) 
            Profile.TenRolls = false;

        if(WriteDB) {
            this.RefreshStorageSTMT.run(Token, BannerName, OutputRarity, JSON.stringify(
                OutputRarity === 3 
                    ? Profile.Storage.ThreeStars
                : OutputRarity === 4 
                    ? Profile.Storage.FourStars
                : OutputRarity === 5
                    ? Profile.Storage.FiveStars
                : Profile.Storage.SixStars
            ));

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
            this.RefreshStorageSTMT.run(Token, BannerName, OutputRarity, JSON.stringify(
                OutputRarity === 3 
                    ? Profile.Storage.ThreeStars
                : OutputRarity === 4 
                    ? Profile.Storage.FourStars
                : OutputRarity === 5
                    ? Profile.Storage.FiveStars
                : Profile.Storage.SixStars
            ));
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