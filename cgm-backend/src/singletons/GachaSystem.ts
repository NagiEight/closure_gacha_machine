import type { BannerStrategy } from "#types/BannerStrategy";
import type { GachaProfile, ProfileStorage, ProfileBanner } from "#types/GachaProfile";
import type { GachaProfileDataRow } from "#types/GachaProfileDataRow";
import type { GachaProfileStorageRow } from "#types/GachaProfileStorageRow";
import type { GachaItems } from "#helpers/Gacha";
import type { Selection } from "#types/BannerStrategy";
import type { Banner } from "#types/Banner";
import type UserDatabase from "#types/UserDatabase";
import AsyncMap from "#helpers/AsyncMap";
import Gacha from "#helpers/Gacha";
import GenerateToken from "#helpers/GenerateToken";
import LoadManager from "#helpers/LoadManager";
import PityCalculator from "#helpers/PityCalculator";
import Switch from "#helpers/Switch";
import StrategyManager from "#StrategyManager";
import BannerTypes from "#types/BannerTypes";
import Items from "#types/Items";
import RateUp from "#types/RateUp";
import Database from "#Database";

class GachaSystem {
    private readonly GachaProfiles: Record<string, GachaProfile> = {};
    private readonly StandardRate: Record<Items, GachaItems<RateUp>[]> = {
        [Items.SixStars]: [
            { Value: RateUp.Primary, Chance: 70 },
            { Value: RateUp.None, Chance: 30 }     
        ],
        [Items.FiveStars]: [
            { Value: RateUp.Primary, Chance: 50 },
            { Value: RateUp.None, Chance: 50 }
        ],
        [Items.FourStars]: [
            { Value: RateUp.Primary, Chance: 20 },
            { Value: RateUp.None, Chance: 80 }
        ],
        [Items.ThreeStars]: [
            { Value: RateUp.Primary, Chance: 100 }
        ]
    };
    
    private constructor(
        StorageQuery: GachaProfileStorageRow[],
        DataQuery: GachaProfileDataRow[],
        public readonly Manager: UserDatabase
    ) {
        DataQuery.forEach(Row => {
            const { Token, Banner, Focused, TenRolls, ...Rest } = Row;
            this.GachaProfiles[Token] ??= {};
            this.GachaProfiles[Token][Banner] ??= {
                ...Rest,
                Focused: !!Focused,
                TenRolls: !!TenRolls,
                Storage: {
                    SixStars: {},
                    FiveStars: {},
                    FourStars: {},
                    ThreeStars: {}
                }
            };
        });
        
        StorageQuery.forEach(Row => {
            const { Token, Banner, Rarity, ID, Count } = Row;
            const Storage: ProfileStorage = this.GachaProfiles[Token][Banner].Storage;
            Switch(Rarity, {
                6: (): Record<string, number> => Storage.SixStars,
                5: (): Record<string, number> => Storage.FiveStars,
                4: (): Record<string, number> => Storage.FourStars,
                3: (): Record<string, number> => Storage.ThreeStars
            })[ID] = Count;
        });
    }

    public static async New(): Promise<GachaSystem> {
        const Manager: UserDatabase = await (new (await LoadManager())).Initialize();
        const StorageQuery: GachaProfileStorageRow[] = await Manager.GetStorage();
        const DataQuery: GachaProfileDataRow[] = await Manager.GetData();
        const Instance: GachaSystem = new GachaSystem(
            StorageQuery,
            DataQuery,
            Manager
        );

        await StrategyManager.Load();
        return Instance;
    }

    public async CreateProfile(): Promise<string> {
        const Token: string = GenerateToken(Token => !!this.GachaProfiles[Token]);
        await this.Manager.CreateProfile(Token);
        this.GachaProfiles[Token] = {};
        return Token;
    }
    public async DeleteProfile(Token: string): Promise<void> {
        delete this.GachaProfiles[Token];
        await this.Manager.DeleteProfile(Token);
    }
    public async ResetBanner(Token: string, BannerName: string): Promise<void> {
        delete this.GachaProfiles[Token][BannerName];
        await this.Manager.ResetBanner(Token, BannerName);
    }
    public GetProfile(Token: string): GachaProfile | undefined {
        return this.GachaProfiles[Token];
    }
    
