import type { BannerStrategy, RollParams } from "@BannerStrategy";
import RateUp from "@RateUp";
import BannerTypes from "@BannerTypes";
import Items from "@Items";
import Switch from "@Switch";
import GenericFiveStarsHandler from "@GenericFiveStarsHandler";
import GenericFourStarsHandler from "@GenericFourStarsHandler";
import StrategyManager from "@StrategyManager";
import RandomItem from "@RandomItem";

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