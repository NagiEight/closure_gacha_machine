import type { GachaItems } from "#helpers/Gacha";
import type { BannerStrategy } from "#types/BannerStrategy";
import type { Banner } from "#types/Banner";
import GenericFiveStarsHandler from "#helpers/GenericFiveStarsHandler";
import GenericFourStarsHandler from "#helpers/GenericFourStarsHandler";
import RandomItem from "#helpers/RandomItem";
import Switch from "#helpers/Switch";
import StrategyManager from "#StrategyManager";
import BannerTypes from "#types/BannerTypes";
import Items from "#types/Items";
import RateUp from "#types/RateUp";

@StrategyManager.Register(BannerTypes.TFTW)
export default class JointOperation implements BannerStrategy {
    public readonly RateUp: Partial<Record<Items, GachaItems<RateUp>[]>> = {
        [Items.FiveStars]: [
            { Value: RateUp.Primary, Chance: 60 },
            { Value: RateUp.None, Chance: 40 }
        ],
        [Items.FourStars]: [
            { Value: RateUp.Primary, Chance: 45 },
            { Value: RateUp.None, Chance: 55 }
        ]
    };
    
    public Roll(Banner: Banner, Result: Items, RU: RateUp): string {
        return Switch(Result, {
            [Items.SixStars]: (): string => RandomItem(Banner.SixStarsPool.Primary),
            [Items.FiveStars]: (): string => GenericFiveStarsHandler(Banner, RU),
            [Items.FourStars]: (): string => GenericFourStarsHandler(Banner, RU),
            [Items.ThreeStars]: (): string => RandomItem(Banner.ThreeStarsPool)
        });
    }
}