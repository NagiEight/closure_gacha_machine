import type { BannerStrategy, RollParams } from "../types/BannerStrategy.js";
import { Items } from "../types/Items.js";
import { BannerTypes } from "../types/BannerTypes.js";
import { RateUp } from "../types/RateUp.js";
import type { GachaItems } from "../helpers/Gacha.js";
import Switch from "../helpers/Switch.js";
import GenericFourStarsHandler from "../helpers/GenericFourStarsHandler.js";
import GenericFiveStarsHandler from "../helpers/GenericFiveStarsHandler.js";
import StrategyManager from "../singletons/StrategyManager.js";
import crypto from "crypto";

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
            [Items.SixStars]: (): string => Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)],
            [Items.FiveStars]: (): string => GenericFiveStarsHandler(Banner, RU),
            [Items.FourStars]: (): string => GenericFourStarsHandler(Banner, RU),
            [Items.ThreeStars]: (): string => Banner.ThreeStarsPool[crypto.randomInt(Banner.ThreeStarsPool.length)]
        });
    }
}