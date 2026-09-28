const DeepFreeze = <T extends object>(Obj: T): Readonly<T> => {    
    for(const Name of Reflect.ownKeys(Obj)) {
        const Value: T[keyof T] = Obj[(Name as keyof T)];

        if(
            (typeof Value === "object" || typeof Value === "function") &&
            Value !== null &&
            !Object.isFrozen(Value)
        ) DeepFreeze(Value);
    }

    return Object.freeze(Obj);
};

export default DeepFreeze;