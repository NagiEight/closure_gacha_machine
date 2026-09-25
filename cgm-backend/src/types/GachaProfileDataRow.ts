export interface GachaProfileDataRow {
    Token: string;
    Banner: string; 
    Count: number;
    RollsWithoutSixStar: number;
    RollsSinceLast6StarsRateUp: number;
    RollsSinceLast5StarsRateUp: number;
    RollsSinceLast4StarsRateUp: number;
    Focused: 0 | 1;
    TenRolls: 0 | 1;
}