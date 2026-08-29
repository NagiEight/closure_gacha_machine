import type { Banner } from "../singletons/Database.js";
import type { ProfileBanner, Items, Selection } from "../singletons/GachaSystem.js";

export interface BannerStrategy {
    Roll(
        Banner: Banner,
        Profile: ProfileBanner,
        Result: Items,
        Selection?: Selection
    ): string;
}