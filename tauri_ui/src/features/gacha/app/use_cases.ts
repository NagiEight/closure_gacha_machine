import { BannerEntity } from "../../banner/domain/entities";
import { BannerPort } from "../../banner/domain/ports";
import { Operator } from "../../operator/domain/entities";
import { OperatorPort } from "../../operator/domain/ports";
import { GachaPort } from "../domain/ports";

export interface PullGachaParams {
  bannerName: string;
  sessionToken: string;
  count: number;
}

export interface PullResult {
  operatorId: string;
  operatorName: string;
  details?: Operator;
}

export interface PullGachaResponse {
  banner: BannerEntity;
  results: PullResult[];
}

export class PullGachaUseCase {
  constructor(
    private readonly gachaPort: GachaPort,
    private readonly operatorPort: OperatorPort,
    private readonly bannerPort: BannerPort
  ) {}

  async execute(params: PullGachaParams): Promise<PullGachaResponse> {
    // 1. Verify banner exists and retrieve its details
    const banner = await this.bannerPort.getBannerDetails(params.bannerName);

    // 2. Perform gacha roll
    const rawIds = await this.gachaPort.rollMultiple(params);

    // 3. Resolve IDs to Operator Entities in parallel
    const results = await Promise.all(
      rawIds.map(async (id) => {
        try {
          const operator = await this.operatorPort.getOperatorDetails(id);
          return {
            operatorId: id,
            operatorName: operator.name,
            details: operator,
          };
        } catch {
          return {
            operatorId: id,
            operatorName: "Unknown Operator",
          };
        }
      })
    );

    return {
      banner,
      results,
    };
  }
}
