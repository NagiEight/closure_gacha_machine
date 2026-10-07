import { parseTimestamp } from "../../../shared/time_utils";
import { BannerEntity, BannerSearchQuery, BannerSummary } from "../domain/entities";
import { BannerPort } from "../domain/ports";


export class BannerApiAdapter implements BannerPort {
  private readonly baseUrl: string;

  constructor(baseUrl: string = "http://localhost:3000") {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
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
    const body: Record<string, unknown> = {};
    if (query.nameQuery) body.NameQuery = query.nameQuery;
    if (query.bannerType) body.BannerType = query.bannerType;
    if (query.includes) body.Includes = query.includes;
    if (query.from !== undefined) body.From = query.from;
    if (query.to !== undefined) body.To = query.to;

    const response = await fetch(`${this.baseUrl}/api/banners/search?page=${page}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

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
