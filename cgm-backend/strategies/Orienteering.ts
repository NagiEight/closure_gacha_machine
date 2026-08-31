import type { BannerStrategy, RollParams } from "../types/BannerStrategy.js";
import type { GachaItems } from "../helpers/Gacha.js";
import { Items } from "../types/Items.js";
import { BannerTypes } from "../types/BannerTypes.js";
import { RateUp } from "../types/RateUp.js";
import Switch from "../helpers/Switch.js";
import GenericFourStarsHandler from "../helpers/GenericFourStarsHandler.js";
import crypto from "crypto";
import StrategyManager from "../singletons/StrategyManager.js";

@StrategyManager.Register(BannerTypes.Orienteering)
export default class Orienteering implements BannerStrategy {
    public RateUp: Partial<Record<Items, GachaItems<RateUp>[]>> = {
        [Items.FiveStars]: [
            { Value: RateUp.Primary, Chance: 60 },
            { Value: RateUp.None, Chance: 40 }
        ]
    };

    public Roll({ Banner, Result, RU, Selection }: RollParams): string {
        return Switch(Result, {
            [Items.SixStars]: (): string => 
                Selection && Selection.SixStarsSelection[crypto.randomInt(Selection.SixStarsSelection.length)] ||
                Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)]
            ,
            [Items.FiveStars]: (): string => RU === RateUp.Primary
                ? Selection && Selection.FiveStarsSelection[crypto.randomInt(Selection.FiveStarsSelection.length)] ||
                    Banner.FiveStarsPool.Primary[crypto.randomInt(Banner.FiveStarsPool.Primary.length)]
                : Banner.FiveStarsPool.Standard[crypto.randomInt(Banner.FiveStarsPool.Standard.length)]
            ,
            [Items.FourStars]: (): string => GenericFourStarsHandler(Banner, RU),
            [Items.ThreeStars]: (): string => Banner.ThreeStarsPool[crypto.randomInt(Banner.ThreeStarsPool.length)]
        });
    }
}