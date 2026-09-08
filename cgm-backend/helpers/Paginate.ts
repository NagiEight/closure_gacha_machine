import Slice from "#helpers/Slice";

export default <T>(PageSize: number, Page: number, Set: Iterable<T>): Iterable<T> => {
    const Start: number = (Page - 1) * PageSize;
    const End: number = Start + PageSize;
    return Slice(Set, Start, End);
};