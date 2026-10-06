import EnvDataType from "#types/EnvDataType";
import "dotenv/config";

type ValueType = number | unknown[] | string | boolean;
type TypeMap = {
    number: number;
    string: string;
};

class EArray<T extends "number" | "string"> extends EnvDataType<TypeMap[T][]> {
    private P: (Value: string) => TypeMap[T][] = JSON.parse;
    private readonly Type: T;

    constructor(Type: T) {
        super();

        if(!["number", "string"].includes(Type))
            throw new TypeError(`Unknown array type "${Type}".`);

        this.Type = Type;
    }

    public Parse(Name: string): TypeMap[T][] {
        const Env: string | undefined = process.env[Name];

        if(Env == undefined || Env == "") {
            if(!this.DefaultValue)
                throw new TypeError(`Variable ${Name} doesn't exists.`);
            return this.DefaultValue;
        }

        try {
            const Parsed: unknown[] = this.P(Env);

            if(!Array.isArray(Parsed) || !Parsed.every(E => typeof E === this.Type))
                throw new TypeError(`Variable ${Name} isn't an array of type ${this.Type}.`);
            
            return Parsed as TypeMap[T][];
        }
        catch {
            throw new TypeError(`Variable ${Name} isn't an array of type ${this.Type}.`);
        }
    }

    public Default(Value: TypeMap[T][]): this {
        if(!Array.isArray(Value) || !Value.every(E => typeof E === this.Type))
            throw new TypeError("Mismatched type between default value and the provided type.");

        this.DefaultValue = Value;
        return this;
    }

    public Parser(Parser: (Value: string) => TypeMap[T][]): this {
        this.P = Parser;
        return this;
    }
}

class ENumber extends EnvDataType<number> {
    public Parse(Name: string): number {
        const Env: string | undefined = process.env[Name];

        if(Env == undefined || Env == "") {
            if(!this.DefaultValue)
                throw new TypeError(`Variable ${Name} doesn't exists.`);
            return this.DefaultValue;
        }

        const Parsed: number = Number(Env);

        if(Number.isNaN(Parsed))
            throw new TypeError(`Variable ${Name} isn't a number.`);
        return Parsed;
    }

    public Default(Value: number): this {
        if(Value != undefined && typeof Value !== "number")
            throw new TypeError("Mismatched type between default value and the provided type.");
        this.DefaultValue = Value;
        return this;
    }
}

class EString extends EnvDataType<string> {
    public Parse(Name: string): string {
        const Env: string | undefined = process.env[Name];
        
        if(Env == undefined) {
            if(!this.DefaultValue)
                throw new TypeError(`Variable ${Name} doesn't exists.`);
            return this.DefaultValue;
        }
        return Env;
    }

    public Default(Value: string): this {
        if(Value != undefined && typeof Value !== "string")
            throw new TypeError("Mismatched type between default value and the provided type.");
        this.DefaultValue = Value;
        return this;
    }
}

class EBoolean extends EnvDataType<boolean> {
    public Parse(Name: string): boolean {
        const Env: string | undefined = process.env[Name]?.trim().toLowerCase();

        if(Env == undefined || Env == "") {
            if(!this.DefaultValue)
                throw new TypeError(`Variable ${Name} doesn't exists.`);
            return this.DefaultValue;
        }

        if(Env === "1" || Env === "true")
            return true;
        if(Env === "0" || Env === "false")
            return false;
        throw new TypeError(`Variable ${Name} isn't a boolean.`);
    }

    public Default(Value: boolean): this {
        if(Value != undefined && typeof Value !== "boolean")
            throw new TypeError("Mismatched type between default value and the provided type.");
        this.DefaultValue = Value;
        return this;
    }
}

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
     * Add variable of name {@link Name}, do nothing if variable already registered.
     * 
     * Optionally takes a {@link Type} object to specify parser type, if none were provided, default to string instead.
     * 
     * This method does not reject empty strings if the reported type is string, otherwise treat empty string as missing variable and defaults to {@link Default} if a value was provided.
     * 
     * @throws If reported type doesn't match with the variable's actual type (won't throw for this if variable is string), if registered variable doesn't exist in process.env and there is no default value provided, or if the type of {@link Default} doesn't match with the reported type of the variable.
     */
    public RegisterVariable<T extends ValueType = string>(
        Name: string,
        Type?: EnvDataType<T>
    ): this {
        if(this.Variables.has(Name))
            return this;

        if(!Type)
            Type = this.string() as EnvDataType<T>;

        this.Variables.set(Name, Type.Parse(Name))
        return this;
    }
    
    /**
     * Create an array parser for RegisterVariable. Does not support nested array or boolean array.
     */
    public array<T extends "number" | "string">(Type: T): EArray<T> {
        return new EArray(Type);
    }
    /**
     * Create a number parser for RegisterVariable.
     */
    public number(): ENumber {
        return new ENumber();
    }
    /**
     * Create a string parser for RegisterVariable. This is the default of RegisterVariable.
     */
    public string(): EString {
        return new EString();
    }
    /**
     * Create a boolean parser for RegisterVariable.
     */
    public boolean(): EBoolean {
        return new EBoolean();
    }
}();