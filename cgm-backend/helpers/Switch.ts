export default <T extends PropertyKey, R>(Value: T, Resolver: Record<T, () => R>, Default?: () => R): R => {
    if(Resolver[Value])
        return Resolver[Value]();

    if(Default) 
        return Default();

    const Err: Error = new Error("Fallthrough statement.");
    Err.name = "FallthroughError";
    throw Err;
};