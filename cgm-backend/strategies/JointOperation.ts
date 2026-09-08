import type { BannerStrategy, RollParams } from "#types/BannerStrategy";
import { BannerTypes } from "#types/BannerTypes";
import { Items } from "#types/Items";
import Switch from "#helpers/Switch";
import GenericFourStarsHandler from "#helpers/GenericFourStarsHandler";
import StrategyManager from "#StrategyManager";
import crypto from "crypto";

@StrategyManager.Register(BannerTypes.JointOperation)
export default class JointOperation implements BannerStrategy {
    public Roll({ Banner, Result, RU }: RollParams): string {
        return Switch(Result, {
            [Items.SixStars]: (): string => Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)],
            [Items.FiveStars]: (): string => Banner.FiveStarsPool.Primary[crypto.randomInt(Banner.FiveStarsPool.Primary.length)],
            [Items.FourStars]: (): string => GenericFourStarsHandler(Banner, RU),
            [Items.ThreeStars]: (): string => Banner.ThreeStarsPool[crypto.randomInt(Banner.ThreeStarsPool.length)]
        });
    }
}