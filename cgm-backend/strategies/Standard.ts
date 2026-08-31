import type { BannerStrategy } from "../types/BannerStrategy.js";
import type { ProfileBanner } from "../types/GachaProfile.js";
import type { Banner } from "../types/Banner.js";
import { Items } from "../types/Items.js";
import { BannerTypes } from "../types/BannerTypes.js";
import Switch from "../helpers/Switch.js";
import crypto from "crypto";
import GenericFiveStarsHandler from "../helpers/GenericFiveStarsHandler.js";
import GenericFourStarsHandler from "../helpers/GenericFourStarsHandler.js";
import RegisterStrategy from "../helpers/RegisterStrategy.js";

@RegisterStrategy(BannerTypes.Standard)
export default class Standard implements BannerStrategy {
    public Roll(Banner: Banner, Profile: ProfileBanner, Result: Items): string {
        return Switch(Result, {
            [Items.SixStars]: (): string => {
                if(Profile.Count > 150 && !Profile.Focused) {
                    Profile.Focused = true;
                    Profile.RollsSinceLast6StarsRateUp = 0;
                    return Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)];
                }
                
                if(crypto.randomInt(2)) {
                    Profile.RollsSinceLast6StarsRateUp = 0;
                    return Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)];
                }

                Profile.RollsSinceLast6StarsRateUp++;
                return Banner.SixStarsPool.Standard[crypto.randomInt(Banner.SixStarsPool.Standard.length)];
            },
            [Items.FiveStars]: (): string => GenericFiveStarsHandler(Banner, Profile),
            [Items.FourStars]: (): string => GenericFourStarsHandler(Banner, Profile),
            [Items.ThreeStars]: (): string => Banner.ThreeStarsPool[crypto.randomInt(Banner.ThreeStarsPool.length)]
        });
    }
}