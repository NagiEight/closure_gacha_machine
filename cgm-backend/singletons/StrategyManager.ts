import type { BannerStrategy } from "../types/BannerStrategy.js";
import { BannerTypes } from "../types/BannerTypes.js";
import { pathToFileURL } from "url";
import path from "path";
import fs from "fs/promises";

export default new class {
    public StrategyRegistry: Map<BannerTypes, new () => BannerStrategy> = new Map<BannerTypes, new () => BannerStrategy>();
    
    public async Load(): Promise<void> {
        const PathToDir: string = path.join(import.meta.dirname, "..", "strategies");
        const Extension: string = import.meta.filename.endsWith(".ts")
            ? ".ts"
            : ".js"
        ;
    
        await Promise.all(
            (await fs.readdir(PathToDir))
                .filter(File => File.endsWith(Extension))
                .map(File => import(pathToFileURL(path.join(PathToDir, File)).href))
        );
    };

    public Register(Type: BannerTypes): <T extends new () => BannerStrategy>(ctor: T) => void {
        return <T extends new() => BannerStrategy>(ctor: T) => {
            if(this.StrategyRegistry.has(Type))
                throw new Error(`Banner type ${Type} has already been registered.`);
            
            this.StrategyRegistry.set(Type, ctor);
        };
    };
};