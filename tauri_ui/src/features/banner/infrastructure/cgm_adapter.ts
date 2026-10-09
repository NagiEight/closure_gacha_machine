import { parseTimestamp } from "../../../shared/time_utils";
import { BannerEntity, BannerSearchQuery, BannerSummary } from "../domain/entities";
import { BannerPort } from "../domain/ports";

export class BannerApiAdapter implements BannerPort {
  private readonly baseUrl: string;

  constructor(baseUrl: string = "http://localhost:3000") {
    this.baseUrl = baseUrl.replace(/\/+\$/, "");
  }

  async getAllBannerNames(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/api/banners/all`);
    await this.checkResponseStatus(response);
    return response.json();
  }

  async getBannersPage(page: number): Promise<BannerSummary[]> {
    const response = await fetch(`${this.baseUrl}/api/banners/${page}`);
    await this.checkResponseStatus(response);
    const data = (await response.json()) as Array<{ Name: string; Type: string; ReleaseDate: number }>;

    return data.map((item) => ({
      name: item.Name,
      type: item.Type,
      releaseDate: new Date(parseTimestamp(item.ReleaseDate)),
    }));
  }

  async searchBanners(page: number, query: BannerSearchQuery): Promise<BannerSummary[]> {
    const params = new URLSearchParams({ page: String(page) });

    if (query.nameQuery) params.append("NameQuery", query.nameQuery);
    if (query.bannerType) params.append("BannerType", query.bannerType);
    if (query.from !== undefined) params.append("From", String(query.from));
    if (query.to !== undefined) params.append("To", String(query.to));
    if (query.includes && query.includes.length > 0) {
      query.includes.forEach((item) => params.append("Includes", item));
    }

    const response = await fetch(`${this.baseUrl}/api/banners/search?${params.toString()}`);

    await this.checkResponseStatus(response);
    const data = (await response.json()) as Array<{ Name: string; Type: string; ReleaseDate: number }>;

    return data.map((item) => ({
      name: item.Name,
      type: item.Type,
      releaseDate: new Date(parseTimestamp(item.ReleaseDate)),
    }));
  }

  async getBannerDetails(bannerName: string): Promise<BannerEntity> {
    const encodedName = encodeURIComponent(bannerName);
    const response = await fetch(`${this.baseUrl}/api/banner/${encodedName}`);
    await this.checkResponseStatus(response);
    const data = await response.json();
    return BannerEntity.fromJson(data);
  }

  private async checkResponseStatus(response: Response): Promise<void> {
    if (response.ok) return;

    try {
      const body = await response.json();
      if (typeof body.message === "string") {
        throw new Error(body.message);
      }
      if (Array.isArray(body.message)) {
        throw new Error(JSON.stringify(body.message));
      }
      throw new Error(`Request failed with status ${response.status}`);
    } catch (e) {
      if (e instanceof Error) throw e;
      throw new Error(`Request failed with status ${response.status}`);
    }
  }
}
