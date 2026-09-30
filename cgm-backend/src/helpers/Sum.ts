/**
 * Sum an array of number, optionally takes a transformer function.
 */
export default function Sum(Arr: number[], Transformer?: (Value: number, Index: number, Arr: number[]) => number): number;
/**
 * Sum an array of any type, require a transformer function to turn each values into numbers.
 * 
 * @throws If a transformer function wasn't provided.
 */
export default function Sum<T>(Arr: T[], Transformer: (Value: T, Index: number, Arr: T[]) => number): number;
export default function Sum<T>(Arr: T[], Transformer?: (Value: T, Index: number, Arr: T[]) => number): number {
    return Arr.reduce((Sum: number, Item: T, Index: number, Arr: T[]): number => {
        if(typeof Item === "number") {
            if(!Transformer)
                return Sum + Item;
            return Sum + Transformer(Item, Index, Arr);
        }
        if(!Transformer)
            throw new TypeError("A transformer is required for non-number values.");
        return Sum + Transformer(Item, Index, Arr);
    }, 0);
}