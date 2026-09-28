import DeepFreeze from "#helpers/DeepFreeze";
import "dotenv/config";

const ParseNumber = (Env?: string, Default: number = -1): number => {
    const Value: number = Number(Env = Env?.trim());
    return Env !== "" && !Number.isNaN(Value) ? Value : Default;
};

const ParseArray = <T>(Env?: string, Default?: T[]): T[] => {
    if(!Default)
        Default = [];

    try {
        return JSON.parse(Env ?? JSON.stringify(Default));
    }
    catch(Err) {
        console.error(Err);
        return Default;
    }
};

const EnvLoader = <T extends Record<string, any>>(Env: T): Readonly<T> => DeepFreeze(
    Object.fromEntries(
        Object.entries<T>(Env).map(([K, V]) => {
            if(typeof V === "number")
                return [K, ParseNumber(process.env[K], V)];
            if(Array.isArray(V))
                return [K, ParseArray(process.env[K], V)];
            return [K, process.env[K] ?? V];
        })
    )
);

export default EnvLoader({
    PAGE_SIZE: 10,
    PORT: 3000,
    RATE_LIMIT: 50,
    BASE_MEDIA_URL: "",
    DATABASE_TOKEN: "",
    DATABASE_URL: "",
    DATABASE_MANAGER_FILENAME: ""
});