import type { Banner, Items } from "../singletons/Database.js";
import type { ProfileBanner, Selection } from "../singletons/GachaSystem.js";

export interface BannerStrategy {
    Roll(
        Banner: Banner,
        Profile: ProfileBanner,
        Result: Items,
        Selection?: Selection
    ): string;
}