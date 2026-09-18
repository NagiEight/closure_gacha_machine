import type { BannerStrategy, RollParams } from "#types/BannerStrategy";
import { Items } from "#types/Items";
import { BannerTypes } from "#types/BannerTypes";
import { RateUp } from "#types/RateUp";
import Switch from "../helpers/Switch.js";
import GenericFourStarsHandler from "../helpers/GenericFourStarsHandler.js";
import StrategyManager from "../singletons/StrategyManager.js";
import RandomItem from "../helpers/RandomItem.js";

@StrategyManager.Register(BannerTypes.Crossover)
export default class Crossover implements BannerStrategy {
    public Roll({ Banner, Result, RU, Profile }: RollParams): string {
        return Switch(Result, {
            [Items.SixStars]: (): string => {
                if(Profile.RollsSinceLast6StarsRateUp < 119 && RU !== RateUp.Primary) 
                    return RandomItem(Banner.SixStarsPool.Standard);

                Profile.RollsSinceLast6StarsRateUp = 0;
                return RandomItem(Banner.SixStarsPool.Primary);
            },
            [Items.FiveStars]: (): string => {
                if(Profile.RollsSinceLast5StarsRateUp < 49 && RU !== RateUp.Primary) 
                    return RandomItem(Banner.FiveStarsPool.Standard);
                
                const Remainings: string[] = Banner.FiveStarsPool.Primary.filter(OP => !Profile.Storage.FiveStars[OP]);

                return Remainings.length === 0
                    ? RandomItem(Banner.FiveStarsPool.Primary)
                    : RandomItem(Remainings)
                ;
            },
            [Items.FourStars]: (): string => GenericFourStarsHandler(Banner, RU),
            [Items.ThreeStars]: (): string => RandomItem(Banner.ThreeStarsPool)
        });
    }
}