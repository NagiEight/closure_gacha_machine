import type { GachaItems } from "@Gacha";
import type { Banner } from "@Banner";
import type { ProfileBanner } from "@GachaProfile";
import type RateUp from "@RateUp";
import type Items from "@Items";

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