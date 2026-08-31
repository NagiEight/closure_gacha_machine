import { BannerTypes, Items, type Banner } from "../singletons/Database.js";
import type { BannerStrategy } from "../types/BannerStrategy.js";
import { type ProfileBanner } from "../singletons/GachaSystem.js";
import Switch from "../helpers/Switch.js";
import crypto from "crypto";
import Gacha from "../helpers/Gacha.js";
import GenericFourStarsHandler from "../helpers/GenericFourStarsHandler.js";
import RegisterStrategy from "../helpers/RegisterStrategy.js";

@RegisterStrategy(BannerTypes.Crossover)
export default class Crossover implements BannerStrategy {
    public Roll(Banner: Banner, Profile: ProfileBanner, Result: Items): string {
        return Switch(Result, {
            [Items.SixStars]: (): string => {
                const IsRateUp: boolean = Gacha([
                    { Value: true, Chance: 70 },
                    { Value: false, Chance: 30 }
                ]);

                if(Profile.RollsSinceLast6StarsRateUp >= 119 || IsRateUp) {
                    Profile.RollsSinceLast6StarsRateUp = 0;
                    return Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)];
                }

                Profile.RollsSinceLast6StarsRateUp++;
                return Banner.SixStarsPool.Standard[crypto.randomInt(Banner.SixStarsPool.Primary.length)];
            },
            [Items.FiveStars]: (): string => {
                const IsRateUp: boolean = Gacha([{ Value: true, Chance: 50 }, { Value: false, Chance: 50 }]);

                if(Profile.RollsSinceLast5StarsRateUp >= 49 || IsRateUp) {
                    Profile.RollsSinceLast5StarsRateUp = 0;
                    return Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)];
                }

                Profile.RollsSinceLast5StarsRateUp++;
                return Banner.FiveStarsPool.Standard[crypto.randomInt(Banner.FiveStarsPool.Standard.length)];
            },
            [Items.FourStars]: (): string => GenericFourStarsHandler(Banner, Profile),
            [Items.ThreeStars]: (): string => Banner.ThreeStarsPool[crypto.randomInt(Banner.ThreeStarsPool.length)]
        });
    }
}