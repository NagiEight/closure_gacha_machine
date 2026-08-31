import type { Banner } from "../types/Banner.js";
import type { ProfileBanner } from "./GachaProfile.js";
import type { Items } from "./Items.js";

export interface BannerStrategy {
    Roll(
        Banner: Banner,
        Profile: ProfileBanner,
        Result: Items,
        Selection?: Selection
    ): string;
}

export interface Selection {
    SixStarsSelection: string[];
    FiveStarsSelection: string[];
}