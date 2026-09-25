import type { UserDatabase } from "#types/UserDatabase";
import { pathToFileURL } from "url";
import path from "path";
import LoadEnv from "#LoadEnv";

export default async (): Promise<new () =>  UserDatabase> => {
    const PathToDir: string = path.join(import.meta.dirname, "..", "databaseManager");
    const Extension: string = import.meta.filename.endsWith(".ts")
        ? ".ts"
        : ".js"
    ;

    return (await import(
        pathToFileURL(path.join(PathToDir, LoadEnv.DATABASE_MANAGER_FILENAME + Extension)).href
    )).default;
};