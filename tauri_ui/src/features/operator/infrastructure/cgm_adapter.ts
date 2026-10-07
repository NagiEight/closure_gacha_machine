import type { OperatorPort } from "../domain/ports";
import {
  OperatorEntity,
  OperatorSearchQuery,
  OperatorSummary,
} from "../domain/entities";

export class OperatorApiAdapter implements OperatorPort {
  private readonly baseUrl: string;

  constructor(baseUrl: string = "http://localhost:3000") {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  async getAllOperatorIds(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/api/operators/all`);
    await this.checkResponseStatus(response);
    return response.json();
  }

  async getOperatorsPage(page: number): Promise<OperatorSummary[]> {
    const response = await fetch(`${this.baseUrl}/api/operators/${page}`);
    await this.checkResponseStatus(response);
    const data = (await response.json()) as Array<{
      Id: string;
      Name: string;
      Rarity: number;
      Class: string;
    }>;

    return data.map((item) => ({
      id: item.Id,
      name: item.Name,
      rarity: item.Rarity,
      class: item.Class,
    }));
  }

  async searchOperators(page: number, query: OperatorSearchQuery): Promise<OperatorSummary[]> {
    const body: Record<string, unknown> = {};
    if (query.nameQuery) body.NameQuery = query.nameQuery;
    if (query.rarities) body.Rarities = query.rarities;
    if (query.classes) body.Classes = query.classes;
    if (query.subClasses) body.SubClasses = query.subClasses;
    if (query.factions) body.Factions = query.factions;
    if (query.races) body.Races = query.races;

    const response = await fetch(`${this.baseUrl}/api/operators/search?page=${page}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    await this.checkResponseStatus(response);
    const data = (await response.json()) as Array<{
      Id: string;
      Name: string;
      Rarity: number;
      Class: string;
    }>;

    return data.map((item) => ({
      id: item.Id,
      name: item.Name,
      rarity: item.Rarity,
      class: item.Class,
    }));
  }

  async getOperatorDetails(operatorId: string): Promise<OperatorEntity> {
    const encodedId = encodeURIComponent(operatorId);
    const response = await fetch(`${this.baseUrl}/api/operator/${encodedId}`);
    await this.checkResponseStatus(response);
    const data = await response.json();
    return OperatorEntity.fromJson(data);
  }

  // --- Asset Endpoints ---

  async getBannerImageUrl(bannerName: string): Promise<string> {
    const encodedName = encodeURIComponent(bannerName);
    const response = await fetch(`${this.baseUrl}/assets/banner/${encodedName}`);
    await this.checkResponseStatus(response);
    return response.text();
  }

  async getOperatorAvatarUrl(operatorId: string): Promise<string> {
    const encodedId = encodeURIComponent(operatorId);
    const response = await fetch(`${this.baseUrl}/assets/operator/${encodedId}`);
    await this.checkResponseStatus(response);
    return response.text();
  }

  async getOperatorE2AvatarUrl(operatorId: string): Promise<string> {
    const encodedId = encodeURIComponent(operatorId);
    const response = await fetch(`${this.baseUrl}/assets/e2operator/${encodedId}`);
    await this.checkResponseStatus(response);
    return response.text();
  }

  async getOperatorCardUrl(operatorId: string): Promise<string> {
    const encodedId = encodeURIComponent(operatorId);
    const response = await fetch(`${this.baseUrl}/assets/card/${encodedId}`);
    await this.checkResponseStatus(response);
    return response.text();
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
