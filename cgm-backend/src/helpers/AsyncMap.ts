export default <T, R>(Arr: T[], CallbackFn: (Item: T, Index: number, Arr: T[]) => Promise<R>): Promise<R[]> => 
    Promise.all(Arr.map(CallbackFn))
;