import GenerateUniqueUUID from "../helpers/GenerateUniqueUUID.js";

export type GachaResult = Record<string, { 
    Count: number;
    Rarity: 3 | 4 | 5 | 6;
}>;

type UniquePool = Record<string, GachaResult>;
type UserLifeTimePool = Record<string, UniquePool>;

interface _ {
    [UserID: string]: {
        [PoolUUID: string]: {
            [OperatorName: string]: { 
                Count: number;
                Rarity: 3 | 4 | 5 | 6;
            };
        };
    };
}

export default new class {
    private readonly UserPool: UserLifeTimePool = {};

    public GetPool(UserID: string, PoolUUID: string): GachaResult | undefined {
        return this.UserPool[UserID][PoolUUID];
    }

    public AddPool(UserID: string, GachaResult: GachaResult): string {
        this.UserPool[UserID] ??= {};

        const PoolUUID: string = GenerateUniqueUUID(UUID => !!this.UserPool[UserID][UUID]);
        this.UserPool[UserID][PoolUUID] = GachaResult;
        setTimeout(() => delete this.UserPool[UserID][PoolUUID], 900000);
        return PoolUUID;
    }
}();