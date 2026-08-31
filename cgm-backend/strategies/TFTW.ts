import type { BannerStrategy } from "../types/BannerStrategy.js";
import type { ProfileBanner } from "../types/GachaProfile.js";
import type { Banner } from "../types/Banner.js";
import { Items } from "../types/Items.js";
import { BannerTypes } from "../types/BannerTypes.js";
import Switch from "../helpers/Switch.js";
import GenericFourStarsHandler from "../helpers/GenericFourStarsHandler.js";
import GenericFiveStarsHandler from "../helpers/GenericFiveStarsHandler.js";
import StrategyManager from "../singletons/StrategyManager.js";
import crypto from "crypto";

@StrategyManager.Register(BannerTypes.TFTW)
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