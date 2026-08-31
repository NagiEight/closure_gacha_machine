import type { BannerTypes } from "./BannerTypes.js";

export interface SearchQuery {
    NameQuery?: string;
    BannerType?: BannerTypes;
    Includes?: string[];
    From?: number;
    To?: number;
}