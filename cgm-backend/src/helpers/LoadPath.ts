import { pathToFileURL } from "url";
import AsyncMap from "#helpers/AsyncMap";
import fs from "fs/promises";
import path from "path";

export default async (): Promise<void> => {
    const PathDir: string = path.join(import.meta.dirname, "..", "path");
    await AsyncMap(
        await fs.readdir(PathDir),
        async Dir => await AsyncMap(
            await fs.readdir(path.join(PathDir, Dir)),
            File => import(pathToFileURL(path.join(PathDir, Dir, File)).href)
        )
    );
};