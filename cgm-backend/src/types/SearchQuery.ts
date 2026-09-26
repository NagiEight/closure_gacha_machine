import type BannerTypes from "@BannerTypes";

export type SearchQuery = Partial<{
    NameQuery: string;
    BannerType: BannerTypes;
    Includes: string[];
    From: number;
    To: number;
}>;