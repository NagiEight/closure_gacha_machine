import { BannerTypes, type Banner } from "../singletons/Database.js";
import type { BannerStrategy } from "../types/BannerStrategy.js";
import { type ProfileBanner, Items } from "../singletons/GachaSystem.js";
import Switch from "../helpers/Switch.js";
import crypto from "crypto";
import GenericFourStarsHandler from "../helpers/GenericFourStarsHandler.js";
import RegisterStrategy from "../helpers/RegisterStrategy.js";

@RegisterStrategy(BannerTypes.JointOperation)
export default class JointOperation implements BannerStrategy {
    public Roll(Banner: Banner, Profile: ProfileBanner, Result: Items): string {
        return Switch(Result, {
            [Items.SixStars]: (): string => Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)],
            [Items.FiveStars]: (): string => Banner.FiveStarsPool.Primary[crypto.randomInt(Banner.FiveStarsPool.Primary.length)],
            [Items.FourStars]: (): string => GenericFourStarsHandler(Banner, Profile),
            [Items.ThreeStars]: (): string => Banner.ThreeStarsPool[crypto.randomInt(Banner.ThreeStarsPool.length)]
        });
    }
}