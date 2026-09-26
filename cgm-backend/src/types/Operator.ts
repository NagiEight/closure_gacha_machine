import type Items from "@Items";

export interface Operator {
    Name: string;
    Rarity: Items;
    ReleaseDate: number | null;
    Limited: boolean;
}