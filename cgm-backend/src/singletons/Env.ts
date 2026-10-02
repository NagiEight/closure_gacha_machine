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
     * Also takes a {@link Parser} function to parse custom array (comma-separated lists,...). By default this method use `JSON.parse` as its parser. Ignore if the reported type of the variable isn't array.
     * 
     * This method does not reject empty strings if the reported type is string, otherwise treat empty string as missing variable and defaults to {@link Default} if a value was provided.
     * 
     * @throws If reported type doesn't match with the variable's actual type (won't throw for this if variable is string),if registered variable doesn't exist in process.env and there is no default value provided, or if the type of {@link Default} doesn't match with the reported type of the variable.
     */
    public RegisterVariable(
        Name: string,
        Type: "number" | "array" | "string" = "string",
        {
            Default,
            Parser
        }: { Default?: ValueType; Parser?: (Env: string) => unknown[]; } = {}
    ): this {
        if(this.Variables.has(Name))
            return this;

        const Env: string | undefined = process.env[Name];

        Switch(Type, {
            string: (): any => {
                let Value: string;

                if(Env != undefined)
                    Value = Env;
                else if(Default != undefined) {
                    if(typeof Default !== "string")
                        throw new TypeError("Mismatched type between default value and the provided type.");
                    Value = Default;
                }
                else throw new TypeError(`Variable ${Name} doesn't exists.`);

                this.Variables.set(Name, Value);
            },
            number: (): any => {
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

                this.Variables.set(Name, Value);
            },
            array: (): any => {
                if(!Parser)
                    Parser = JSON.parse;

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
                        const Parsed: unknown = Parser(Value);

                        if(!Array.isArray(Parsed))
                            throw new TypeError(`Variable ${Name} isn't an array.`);

                        this.Variables.set(Name, Parsed);
                        return;
                    }
                    this.Variables.set(Name, Value);
                }
                catch {
                    throw new TypeError(`Variable ${Name} isn't an array.`);
                }
            }
        }, () => { throw new TypeError(`Unknown variable type '${Type}'.`); });
        return this;
    }
}();