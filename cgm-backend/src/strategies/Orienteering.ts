import type { BannerStrategy, RollParams } from "#types/BannerStrategy";
import type { GachaItems } from "#helpers/Gacha";
import { Items } from "#types/Items";
import { BannerTypes } from "#types/BannerTypes";
import { RateUp } from "#types/RateUp";
import Switch from "#helpers/Switch";
import GenericFourStarsHandler from "#helpers/GenericFourStarsHandler";
import StrategyManager from "#StrategyManager";
import RandomItem from "#helpers/RandomItem";

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