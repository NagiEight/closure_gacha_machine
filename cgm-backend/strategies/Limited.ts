import type { BannerStrategy, RollParams } from "#types/BannerStrategy";
import type { GachaItems } from "#helpers/Gacha";
import { BannerTypes } from "#types/BannerTypes";
import { Items } from "#types/Items";
import { RateUp } from "#types/RateUp";
import Switch from "#helpers/Switch";
import GenericFiveStarsHandler from "#helpers/GenericFiveStarsHandler";
import GenericFourStarsHandler from "#helpers/GenericFourStarsHandler";
import StrategyManager from "#StrategyManager";
import crypto from "crypto";

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
                [RateUp.Primary]: (): string => Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)],
                [RateUp.Secondary]:  (): string => Banner.SixStarsPool.Secondary[crypto.randomInt(Banner.SixStarsPool.Secondary.length)],
                [RateUp.None]:  (): string => Banner.SixStarsPool.Standard[crypto.randomInt(Banner.SixStarsPool.Standard.length)]
            }),
            [Items.FiveStars]: (): string => GenericFiveStarsHandler(Banner, RU),
            [Items.FourStars]: (): string => GenericFourStarsHandler(Banner, RU),
            [Items.ThreeStars]: (): string => Banner.ThreeStarsPool[crypto.randomInt(Banner.ThreeStarsPool.length)]
        });
    }
}