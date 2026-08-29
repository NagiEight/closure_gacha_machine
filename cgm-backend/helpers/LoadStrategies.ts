import { pathToFileURL } from "url";
import fs from "fs/promises";
import path from "path";

export default async (): Promise<void> => {
    const PathToDir: string = path.join(import.meta.dirname, "..", "strategies");
    const Extension: string = import.meta.filename.endsWith(".ts")
        ? ".ts"
        : ".js"
    ;

    await Promise.all(
        (await fs.readdir(PathToDir))
            .filter(File => File.endsWith(Extension))
            .map(async File => await import(pathToFileURL(path.join(PathToDir, File)).href))
    );
};