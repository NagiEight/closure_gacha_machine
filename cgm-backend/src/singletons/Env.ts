import Switch from "#helpers/Switch";
import "dotenv/config";

type ValueType = number | unknown[] | string;

export default new class EnvLoader {
    public readonly Variables: Map<string, ValueType> = new Map();

    /**
     * Get variable of name {@link Name}.
     * 
     * @throws If variable doesn't exist or wasn't registered.
     */
    public GetVariable<T extends ValueType>(Name: string): T {
        if(!this.Variables.has(Name))
            throw new TypeError(`Variable ${Name} doesn't exists or wasn't registered.`);
        return this.Variables.get(Name) as T;
    }
    
    /**
     * Add variable of name {@link Name}, do nothing if variable already registered. If {@link Default} is provided, then its value will be use if variable doesn't exist.
     * 
     * This method does not reject empty strings if the reported type is string.
     * 
     * @throws If reported type doesn't match with the variable's actual type (won't throw for this if variable is string), if registered variable doesn't exist in process.env and there is no default value provided, or if the type of {@link Default} doesn't match with the reported type of the variable.
     */
    public RegisterVariable(Name: string, Type: "number" | "array" | "string" = "string", Default?: ValueType): this {
        const Env: string | undefined = process.env[Name];
        this.Variables.getOrInsertComputed(Name, (): ValueType => Switch(Type, {
            string: (): ValueType => {
                let Value: string;

                if(Env != undefined)
                    Value = Env;
                else if(Default != undefined) {
                    if(typeof Default !== "string")
                        throw new TypeError("Mismatched type between default value and the provided type.");
                    Value = Default;
                }
                else throw new TypeError(`Variable ${Name} doesn't exists.`);

                return Value;
            },
            number: (): ValueType => {
                let Value: number;

                if(Env != undefined && Env !== "")
                    Value = Number(Env);
                else if(Default != undefined) {
                    if(typeof Default !== "number" || Number.isNaN(Default))
                        throw new TypeError("Mismatched type between default value and the provided type.");
                    Value = Default;
                }
                else throw new TypeError(`Variable ${Name} doesn't exists.`);

                if(Number.isNaN(Value))
                    throw new TypeError(`Variable ${Name} isn't a number.`);

                return Value;
            },
            array: (): ValueType => {
                let Value: string | unknown[];

                if(Env != undefined && Env !== "") 
                    Value = Env;
                else if(Default != undefined) {
                    if(!Array.isArray(Default))
                        throw new TypeError("Mismatched type between default value and the provided type.");
                    Value = structuredClone(Default);
                }
                else throw new TypeError(`Variable ${Name} doesn't exists.`);

                try {
                    if(typeof Value === "string") {
                        const Parsed: unknown = JSON.parse(Value);

                        if(!Array.isArray(Parsed))
                            throw new TypeError(`Variable ${Name} isn't an array.`);

                        return Parsed;
                    }
                    return Value;
                }
                catch {
                    throw new TypeError(`Variable ${Name} isn't an array.`);
                }
            }
        }, () => { throw new TypeError(`Unknown variable type '${Type}'.`); }));
        return this;
    }
}();