import type { GachaProfileStorageRow } from "#types/GachaProfileStorageRow";
import type { GachaProfileDataRow } from "./GachaProfileDataRow.js";

export default abstract class UserDatabase {
    /**
     * An async method that used for setting up database (create table, setting pragmas,...) of async database library or async operations that might not be possible in a method's constructor. 
     * @returns A new instance of the database manager or the same one that used to call this method.
     */
    public async Initialize(): Promise<UserDatabase> {
        return this
    };

    public abstract CreateProfile(Token: string): Promise<void>;
    public abstract RefreshStorage(Args: GachaProfileStorageRow): Promise<void>;
    public abstract RefreshData(Args: GachaProfileDataRow): Promise<void>;
    public abstract ResetBanner(Token: string, BannerName: string): Promise<void>;
    public abstract DeleteProfile(Token: string): Promise<void>;
    public abstract GetStorage(): Promise<GachaProfileStorageRow[]>;
    public abstract GetData(): Promise<GachaProfileDataRow[]>;
}