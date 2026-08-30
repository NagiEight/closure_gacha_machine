export default function*<T>(Iterable: Iterable<T>, Start: number = 0, End: number = Infinity): Generator<T, void> {
    let i: number = 0;

    for(const Value of Iterable) {
        if(i >= End)
            break;
        if(i >= Start)
            yield Value;
        i++;
    }
};