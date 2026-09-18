import crypto from "crypto";

export interface GachaItems<T> {
    Value: T;
    Chance: number;
}

export default <T>(Items: GachaItems<T>[]): T => {
    const Random: number = crypto.randomInt(Items.reduce((Sum, Item) => Sum + Item.Chance, 0));
    let Cumulative: number = 0;
    for(const Item of Items) {
        Cumulative += Item.Chance;
        if(Cumulative > Random) {
            return Item.Value;
        }
    }
    throw new Error("How did this even happened.");
};