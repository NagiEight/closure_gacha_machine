import { BannerTypes, type Banner } from "../singletons/Database.js";
import type { BannerStrategy } from "../types/BannerStrategy.js";
import { type ProfileBanner, type Selection, Items } from "../singletons/GachaSystem.js";
import Switch from "../helpers/Switch.js";
import crypto from "crypto";
import Gacha from "../helpers/Gacha.js";
import GenericFourStarsHandler from "../helpers/GenericFourStarsHandler.js";
import RegisterStrategy from "../helpers/RegisterStrategy.js";

@RegisterStrategy(BannerTypes.Orienteering)
export default class Orienteering implements BannerStrategy {
    public Roll(Banner: Banner, Profile: ProfileBanner, Result: Items, Selection: Selection): string {
        return Switch(Result, {
            [Items.SixStars]: (): string => 
                Selection && Selection.SixStarsSelection[crypto.randomInt(Selection.SixStarsSelection.length)] ||
                Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)]
            ,
            [Items.FiveStars]: (): string => {
                const IsRateUp: boolean = Gacha([{ Value: true, Chance: 60 }, { Value: false, Chance: 40 }]);

                if(IsRateUp)
                    Profile.RollsSinceLast5StarsRateUp = 0;
                else Profile.RollsSinceLast5StarsRateUp++;

                return IsRateUp
                    ? Selection && Selection.FiveStarsSelection[crypto.randomInt(Selection.FiveStarsSelection.length)] ||
                        Banner.FiveStarsPool.Primary[crypto.randomInt(Banner.FiveStarsPool.Primary.length)]
                    : Banner.FiveStarsPool.Standard[crypto.randomInt(Banner.FiveStarsPool.Standard.length)]
                ;
            },
            [Items.FourStars]: (): string => GenericFourStarsHandler(Banner, Profile),
            [Items.ThreeStars]: (): string => Banner.ThreeStarsPool[crypto.randomInt(Banner.ThreeStarsPool.length)]
        });
    }
}