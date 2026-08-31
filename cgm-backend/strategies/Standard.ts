import type { BannerStrategy, RollParams } from "../types/BannerStrategy.js";
import { Items } from "../types/Items.js";
import { BannerTypes } from "../types/BannerTypes.js";
import Switch from "../helpers/Switch.js";
import GenericFiveStarsHandler from "../helpers/GenericFiveStarsHandler.js";
import GenericFourStarsHandler from "../helpers/GenericFourStarsHandler.js";
import StrategyManager from "../singletons/StrategyManager.js";
import crypto from "crypto";

@StrategyManager.Register(BannerTypes.Standard)
export default class Standard implements BannerStrategy {
    public Roll({ Banner, Result, RU, Profile }: RollParams): string {
        return Switch(Result, {
            [Items.SixStars]: (): string => {
                if(Profile!.Count > 150 && !Profile!.Focused) {
                    Profile!.Focused = true;
                    return Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)];
                }
                
                if(crypto.randomInt(2)) 
                    return Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)];
                
                return Banner.SixStarsPool.Standard[crypto.randomInt(Banner.SixStarsPool.Standard.length)];
            },
            [Items.FiveStars]: (): string => GenericFiveStarsHandler(Banner, RU),
            [Items.FourStars]: (): string => GenericFourStarsHandler(Banner, RU),
            [Items.ThreeStars]: (): string => Banner.ThreeStarsPool[crypto.randomInt(Banner.ThreeStarsPool.length)]
        });
    }
}