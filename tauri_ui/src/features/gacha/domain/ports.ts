import type {
  GachaProfile,
  GachaSession,
  OrienteeringSelection,
  RollMultipleResult,
} from "./entities";

export interface RollSingleParams {
  bannerName: string;
  sessionToken: string;
  selection?: OrienteeringSelection;
}

export interface RollMultipleParams {
  bannerName: string;
  sessionToken: string;
  count: number;
  reduced?: boolean;
  selection?: OrienteeringSelection;
}

export interface GachaPort {
  createSession(): Promise<GachaSession>;
  getProfile(sessionToken: string): Promise<GachaProfile>;
  rollSingle(params: RollSingleParams): Promise<string>;
  rollMultiple(params: RollMultipleParams): Promise<RollMultipleResult>;
  resetBannerProgress(bannerName: string, sessionToken: string): Promise<string>;
  deleteSession(sessionToken: string): Promise<string>;
}
