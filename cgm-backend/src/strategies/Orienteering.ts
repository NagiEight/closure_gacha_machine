import type { BannerStrategy, RollParams } from "@BannerStrategy";
import type { GachaItems } from "@Gacha";
import RateUp from "@RateUp";
import BannerTypes from "@BannerTypes";
import Items from "@Items";
import Switch from "@Switch";
import GenericFourStarsHandler from "@GenericFourStarsHandler";
import StrategyManager from "@StrategyManager";
import RandomItem from "@RandomItem";

@StrategyManager.Register(BannerTypes.Orienteering)
export default class Orienteering implements BannerStrategy {
    public readonly RateUp: Partial<Record<Items, GachaItems<RateUp>[]>> = {
        [Items.FiveStars]: [
            { Value: RateUp.Primary, Chance: 60 },
            { Value: RateUp.None, Chance: 40 }
        ]
    };

    public Roll({ Banner, Result, RU, Selection }: RollParams): string {
        return Switch(Result, {
            [Items.SixStars]: (): string => 
                Selection && RandomItem(Selection.SixStarsSelection) ||
                RandomItem(Banner.SixStarsPool.Primary)
            ,
            [Items.FiveStars]: (): string => RU === RateUp.Primary
                ? Selection && RandomItem(Selection.FiveStarsSelection) ||
                    RandomItem(Banner.FiveStarsPool.Primary)
                : RandomItem(Banner.FiveStarsPool.Standard)
            ,
            [Items.FourStars]: (): string => GenericFourStarsHandler(Banner, RU),
            [Items.ThreeStars]: (): string => RandomItem(Banner.ThreeStarsPool)
        });
    }
}