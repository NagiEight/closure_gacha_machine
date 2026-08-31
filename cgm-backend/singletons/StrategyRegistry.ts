import type { BannerStrategy } from "../types/BannerStrategy.js";
import type { BannerTypes } from "../types/BannerTypes.js";

export default new Map<BannerTypes, new () => BannerStrategy>();