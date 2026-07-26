import type { GachaItems } from "../helpers/Gacha.js";
import { Items } from "./GachaItems.js";

export default [
    { Value: Items.SixStars, Chance: 2 },
    { Value: Items.FiveStars, Chance: 98 },
] as const satisfies GachaItems<Items>[];