import type { BannerStrategy, RollParams } from "#types/BannerStrategy";
import { BannerTypes } from "#types/BannerTypes";
import { Items } from "#types/Items";
import Switch from "#helpers/Switch";
import GenericFourStarsHandler from "#helpers/GenericFourStarsHandler";
import StrategyManager from "#StrategyManager";
import RandomItem from "#helpers/RandomItem";

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