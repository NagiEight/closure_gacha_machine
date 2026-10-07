import { GachaProfile, GachaSession, RollMultipleResult } from "../domain/entities";
import type {
  GachaPort,
  RollMultipleParams,
  RollSingleParams,
} from "../domain/ports";

export class GachaApiAdapter implements GachaPort {
  private readonly baseUrl: string;

  constructor(baseUrl: string = "http://localhost:3000") {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  async createSession(): Promise<GachaSession> {
    const response = await fetch(`${this.baseUrl}/gacha/create`, {
      method: "POST",
    });

    await this.checkResponseStatus(response);

    const sessionToken = response.headers.get("Session-Token");
    if (!sessionToken) {
      throw new Error("Session-Token header missing in server response.");
    }

    return { token: sessionToken };
  }

  async getProfile(sessionToken: string): Promise<GachaProfile> {
    const response = await fetch(`${this.baseUrl}/gacha/profile`, {
      method: "GET",
      headers: { "Session-Token": sessionToken },
    });

    await this.checkResponseStatus(response);

    const raw = (await response.json()) as Record<string, any>;
    const profile: GachaProfile = {};

    for (const [bannerName, data] of Object.entries(raw)) {
      profile[bannerName] = {
        count: data.Count ?? 0,
        rollsWithoutSixStar: data.RollsWithoutSixStar ?? 0,
        rollsSinceLast6StarsRateUp: data.RollsSinceLast6StarsRateUp ?? 0,
        rollsSinceLast5StarsRateUp: data.RollsSinceLast5StarsRateUp ?? 0,
        rollsSinceLast4StarsRateUp: data.RollsSinceLast4StarsRateUp ?? 0,
        focused: Boolean(data.Focused),
        tenRolls: Boolean(data.TenRolls),
        storage: {
          sixStars: data.Storage?.SixStars ?? {},
          fiveStars: data.Storage?.FiveStars ?? {},
          fourStars: data.Storage?.FourStars ?? {},
          threeStars: data.Storage?.ThreeStars ?? {},
        },
      };
    }

    return profile;
  }

  async rollSingle(params: RollSingleParams): Promise<string> {
    const encodedBanner = encodeURIComponent(params.bannerName);
    const headers: Record<string, string> = {
      "Session-Token": params.sessionToken,
    };

    let body: string | undefined;
    if (params.selection) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify({
        SixStarsSelection: params.selection.sixStarsSelection ?? [],
        FiveStarsSelection: params.selection.fiveStarsSelection ?? [],
      });
    }

    const response = await fetch(`${this.baseUrl}/gacha/${encodedBanner}/roll`, {
      method: "POST",
      headers,
      body,
    });

    await this.checkResponseStatus(response);
    const data = (await response.json()) as { Result: string };
    return data.Result;
  }

  async rollMultiple(params: RollMultipleParams): Promise<RollMultipleResult> {
    const encodedBanner = encodeURIComponent(params.bannerName);
    const reducedQuery = params.reduced ? "?reduced=true" : "";
    const headers: Record<string, string> = {
      "Session-Token": params.sessionToken,
    };

    let body: string | undefined;
    if (params.selection) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify({
        SixStarsSelection: params.selection.sixStarsSelection ?? [],
        FiveStarsSelection: params.selection.fiveStarsSelection ?? [],
      });
    }

    const response = await fetch(
      `${this.baseUrl}/gacha/${encodedBanner}/roll/${params.count}${reducedQuery}`,
      {
        method: "POST",
        headers,
        body,
      }
    );

    await this.checkResponseStatus(response);
    const data = (await response.json()) as { Result: RollMultipleResult };
    return data.Result;
  }

  async resetBannerProgress(bannerName: string, sessionToken: string): Promise<string> {
    const encodedBanner = encodeURIComponent(bannerName);
    const response = await fetch(`${this.baseUrl}/gacha/reset/${encodedBanner}`, {
      method: "PATCH",
      headers: { "Session-Token": sessionToken },
    });

    await this.checkResponseStatus(response);
    return response.text();
  }

  async deleteSession(sessionToken: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/gacha/delete`, {
      method: "PURGE",
      headers: { "Session-Token": sessionToken },
    });

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
