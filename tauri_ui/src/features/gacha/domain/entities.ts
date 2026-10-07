export interface GachaSession {
  token: string;
}

export interface BannerProgressStorage {
  sixStars: Record<string, number>;
  fiveStars: Record<string, number>;
  fourStars: Record<string, number>;
  threeStars: Record<string, number>;
}

export interface BannerProgress {
  count: number;
  rollsWithoutSixStar: number;
  rollsSinceLast6StarsRateUp: number;
  rollsSinceLast5StarsRateUp: number;
  rollsSinceLast4StarsRateUp: number;
  focused: boolean;
  tenRolls: boolean;
  storage: BannerProgressStorage;
}

export type GachaProfile = Record<string, BannerProgress>;

export interface OrienteeringSelection {
  sixStarsSelection?: string[];
  fiveStarsSelection?: string[];
}

export type RollMultipleResult = string[] | Record<string, number>;
