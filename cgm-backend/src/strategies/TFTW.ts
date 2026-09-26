import type { BannerStrategy, RollParams } from "@BannerStrategy";
import type { GachaItems } from "@Gacha";
import RateUp from "@RateUp";
import BannerTypes from "@BannerTypes";
import Items from "@Items";
import Switch from "@Switch";
import GenericFourStarsHandler from "@GenericFourStarsHandler";
import GenericFiveStarsHandler from "@GenericFiveStarsHandler";
import StrategyManager from "@StrategyManager";
import RandomItem from "@RandomItem";

@StrategyManager.Register(BannerTypes.TFTW)
export default class JointOperation implements BannerStrategy {
    public readonly RateUp: Partial<Record<Items, GachaItems<RateUp>[]>> = {
        [Items.FiveStars]: [
            { Value: RateUp.Primary, Chance: 60 },
            { Value: RateUp.None, Chance: 40 }
        ],
        [Items.FourStars]: [
            { Value: RateUp.Primary, Chance: 45 },
            { Value: RateUp.None, Chance: 55 }
        ]
    };
    
    public Roll({ Banner, Result, RU }: RollParams): string {
        return Switch(Result, {
            [Items.SixStars]: (): string => RandomItem(Banner.SixStarsPool.Primary),
            [Items.FiveStars]: (): string => GenericFiveStarsHandler(Banner, RU),
            [Items.FourStars]: (): string => GenericFourStarsHandler(Banner, RU),
            [Items.ThreeStars]: (): string => RandomItem(Banner.ThreeStarsPool)
        });
    }
}