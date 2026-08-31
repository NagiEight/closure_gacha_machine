import type { BannerStrategy } from "../types/BannerStrategy.js";
import type { BannerTypes } from "../types/BannerTypes.js";
import StrategyRegistry from "../singletons/StrategyRegistry.js";

export default (Type: BannerTypes) => <T extends new() => BannerStrategy>(ctor: T) => {
    if(StrategyRegistry.has(Type))
        throw new Error(`Banner type ${Type} has already been registered.`);
    
    StrategyRegistry.set(Type, ctor);
};