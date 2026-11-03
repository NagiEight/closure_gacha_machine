export default function Sum(Arr, Transformer) {
    return Arr.reduce((Sum, Item, Index, Arr) => {
        if (typeof Item === "number") {
            if (!Transformer)
                return Sum + Item;
            return Sum + Transformer(Item, Index, Arr);
        }
        if (!Transformer)
            throw new TypeError("A transformer is required for non-number values.");
        return Sum + Transformer(Item, Index, Arr);
    }, 0);
}
