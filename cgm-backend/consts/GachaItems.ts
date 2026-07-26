import type { GachaItems } from "../helpers/Gacha.js";

export enum Items {
    SixStars,
    FiveStars,
    FourStars,
    ThreeStars
}

export default [
    { Value: Items.SixStars, Chance: 2 },
    { Value: Items.FiveStars, Chance: 8 },
    { Value: Items.FourStars, Chance: 50 },
    { Value: Items.ThreeStars, Chance: 40 }
] as const satisfies GachaItems<Items>[];