import type { Items } from "./Items.js";

export interface GachaProfileStorageRow {
    Token: string;
    Banner: string;
    Rarity: Items;
    ID: string;
    Count: number;
}