    public Roll(
        Count: number,
        Token: string,
        BannerName: string,
        Selection?: Selection,
        Reduced?: false
    ): Promise<[string, Items][] | undefined>;
    public Roll(
        Count: number,
        Token: string,
        BannerName: string, 
        Selection?: Selection,
        Reduced?: true
    ): Promise<Record<string, number> | undefined>;
    public async Roll(
        Count: number,
        Token: string,
        BannerName: string,
        Selection?: Selection,
        Reduced?: boolean
    ): Promise<[string, Items][] | Record<string, number> | undefined> {
        const Banner: Banner | undefined = Database.Manager.Banners.get(BannerName);

        if(!Banner || !this.GachaProfiles[Token])
            return;

        const Output: [string, Items][] | Record<string, number> = Reduced ? [] : {};
        const OutputMap: Map<string, Items> = new Map(); 

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

        const Profile: ProfileBanner = this.GachaProfiles[Token][BannerName];

        const StrategyClass: new () => BannerStrategy = StrategyManager.StrategyRegistry.get(Banner.Type)!;
        const Strategy: BannerStrategy = new StrategyClass();

        Profile.Count += Count;

        for(let _: number = 0; _ < Count; _++) {
            let StandardRate: GachaItems<Items>[] = [
                { Value: Items.SixStars, Chance: 2 },
                { Value: Items.FiveStars, Chance: 8 },
                { Value: Items.FourStars, Chance: 50 },
                { Value: Items.ThreeStars, Chance: 40 }
            ];

            if(Profile.RollsWithoutSixStar > 50)
                StandardRate = PityCalculator(StandardRate, Items.SixStars, (Profile.RollsWithoutSixStar - 50) * 2);
            if(Profile.Count === 9 && !Profile.TenRolls)
                StandardRate = [{ Value: Items.SixStars, Chance: 2 }, { Value: Items.FiveStars, Chance: 98 }];

            const Result: Items = Banner.Type === BannerTypes.Crossover && Profile.RollsSinceLast6StarsRateUp >= 119
                    ? Items.SixStars
                : Banner.Type === BannerTypes.Crossover && Profile.RollsSinceLast5StarsRateUp >= 49
                    ? Items.FiveStars
                : Gacha(StandardRate)
            ;

            const RU: RateUp = Gacha(Strategy.RateUp?.[Result] ?? this.StandardRate[Result]);

            Switch(Result, {
                [Items.SixStars]: (): void => {
                    Profile.RollsSinceLast5StarsRateUp++;
                    Profile.RollsSinceLast4StarsRateUp++;

                    if(RU !== RateUp.Primary) {
                        Profile.RollsSinceLast6StarsRateUp++;
                        return;
                    }

                    Profile.RollsSinceLast6StarsRateUp = 0;
                },
                [Items.FiveStars]: (): void => {
                    Profile.RollsSinceLast6StarsRateUp++;
                    Profile.RollsSinceLast4StarsRateUp++;

                    if(RU !== RateUp.Primary) {
                        Profile.RollsSinceLast5StarsRateUp++;
                        return;
                    }

                    Profile.RollsSinceLast5StarsRateUp = 0;
                },
                [Items.FourStars]: (): void => {
                    Profile.RollsSinceLast6StarsRateUp++;
                    Profile.RollsSinceLast5StarsRateUp++;

                    if(RU !== RateUp.Primary && Banner.FourStarsPool.Primary.length) {
                        Profile.RollsSinceLast4StarsRateUp++;
                        return;
                    }

                    Profile.RollsSinceLast4StarsRateUp = 0;
                },
                [Items.ThreeStars]: (): void => {
                    Profile.RollsSinceLast6StarsRateUp++;
                    Profile.RollsSinceLast5StarsRateUp++;
                    if(Banner.FourStarsPool.Primary.length) {
                        Profile.RollsSinceLast4StarsRateUp++;
                    }
                }
            });
            
            const RollResult: string = Strategy.Roll({ Banner, Profile, Result, RU, Selection });
            OutputMap.set(RollResult, Result);

            if(Reduced) {
                (Output as Record<string, number>)[RollResult] ??= 0;
                (Output as Record<string, number>)[RollResult]++;
            }
            else (Output as [string, number][]).push([RollResult, Result]);
            
            if(Result >= 5) {
                if(Result === Items.SixStars)
                    Profile.RollsWithoutSixStar = 0;
                Profile.TenRolls = true;
            }

            const { Storage } = Profile;
            const Rarity: Record<string, number> = Switch(Result, {
                [Items.SixStars]: (): Record<string, number> => Storage.SixStars,
                [Items.FiveStars]: (): Record<string, number> => Storage.FiveStars,
                [Items.FourStars]: (): Record<string, number> => Storage.FourStars,
                [Items.ThreeStars]: (): Record<string, number> => Storage.ThreeStars
            });
            
            Rarity[RollResult] ??= 0;
            Rarity[RollResult]++;
        }

        const { Storage, Focused, TenRolls, ...Rest } = Profile;

        await AsyncMap(
            Array.from(OutputMap),
            ([ID, Rarity]): Promise<any> => this.Manager.RefreshStorage({
                Token,
                Banner: BannerName,
                Rarity,
                ID,
                Count: Switch(Rarity, {
                    [Items.SixStars]: (): Record<string, number> => Storage.SixStars,
                    [Items.FiveStars]: (): Record<string, number> => Storage.FiveStars,
                    [Items.FourStars]: (): Record<string, number> => Storage.FourStars,
                    [Items.ThreeStars]: (): Record<string, number> => Storage.ThreeStars
                })[ID]
            })
        );

        await this.Manager.RefreshData({
            Token,
            Banner: BannerName,
            ...Rest,
            Focused: +Focused as 0 | 1,
            TenRolls: +TenRolls as 0 | 1
        });

        return Output;
    }

};

export default await GachaSystem.New();