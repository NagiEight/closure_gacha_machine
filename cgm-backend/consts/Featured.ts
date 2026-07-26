import type { GachaItems } from "../helpers/Gacha.js";

export enum FeaturedItems {
    FeaturedPrimary,
    FeaturedSecondary,
    None
}

export default [
    { Value: FeaturedItems.FeaturedPrimary, Chance: 70 },
    { Value: FeaturedItems.FeaturedSecondary, Chance: 25 },
    { Value: FeaturedItems.None, Chance: 5 }
] as const satisfies GachaItems<FeaturedItems>[];