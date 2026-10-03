import type { BannerStrategy } from "#types/BannerStrategy";
import type BannerTypes from "#types/BannerTypes";
import { pathToFileURL } from "url";
import AsyncMap from "#helpers/AsyncMap";
import path from "path";
import fs from "fs/promises";

export default new class StrategyManager {
    public StrategyRegistry: Map<BannerTypes, new () => BannerStrategy> = new Map<BannerTypes, new () => BannerStrategy>();

    /**
     * Side-effect import all strategy in strategies.
     * @throws If file isn't a javascript/typescript file or not a file at all.
     */
    public async Load(): Promise<void> {
        const PathToDir: string = path.join(import.meta.dirname, "..", "strategies");
        const Extension: string = import.meta.filename.endsWith(".ts")
            ? ".ts"
            : ".js"
        ;

        await AsyncMap(
            (await fs.readdir(PathToDir)).filter(File => File.endsWith(Extension)),
            File => import(pathToFileURL(path.join(PathToDir, File)).href)
        );
    }

    /**
     * Register a banner strategy with an explicit Type.
     * @throws If banner type already registered.
     */
    public Register(Type: BannerTypes): <T extends new () => BannerStrategy>(Ctor: T) => void {
        return <T extends new () => BannerStrategy>(Ctor: T) => {
            if(this.StrategyRegistry.has(Type))
                throw new Error(`Banner type ${Type} has already been registered.`);
            
            this.StrategyRegistry.set(Type, Ctor);
        };
    }
}();