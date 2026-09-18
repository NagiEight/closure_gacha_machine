import type { BannerStrategy, RollParams } from "#types/BannerStrategy";
import type { GachaItems } from "#helpers/Gacha";
import { Items } from "#types/Items";
import { BannerTypes } from "#types/BannerTypes";
import { RateUp } from "#types/RateUp";
import Switch from "#helpers/Switch";
import GenericFourStarsHandler from "#helpers/GenericFourStarsHandler";
import GenericFiveStarsHandler from "#helpers/GenericFiveStarsHandler";
import StrategyManager from "#StrategyManager";
import RandomItem from "#helpers/RandomItem";

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
    
    public Roll({ Banner, Result, RU }: RollParams): string {
        return Switch(Result, {
            [Items.SixStars]: (): string => RandomItem(Banner.SixStarsPool.Primary),
            [Items.FiveStars]: (): string => GenericFiveStarsHandler(Banner, RU),
            [Items.FourStars]: (): string => GenericFourStarsHandler(Banner, RU),
            [Items.ThreeStars]: (): string => RandomItem(Banner.ThreeStarsPool)
        });
    }
}