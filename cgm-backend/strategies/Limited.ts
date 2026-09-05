import type { BannerStrategy, RollParams } from "../types/BannerStrategy.js";
import type { GachaItems } from "../helpers/Gacha.js";
import { BannerTypes } from "../types/BannerTypes.js";
import { Items } from "../types/Items.js";
import { RateUp } from "../types/RateUp.js";
import Switch from "../helpers/Switch.js";
import GenericFiveStarsHandler from "../helpers/GenericFiveStarsHandler.js";
import GenericFourStarsHandler from "../helpers/GenericFourStarsHandler.js";
import StrategyManager from "../singletons/StrategyManager.js";
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