import type { BannerTypes } from "./BannerTypes.js";

export interface Banner {
    ReleaseDate: number;
    Type: BannerTypes;
    SixStarsPool: {
        Primary: string[];
        Secondary: string[];
        Standard: string[];
    };
    FiveStarsPool: {
        Primary: string[];
        Standard: string[];
    };
    FourStarsPool: {
        Primary: string[];
        Standard: string[];
    };
    ThreeStarsPool: string[];
}