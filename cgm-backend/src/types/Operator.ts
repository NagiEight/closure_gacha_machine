import type Items from "#types/Items";

export interface Operator {
    Name: string;
    Rarity: Items;
    ReleaseDate: number | null;
    Limited: boolean;
}