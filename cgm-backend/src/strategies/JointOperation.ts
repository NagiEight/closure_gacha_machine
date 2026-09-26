import type { BannerStrategy, RollParams } from "@BannerStrategy";
import BannerTypes from "@BannerTypes";
import Items from "@Items";
import Switch from "@Switch";
import GenericFourStarsHandler from "@GenericFourStarsHandler";
import StrategyManager from "@StrategyManager";
import RandomItem from "@RandomItem";

@StrategyManager.Register(BannerTypes.JointOperation)
export default class JointOperation implements BannerStrategy {
    public Roll({ Banner, Result, RU }: RollParams): string {
        return Switch(Result, {
            [Items.SixStars]: (): string => RandomItem(Banner.SixStarsPool.Primary),
            [Items.FiveStars]: (): string => RandomItem(Banner.FiveStarsPool.Primary),
            [Items.FourStars]: (): string => GenericFourStarsHandler(Banner, RU),
            [Items.ThreeStars]: (): string => RandomItem(Banner.ThreeStarsPool)
        });
    }
}