import type { GachaProfileStorageRow } from "#types/GachaProfileStorageRow";
import type { GachaProfileDataRow } from "./GachaProfileDataRow.js";

export interface UserDatabase {
    /**
     * An async method that used for setting up database (create table, setting pragmas,...) of async database library or async operations that might not be possible in a method's constructor. 
     * @returns A new instance of the database manager or the same one that used to call this method.
     */
    Initialize(): Promise<UserDatabase>;
    CreateProfile(Token: string): Promise<void>;
    RefreshStorage(Args: GachaProfileStorageRow): Promise<void>;
    RefreshData(Args: GachaProfileDataRow): Promise<void>;
    ResetBanner(Token: string, BannerName: string): Promise<void>;
    DeleteProfile(Token: string): Promise<void>;
    GetStorage(): Promise<GachaProfileStorageRow[]>;
    GetData(): Promise<GachaProfileDataRow[]>;
}