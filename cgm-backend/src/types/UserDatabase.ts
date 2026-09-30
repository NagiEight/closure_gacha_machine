import type { GachaProfileStorageRow } from "#types/GachaProfileStorageRow";
import type { GachaProfileDataRow } from "#types/GachaProfileDataRow";

const Branding: symbol = Symbol.for("UserDatabase");

export default abstract class UserDatabase {
    public readonly [Branding]: boolean = true;
    
    /**
     * An async method that used for setting up database (create table, setting pragmas,...) of async database libraries, or do various async works that might not be possible in a class constructor.
     * @returns A new instance of the database manager or the same one that used to call this method.
     */
    public async Initialize(): Promise<UserDatabase> {
        return this;
    }

    public abstract CreateProfile(Token: string): Promise<void>;
    public abstract RefreshStorage(Args: GachaProfileStorageRow): Promise<void>;
    public abstract RefreshData(Args: GachaProfileDataRow): Promise<void>;
    public abstract ResetBanner(Token: string, BannerName: string): Promise<void>;
    public abstract DeleteProfile(Token: string): Promise<void>;

    /**
     * This runs once at the start of the process.
     */
    public abstract GetStorage(): Promise<GachaProfileStorageRow[]>;
    /**
     * This also runs once at the start of the process.
     */
    public abstract GetData(): Promise<GachaProfileDataRow[]>;

    public static [Symbol.hasInstance](Obj: any): Obj is UserDatabase {
        return typeof Obj === "object"
            && Obj !== null
            && Branding in Obj
        ;
    }
}