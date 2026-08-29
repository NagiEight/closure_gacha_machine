import type { Banner } from "../singletons/Database.js";
import type { ProfileBanner } from "../singletons/GachaSystem.js";
import type { GachaItems } from "./Gacha.js";
import Gacha from "./Gacha.js";
import crypto from "crypto";

export default (Banner: Banner, Profile: ProfileBanner, Rate?: GachaItems<boolean>[]): string => {            
    const IsRateUp: boolean = Gacha(Rate ?? [
        { Value: true, Chance: 20 },
        { Value: false, Chance: 80 }
    ]);

    if(Banner.FourStarsPool.Primary.length) {
        if(IsRateUp)
            Profile.RollsSinceLast4StarsRateUp = 0;
        else Profile.RollsSinceLast4StarsRateUp++;
    }

    return IsRateUp && Banner.FourStarsPool.Primary.length
        ? Banner.FourStarsPool.Primary[crypto.randomInt(Banner.FourStarsPool.Primary.length)]
        : Banner.FourStarsPool.Standard[crypto.randomInt(Banner.FourStarsPool.Standard.length)]
    ;
};