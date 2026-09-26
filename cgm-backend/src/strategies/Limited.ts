import type { BannerStrategy, RollParams } from "@BannerStrategy";
import type { GachaItems } from "@Gacha";
import RateUp from "@RateUp";
import BannerTypes from "@BannerTypes";
import Items from "@Items";
import Switch from "@Switch";
import GenericFiveStarsHandler from "@GenericFiveStarsHandler";
import GenericFourStarsHandler from "@GenericFourStarsHandler";
import StrategyManager from "@StrategyManager";
import RandomItem from "@RandomItem";

@StrategyManager.Register(BannerTypes.Limited)
export default class Limited implements BannerStrategy {
    public readonly RateUp: Partial<Record<Items, GachaItems<RateUp>[]>> = {
        [Items.SixStars]: [
            { Value: RateUp.Primary, Chance: 70 },
            { Value: RateUp.Secondary, Chance: 25 },
            { Value: RateUp.None, Chance: 5 }
        ]
    };

    public Roll({ Banner, Result, RU }: RollParams): string {
        return Switch(Result, {
            [Items.SixStars]: (): string => Switch(RU, {
                [RateUp.Primary]: (): string => RandomItem(Banner.SixStarsPool.Primary),
                [RateUp.Secondary]:  (): string => RandomItem(Banner.SixStarsPool.Secondary),
                [RateUp.None]:  (): string => RandomItem(Banner.SixStarsPool.Standard)
            }),
            [Items.FiveStars]: (): string => GenericFiveStarsHandler(Banner, RU),
            [Items.FourStars]: (): string => GenericFourStarsHandler(Banner, RU),
            [Items.ThreeStars]: (): string => RandomItem(Banner.ThreeStarsPool)
        });
    }
}