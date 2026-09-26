import type Items from "#types/Items";

export interface GachaProfileStorageRow {
    Token: string;
    Banner: string;
    Rarity: Items;
    ID: string;
    Count: number;
}
