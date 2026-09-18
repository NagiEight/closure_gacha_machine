import type { BannerStrategy, RollParams } from "#types/BannerStrategy";
import type { GachaItems } from "#helpers/Gacha";
import { BannerTypes } from "#types/BannerTypes";
import { Items } from "#types/Items";
import { RateUp } from "#types/RateUp";
import Switch from "#helpers/Switch";
import GenericFiveStarsHandler from "#helpers/GenericFiveStarsHandler";
import GenericFourStarsHandler from "#helpers/GenericFourStarsHandler";
import StrategyManager from "#StrategyManager";
import RandomItem from "#helpers/RandomItem";

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