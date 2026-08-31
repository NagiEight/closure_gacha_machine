import type { GachaItems } from "./Gacha.js";
import type { Banner } from "../types/Banner.js";
import type { ProfileBanner } from "../types/GachaProfile.js";
import Gacha from "./Gacha.js";
import crypto from "crypto";

export default (Banner: Banner, Profile: ProfileBanner, Rate?: GachaItems<boolean>[]): string => {            
    const IsRateUp: boolean = Gacha(Rate ?? [
        { Value: true, Chance: 50 },
        { Value: false, Chance: 50 }
    ]);

    if(IsRateUp)
        Profile.RollsSinceLast5StarsRateUp = 0;
    else Profile.RollsSinceLast5StarsRateUp++;

    return IsRateUp
        ? Banner.FiveStarsPool.Primary[crypto.randomInt(Banner.FiveStarsPool.Primary.length)]
        : Banner.FiveStarsPool.Standard[crypto.randomInt(Banner.FiveStarsPool.Standard.length)]
    ;
};