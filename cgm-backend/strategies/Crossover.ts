import type { BannerStrategy, RollParams } from "../types/BannerStrategy.js";
import { Items } from "../types/Items.js";
import { BannerTypes } from "../types/BannerTypes.js";
import { RateUp } from "../types/RateUp.js";
import Switch from "../helpers/Switch.js";
import GenericFourStarsHandler from "../helpers/GenericFourStarsHandler.js";
import StrategyManager from "../singletons/StrategyManager.js";
import crypto from "crypto";

@StrategyManager.Register(BannerTypes.Crossover)
export default class Crossover implements BannerStrategy {
    public Roll({ Banner, Result, RU, Profile }: RollParams): string {
        return Switch(Result, {
            [Items.SixStars]: (): string => {
                if(Profile!.RollsSinceLast6StarsRateUp >= 119 || RU === RateUp.Primary) {
                    Profile!.RollsSinceLast6StarsRateUp = 0;
                    return Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)];
                }
                return Banner.SixStarsPool.Standard[crypto.randomInt(Banner.SixStarsPool.Primary.length)];
            },
            [Items.FiveStars]: (): string => {
                if(Profile!.RollsSinceLast5StarsRateUp >= 49 || RU === RateUp.Primary) {
                    const Remainings: string[] = Banner.FiveStarsPool.Primary.filter(OP => !Profile!.Storage.FiveStars[OP]);

                    return Remainings.length === 0
                        ? Banner.FiveStarsPool.Primary[crypto.randomInt(Banner.FiveStarsPool.Primary.length)]
                        : Remainings[crypto.randomInt(Remainings.length)]
                    ;
                }

                return Banner.FiveStarsPool.Standard[crypto.randomInt(Banner.FiveStarsPool.Standard.length)];
            },
            [Items.FourStars]: (): string => GenericFourStarsHandler(Banner, RU),
            [Items.ThreeStars]: (): string => Banner.ThreeStarsPool[crypto.randomInt(Banner.ThreeStarsPool.length)]
        });
    }
}