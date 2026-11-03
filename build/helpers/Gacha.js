import crypto from "crypto";
import Sum from "#helpers/Sum";
/**
 * Perform weighted randomness on a list of items.
 *
 * @throws If {@link Items} is an empty array.
 */
const Gacha = (Items) => {
    const Random = crypto.randomInt(Sum(Items, Item => Item.Chance));
    let Cumulative = 0;
    for (const Item of Items) {
        Cumulative += Item.Chance;
        if (Cumulative > Random) {
            return Item.Value;
        }
    }
    throw new Error("How did this even happened.");
};
export default Gacha;
