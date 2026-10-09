import { parseTimestamp } from "../../../shared/time_utils";

export enum BannerType {
  Standard = "Standard",
  Limited = "Limited",
  Crossover = "Crossover",
  Orienteering = "Orienteering",
  JointOperation = "JointOperation",
  TFTW = "TFTW",
}

export interface SixStarsPool {
  primary: string[];
  secondary: string[];
  standard: string[];
}

export interface TieredOperatorPool {
  primary: string[];
  standard: string[];
}

export interface OperatorPool {
  sixStars: SixStarsPool;
  fiveStars: TieredOperatorPool;
  fourStars: TieredOperatorPool;
  threeStars: string[];
}

export interface BannerSummary {
  name: string;
  type: string;
  releaseDate: Date;
}

export interface BannerEntity {
  name: string;
  releaseDate: Date;
  type: string;
  operatorPool: OperatorPool;
}

export interface BannerSearchQuery {
  nameQuery?: string;
  bannerType?: BannerType;
  includes?: string[];
  from?: number;
  to?: number;
}

export const BannerEntity = {
  fromJson(json: Record<string, unknown>): BannerEntity {
    const operatorPoolJson =
      ((json["OperatorPool"] ?? json["operatorPool"]) as Record<string, unknown>) ?? {};

    const rawDate =
      json["ReleaseDate"] ??
      json["releaseDate"] ??
      json["release_date"] ??
      operatorPoolJson["ReleaseDate"] ??
      operatorPoolJson["releaseDate"];

    const rawType =
      json["Type"] ??
      json["type"] ??
      operatorPoolJson["Type"] ??
      operatorPoolJson["type"] ??
      "Standard";

    return {
      name:
        (json["Name"] as string) ??
        (json["name"] as string) ??
        "Unknown Banner",
      releaseDate: new Date(parseTimestamp(rawDate)),
      type: String(rawType),
      operatorPool: {
        sixStars: {
          primary: ((operatorPoolJson["SixStarsPool"] as Record<string, unknown>)?.["Primary"] as string[]) ?? [],
          secondary: ((operatorPoolJson["SixStarsPool"] as Record<string, unknown>)?.["Secondary"] as string[]) ?? [],
          standard: ((operatorPoolJson["SixStarsPool"] as Record<string, unknown>)?.["Standard"] as string[]) ?? [],
        },
        fiveStars: {
          primary: ((operatorPoolJson["FiveStarsPool"] as Record<string, unknown>)?.["Primary"] as string[]) ?? [],
          standard: ((operatorPoolJson["FiveStarsPool"] as Record<string, unknown>)?.["Standard"] as string[]) ?? [],
        },
        fourStars: {
          primary: ((operatorPoolJson["FourStarsPool"] as Record<string, unknown>)?.["Primary"] as string[]) ?? [],
          standard: ((operatorPoolJson["FourStarsPool"] as Record<string, unknown>)?.["Standard"] as string[]) ?? [],
        },
        threeStars: (operatorPoolJson["ThreeStarsPool"] as string[]) ?? [],
      },
    };
  },
};
