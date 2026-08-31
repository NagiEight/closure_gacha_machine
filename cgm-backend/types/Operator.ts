import type { Items } from "./Items.js";

export interface Operator {
    Name: string;
    Rarity: Items;
    ReleaseDate: number | null;
    Limited: boolean;
}