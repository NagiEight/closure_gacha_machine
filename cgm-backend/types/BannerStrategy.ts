import type { GachaItems } from "../helpers/Gacha.js";
import type { Banner } from "../types/Banner.js";
import type { ProfileBanner } from "./GachaProfile.js";
import type { Items } from "./Items.js";
import type { RateUp } from "./RateUp.js";

export type Mapping = Partial<
    Record<Items, GachaItems<RateUp>[]>
>;

export interface RollParams {
    Banner: Banner;
    Result: Items;
    RU: RateUp;
    Profile?: ProfileBanner;
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