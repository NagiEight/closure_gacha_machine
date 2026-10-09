import type { BannerEntity, BannerSearchQuery, BannerSummary } from "./entities";

export interface BannerPort {
  getAllBannerNames(): Promise<string[]>;
  getBannersPage(page: number): Promise<BannerSummary[]>;
  searchBanners(page: number, query: BannerSearchQuery): Promise<BannerSummary[]>;
  getBannerDetails(bannerName: string): Promise<BannerEntity>;
}
