import type { BannerStrategy, RollParams } from "#types/BannerStrategy";
import { Items } from "#types/Items";
import { BannerTypes } from "#types/BannerTypes";
import { RateUp } from "#types/RateUp";
import Switch from "#helpers/Switch";
import GenericFiveStarsHandler from "#helpers/GenericFiveStarsHandler";
import GenericFourStarsHandler from "#helpers/GenericFourStarsHandler";
import StrategyManager from "#StrategyManager";
import RandomItem from "#helpers/RandomItem";

@StrategyManager.Register(BannerTypes.Standard)
export default class Standard implements BannerStrategy {
    public Roll({ Banner, Result, RU, Profile }: RollParams): string {
        return Switch(Result, {
            [Items.SixStars]: (): string => {
                if((Profile.Count <= 149 || Profile.Focused) && RU !== RateUp.Primary)
                    return RandomItem(Banner.SixStarsPool.Standard);

                Profile.Focused = true;
                return RandomItem(Banner.SixStarsPool.Primary);
            },
            [Items.FiveStars]: (): string => GenericFiveStarsHandler(Banner, RU),
            [Items.FourStars]: (): string => GenericFourStarsHandler(Banner, RU),
            [Items.ThreeStars]: (): string => RandomItem(Banner.ThreeStarsPool)
        });
    }
}