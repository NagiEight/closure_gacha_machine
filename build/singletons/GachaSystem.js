import UserDatabase from "#types/UserDatabase";
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
import DataManager from "#DataManager";
export default await new class GachaSystem {
    GachaProfiles = {};
    StandardRate = {
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
    Manager;
    /**
     * Factory method for handling asynchronous dynamic importing that can't be done in the constructor.
     */
    async Initialize() {
        const Manager = await new (await LoadManager())().Initialize();
        if (!(Manager instanceof UserDatabase))
            throw new TypeError("Database manager must inherit from UserDatabase or any of its children.");
        const StorageQuery = await Manager.GetStorage();
        const DataQuery = await Manager.GetData();
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
            const Storage = this.GachaProfiles[Token][Banner].Storage;
            Switch(Rarity, {
                6: Storage.SixStars,
                5: Storage.FiveStars,
                4: Storage.FourStars,
                3: Storage.ThreeStars
            })[ID] = Count;
        });
        this.Manager = Manager;
        await StrategyManager.Load();
        return this;
    }
    async CreateProfile() {
        const Token = GenerateToken(Token => !!this.GachaProfiles[Token]);
        await this.Manager.CreateProfile(Token);
        this.GachaProfiles[Token] = {};
        return Token;
    }
    async DeleteProfile(Token) {
        delete this.GachaProfiles[Token];
        await this.Manager.DeleteProfile(Token);
    }
    async ResetBanner(Token, BannerName) {
        delete this.GachaProfiles[Token][BannerName];
        await this.Manager.ResetBanner(Token, BannerName);
    }
    GetProfile(Token) {
        return this.GachaProfiles[Token];
    }
    async Roll(Count, Token, BannerName, { Selection, Reduced } = {}) {
        const Banner = DataManager.Banners.get(BannerName);
        if (!Banner || !this.GachaProfiles[Token])
            return;
        const Output = Reduced ? [] : {};
        const OutputMap = new Map();
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
        const Profile = this.GachaProfiles[Token][BannerName];
        const StrategyClass = StrategyManager.StrategyRegistry.get(Banner.Type);
        const Strategy = new StrategyClass();
        const { Storage, Focused, TenRolls, ...Rest } = Profile;
        for (let _ = 0; _ < Count; _++) {
            Profile.Count++;
            let StandardRate = [
                { Value: Items.SixStars, Chance: 2 },
                { Value: Items.FiveStars, Chance: 8 },
                { Value: Items.FourStars, Chance: 50 },
                { Value: Items.ThreeStars, Chance: 40 }
            ];
            if (Profile.RollsWithoutSixStar > 50)
                StandardRate = PityCalculator(StandardRate, Items.SixStars, (Profile.RollsWithoutSixStar - 50) * 2);
            if (Profile.Count === 9 && !Profile.TenRolls)
                StandardRate = [{ Value: Items.SixStars, Chance: 2 }, { Value: Items.FiveStars, Chance: 98 }];
            const Result = Banner.Type === BannerTypes.Crossover && Profile.RollsSinceLast6StarsRateUp >= 119
                ? Items.SixStars
                : Banner.Type === BannerTypes.Crossover && Profile.RollsSinceLast5StarsRateUp >= 49
                    ? Items.FiveStars
                    : Gacha(StandardRate);
            const RU = Gacha(Strategy.RateUp?.[Result] ?? this.StandardRate[Result]);
            Switch(Result, {
                [Items.SixStars]: () => {
                    Profile.RollsSinceLast5StarsRateUp++;
                    Profile.RollsSinceLast4StarsRateUp++;
                    if (RU !== RateUp.Primary) {
                        Profile.RollsSinceLast6StarsRateUp++;
                        return;
                    }
                    Profile.RollsSinceLast6StarsRateUp = 0;
                },
                [Items.FiveStars]: () => {
                    Profile.RollsSinceLast6StarsRateUp++;
                    Profile.RollsSinceLast4StarsRateUp++;
                    if (RU !== RateUp.Primary) {
                        Profile.RollsSinceLast5StarsRateUp++;
                        return;
                    }
                    Profile.RollsSinceLast5StarsRateUp = 0;
                },
                [Items.FourStars]: () => {
                    Profile.RollsSinceLast6StarsRateUp++;
                    Profile.RollsSinceLast5StarsRateUp++;
                    if (RU !== RateUp.Primary && Banner.FourStarsPool.Primary.length) {
                        Profile.RollsSinceLast4StarsRateUp++;
                        return;
                    }
                    Profile.RollsSinceLast4StarsRateUp = 0;
                },
                [Items.ThreeStars]: () => {
                    Profile.RollsSinceLast6StarsRateUp++;
                    Profile.RollsSinceLast5StarsRateUp++;
                    if (Banner.FourStarsPool.Primary.length) {
                        Profile.RollsSinceLast4StarsRateUp++;
                    }
                }
            });
            const RollResult = Strategy.Roll(Banner, Result, RU, { Profile, Selection });
            OutputMap.set(RollResult, Result);
            if (Reduced) {
                Output[RollResult] ??= 0;
                Output[RollResult]++;
            }
            else
                Output.push([RollResult, Result]);
            if (Result >= 5) {
                if (Result === Items.SixStars)
                    Profile.RollsWithoutSixStar = 0;
                Profile.TenRolls = true;
            }
            const Rarity = Switch(Result, {
                [Items.SixStars]: Storage.SixStars,
                [Items.FiveStars]: Storage.FiveStars,
                [Items.FourStars]: Storage.FourStars,
                [Items.ThreeStars]: Storage.ThreeStars
            });
            Rarity[RollResult] ??= 0;
            Rarity[RollResult]++;
        }
        await AsyncMap(Array.from(OutputMap), ([ID, Rarity]) => this.Manager.RefreshStorage({
            Token,
            Banner: BannerName,
            Rarity,
            ID,
            Count: Switch(Rarity, {
                [Items.SixStars]: Storage.SixStars,
                [Items.FiveStars]: Storage.FiveStars,
                [Items.FourStars]: Storage.FourStars,
                [Items.ThreeStars]: Storage.ThreeStars
            })[ID]
        }));
        await this.Manager.RefreshData({
            Token,
            Banner: BannerName,
            ...Rest,
            Focused: +Focused,
            TenRolls: +TenRolls
        });
        return Output;
    }
}().Initialize();
