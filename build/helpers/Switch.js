/**
 * An attempt of adding a so-called switch expression.
 *
 * @throws If switch-ing isn't exhaustive (e.g. {@link Resolver} doesn't cover all possible value of {@link Value} and a {@link Default} function or value wasn't provided).
 */
const Switch = (Value, Resolver, Default) => {
    if (Value in Resolver) {
        return typeof Resolver[Value] === "function"
            ? Resolver[Value]()
            : Resolver[Value];
    }
    if (Default != undefined) {
        return typeof Default === "function"
            ? Default()
            : Default;
    }
    const Err = new Error("Fallthrough statement.");
    Err.name = "FallthroughError";
    throw Err;
};
export default Switch;
