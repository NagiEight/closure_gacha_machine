import { BannerTypes, Items, type Banner } from "../singletons/Database.js";
import type { BannerStrategy } from "../types/BannerStrategy.js";
import { type ProfileBanner } from "../singletons/GachaSystem.js";
import Switch from "../helpers/Switch.js";
import crypto from "crypto";
import GenericFourStarsHandler from "../helpers/GenericFourStarsHandler.js";
import GenericFiveStarsHandler from "../helpers/GenericFiveStarsHandler.js";
import RegisterStrategy from "../helpers/RegisterStrategy.js";

@RegisterStrategy(BannerTypes.TFTW)
export default class JointOperation implements BannerStrategy {
    public Roll(Banner: Banner, Profile: ProfileBanner, Result: Items): string {
        return Switch(Result, {
            [Items.SixStars]: (): string => Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)],
            [Items.FiveStars]: (): string => GenericFiveStarsHandler(Banner, Profile, [{ Value: true, Chance: 60 }, { Value: false, Chance: 40 }]),
            [Items.FourStars]: (): string => GenericFourStarsHandler(Banner, Profile, [{ Value: true, Chance: 45 }, { Value: false, Chance: 55 }]),
            [Items.ThreeStars]: (): string => Banner.ThreeStarsPool[crypto.randomInt(Banner.ThreeStarsPool.length)]
        });
    }
}