import type { GachaItems } from "#helpers/Gacha";
import type { Banner } from "#types/Banner";
import type { ProfileBanner } from "#types/GachaProfile";
import type RateUp from "#types/RateUp";
import type Items from "#types/Items";

export type Mapping = Partial<
    Record<Items, GachaItems<RateUp>[]>
>;

export interface RollParams {
    Profile: ProfileBanner;
    Selection?: Selection;
}

export interface BannerStrategy {
    readonly RateUp?: Mapping;

    Roll(
        Banner: Banner,
        Result: Items,
        RU: RateUp,
        {
            Profile,
            Selection
        }: RollParams
    ): string;
}

export interface Selection {
    SixStarsSelection: [string, string, string];
    FiveStarsSelection: [string, string, string];
}