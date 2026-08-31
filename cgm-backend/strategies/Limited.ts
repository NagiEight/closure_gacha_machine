import type { BannerStrategy } from "../types/BannerStrategy.js";
import type { ProfileBanner } from "../types/GachaProfile.js";
import type { Banner } from "../types/Banner.js";
import { BannerTypes } from "../types/BannerTypes.js";
import { Items } from "../types/Items.js";
import { RateUp } from "../types/RateUp.js";
import Switch from "../helpers/Switch.js";
import Gacha from "../helpers/Gacha.js";
import GenericFiveStarsHandler from "../helpers/GenericFiveStarsHandler.js";
import GenericFourStarsHandler from "../helpers/GenericFourStarsHandler.js";
import StrategyManager from "../singletons/StrategyManager.js";
import crypto from "crypto";

@StrategyManager.Register(BannerTypes.Limited)
export default class Limited implements BannerStrategy {
    public Roll(Banner: Banner, Profile: ProfileBanner, Result: Items): string {
        return Switch(Result, {
            [Items.SixStars]: (): string => {
                const SixStarRateUpResult: RateUp = Gacha([
                    { Value: RateUp.Primary, Chance: 70 },
                    { Value: RateUp.Secondary, Chance: 25 },
                    { Value: RateUp.None, Chance: 5 }
                ]);

                if(SixStarRateUpResult === RateUp.Primary || SixStarRateUpResult === RateUp.Secondary)
                    Profile.RollsSinceLast6StarsRateUp = 0;
                else Profile.RollsSinceLast6StarsRateUp++;

                return Switch(SixStarRateUpResult, {
                    [RateUp.Primary]: (): string => Banner.SixStarsPool.Primary[crypto.randomInt(Banner.SixStarsPool.Primary.length)],
                    [RateUp.Secondary]:  (): string => Banner.SixStarsPool.Secondary[crypto.randomInt(Banner.SixStarsPool.Secondary.length)],
                    [RateUp.None]:  (): string => Banner.SixStarsPool.Standard[crypto.randomInt(Banner.SixStarsPool.Standard.length)]
                });
            },
            [Items.FiveStars]: (): string => GenericFiveStarsHandler(Banner, Profile),
            [Items.FourStars]: (): string => GenericFourStarsHandler(Banner, Profile),
            [Items.ThreeStars]: (): string => Banner.ThreeStarsPool[crypto.randomInt(Banner.ThreeStarsPool.length)]
        });
    }
}