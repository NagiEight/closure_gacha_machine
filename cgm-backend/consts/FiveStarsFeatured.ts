import type { GachaItems } from "../helpers/Gacha.js";
import { FeaturedItems } from "./Featured.js";

export default [
    { Value: FeaturedItems.FeaturedPrimary, Chance: 50 },
    { Value: FeaturedItems.None, Chance: 50 }
] as const satisfies GachaItems<FeaturedItems>[];