import type { GachaItems } from "../helpers/Gacha.js";
import type { Banner } from "#types/Banner";
import type { ProfileBanner } from "#types/GachaProfile";
import type { Items } from "#types/Items";
import type { RateUp } from "#types/RateUp";

export type Mapping = Partial<
    Record<Items, GachaItems<RateUp>[]>
>;

export interface RollParams {
    Banner: Banner;
    Result: Items;
    RU: RateUp;
    Profile: ProfileBanner;
    Selection?: Selection;
}

export interface BannerStrategy {
    readonly RateUp?: Mapping;

    Roll({
        Banner,
        Result,
        RU,
        Profile,
        Selection
    }: RollParams): string;
}

export interface Selection {
    SixStarsSelection: string[];
    FiveStarsSelection: string[];
}