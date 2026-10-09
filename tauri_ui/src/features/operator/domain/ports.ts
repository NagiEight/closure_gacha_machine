import type {
  OperatorEntity,
  OperatorSearchQuery,
  OperatorSummary,
} from "./entities";

export interface OperatorPort {
  getAllOperatorIds(): Promise<string[]>;
  getOperatorsPage(page: number): Promise<OperatorSummary[]>;
  searchOperators(page: number, query: OperatorSearchQuery): Promise<OperatorSummary[]>;
  getOperatorDetails(operatorId: string): Promise<OperatorEntity>;
  getBannerImageUrl(bannerName: string): Promise<string>;
  getOperatorAvatarUrl(operatorId: string): Promise<string>;
  getOperatorE2AvatarUrl(operatorId: string): Promise<string>;
  getOperatorCardUrl(operatorId: string): Promise<string>;
}
