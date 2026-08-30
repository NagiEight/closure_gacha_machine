import type { BannerTypes } from "../singletons/Database.js";
import type { BannerStrategy } from "../types/BannerStrategy.js";
import GachaSystem from "../singletons/GachaSystem.js";

export default (Type: BannerTypes) => <T extends new() => BannerStrategy>(ctor: T) => {
    if(GachaSystem.StrategyRegistry.has(Type))
        throw new Error(`Banner type ${Type} has already been registered.`);
    
    GachaSystem.StrategyRegistry.set(Type, ctor);
};