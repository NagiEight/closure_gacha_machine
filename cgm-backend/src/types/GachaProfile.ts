export interface ProfileBanner {
    Count: number;
    RollsWithoutSixStar: number;
    RollsSinceLast6StarsRateUp: number;
    RollsSinceLast5StarsRateUp: number;
    RollsSinceLast4StarsRateUp: number;
    Focused: boolean;
    TenRolls: boolean;
    Storage: ProfileStorage;
}

export interface ProfileStorage {
    SixStars: Record<string, number>;
    FiveStars: Record<string, number>;
    FourStars: Record<string, number>;
    ThreeStars: Record<string, number>;
}

export type GachaProfile = Record<string, ProfileBanner>;