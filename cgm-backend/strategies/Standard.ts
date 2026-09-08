import type { BannerStrategy, RollParams } from "#types/BannerStrategy";
import { Items } from "#types/Items";
import { BannerTypes } from "#types/BannerTypes";
import { RateUp } from "#types/RateUp";
import Switch from "#helpers/Switch";
import GenericFiveStarsHandler from "#helpers/GenericFiveStarsHandler";
import GenericFourStarsHandler from "#helpers/GenericFourStarsHandler";
import StrategyManager from "#StrategyManager";
import crypto from "crypto";

@StrategyManager.Register(BannerTypes.Standard)
export default class Standard implements BannerStrategy {
    public Roll({ Banner, Result, RU, Profile }: RollParams): string {
        return Switch(Result, {
            [Items.SixStars]: (): string => {
                if(Profile.Count > 149 && !Profile.Focused || RU === RateUp.Primary) {
                    Profile.Focused = true;
                    return Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)];
                }
                
                return Banner.SixStarsPool.Standard[crypto.randomInt(Banner.SixStarsPool.Standard.length)];
            },
            [Items.FiveStars]: (): string => GenericFiveStarsHandler(Banner, RU),
            [Items.FourStars]: (): string => GenericFourStarsHandler(Banner, RU),
            [Items.ThreeStars]: (): string => Banner.ThreeStarsPool[crypto.randomInt(Banner.ThreeStarsPool.length)]
        });
    }
}