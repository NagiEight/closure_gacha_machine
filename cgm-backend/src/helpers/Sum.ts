export default function Sum(Arr: number[], Transformer?: (Value: number, Index: number, Arr: number[]) => number): number;
export default function Sum<T>(Arr: T[], Transformer: (Value: T, Index: number, Arr: T[]) => number): number;
export default function Sum<T>(Arr: T[], Transformer?: (Value: T, Index: number, Arr: T[]) => number): number {
    return Arr.reduce((Sum: number, Item: T, Index: number, Arr: T[]): number => {
        if(typeof Item === "number") {
            if(!Transformer)
                return Sum + Item;
            return Sum + Transformer(Item, Index, Arr);
        }
        if(!Transformer)
            throw new Error("A transformer is required for non-number values.");
        return Sum + Transformer(Item, Index, Arr);
    }, 0);
};
