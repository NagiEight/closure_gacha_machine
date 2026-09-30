/**
 * An attempt of adding a so-called switch expression.
 * 
 * @throws If switch-ing isn't exhaustive (e.g. {@link Resolver} doesn't cover all possible value of {@link Value} and a {@link Default} function wasn't provided).
 */
const Switch = <T extends PropertyKey, R>(Value: T, Resolver: Record<T, () => R>, Default?: () => R): R => {
    if(Resolver[Value])
        return Resolver[Value]();

    if(Default)
        return Default();

    const Err: Error = new Error("Fallthrough statement.");
    Err.name = "FallthroughError";
    throw Err;
};

export default Switch;