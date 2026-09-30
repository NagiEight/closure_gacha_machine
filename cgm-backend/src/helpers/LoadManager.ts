import { pathToFileURL } from "url";
import UserDatabase from "#types/UserDatabase";
import LoadEnv from "#LoadEnv";
import path from "path";

/**
 * Dynamically loads the database manager specified in env.
 * 
 * @throws If file doesn't exist, not a javascript/typescript file, or not a file at all.
 */
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