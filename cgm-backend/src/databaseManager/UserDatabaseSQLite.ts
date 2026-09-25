import type { GachaProfileDataRow } from "#types/GachaProfileDataRow";
import type { GachaProfileStorageRow } from "#types/GachaProfileStorageRow";
import type { UserDatabase } from "#types/UserDatabase";
import type { Database as DBType } from "better-sqlite3";
import Database from "better-sqlite3";
import path from "path";

export default class UserDatabaseSQLite implements UserDatabase {
    public readonly DB: DBType = new Database(path.join(import.meta.dirname, "..", "..", "database", "Userthis.DB"));
    public readonly CreateGachaProfileSTMT = this.DB.prepare<[string], void>(`
        INSERT INTO GachaProfiles(Token)
            VALUES(?)    
    `);
    public readonly RefreshStorageSTMT = this.DB.prepare<GachaProfileStorageRow, void>(`
        INSERT INTO GachaStorage(
            Token,
            Banner,
            Rarity,
            ID,
            Count
        )
        VALUES(
            :Token,
            :Banner,
            :Rarity,
            :ID,
            :Count
        )
        ON CONFLICT(Token, Banner, Rarity, ID) DO UPDATE SET
            Count = excluded.Count
    `);
    public readonly RefreshDataSTMT = this.DB.prepare<GachaProfileDataRow, void>(`
        INSERT INTO GachaData(
            Token,
            Banner,
            Count,
            RollsWithoutSixStar,
            RollsSinceLast6StarsRateUp,
            RollsSinceLast5StarsRateUp,
            RollsSinceLast4StarsRateUp,
            Focused,
            TenRolls
        )
        VALUES(
            :Token,
            :Banner,
            :Count,
            :RollsWithoutSixStar,
            :RollsSinceLast6StarsRateUp,
            :RollsSinceLast5StarsRateUp,
            :RollsSinceLast4StarsRateUp,
            :Focused,
            :TenRolls
        )
        ON CONFLICT(Token, Banner) DO UPDATE SET
            Count = excluded.Count,
            RollsWithoutSixStar = excluded.RollsWithoutSixStar,
            RollsSinceLast6StarsRateUp = excluded.RollsSinceLast6StarsRateUp,
            RollsSinceLast5StarsRateUp = excluded.RollsSinceLast5StarsRateUp,
            RollsSinceLast4StarsRateUp = excluded.RollsSinceLast4StarsRateUp,
            Focused = excluded.Focused,
            TenRolls = excluded.TenRolls
    `);
    public readonly ResetBannerSTMT = this.DB.transaction((Token: string, BannerName: string): void => {
        this.DB.prepare<[string, string], void>(`
            DELETE FROM GachaData
            WHERE Token = ? AND Banner = ?
        `).run(Token, BannerName);
        this.DB.prepare<[string, string], void>(`
            DELETE FROM GachaStorage
            WHERE Token = ? AND Banner = ?
        `).run(Token, BannerName);
    });
    public readonly DeleteProfileSTMT = this.DB.transaction((Token: string): void => {
        this.DB.prepare<[string], void>("DELETE FROM GachaStorage WHERE Token = ?").run(Token);
        this.DB.prepare<[string], void>("DELETE FROM GachaData WHERE Token = ?").run(Token);
        this.DB.prepare<[string], void>("DELETE FROM GachaProfiles WHERE Token = ?").run(Token);
    });
    
    public constructor() {
        this.DB.pragma("journal_mode = WAL");
        this.DB.pragma("foreign_keys = ON");
        this.DB.exec(`
            CREATE TABLE IF NOT EXISTS GachaData(
                Token TEXT NOT NULL,
                Banner TEXT NOT NULL,

                Count INTEGER NOT NULL,
                RollsWithoutSixStar INTEGER NOT NULL,
                RollsSinceLast6StarsRateUp INTEGER NOT NULL,
                RollsSinceLast5StarsRateUp INTEGER NOT NULL,
                RollsSinceLast4StarsRateUp INTEGER NOT NULL,
                Focused INTEGER NOT NULL,
                TenRolls INTEGER NOT NULL,

                PRIMARY KEY (Token, Banner),
                FOREIGN KEY (Token) REFERENCES GachaProfiles(Token),

                CHECK(Focused IN (0, 1)),
                CHECK(TenRolls IN (0, 1))
            );

            CREATE TABLE IF NOT EXISTS GachaStorage(
                Token TEXT NOT NULL,
                Banner TEXT NOT NULL,
                Rarity INTEGER NOT NULL,
                ID TEXT NOT NULL,

                Count INTEGER NOT NULL,

                PRIMARY KEY (Token, Banner, Rarity, ID),
                FOREIGN KEY (Token) REFERENCES GachaProfiles(Token),

                CHECK(Rarity IN (3, 4, 5, 6)),
                CHECK(Count >= 0)
            );

            CREATE TABLE IF NOT EXISTS GachaProfiles(
                Token TEXT PRIMARY KEY
            );
        `);
    }

    public async Initialize(): Promise<UserDatabase> {
        return this;
    }

    public async CreateProfile(Token: string): Promise<void> {
        this.CreateGachaProfileSTMT.run(Token);
    }

    public async RefreshStorage(Args: GachaProfileStorageRow): Promise<void> {
        this.RefreshStorageSTMT.run(Args);
    }

    public async RefreshData(Args: GachaProfileDataRow): Promise<void> {
        this.RefreshDataSTMT.run(Args);
    }

    public async ResetBanner(Token: string, BannerName: string): Promise<void> {
        this.ResetBannerSTMT(Token, BannerName);
    }

    public async DeleteProfile(Token: string): Promise<void> {
        this.DeleteProfileSTMT(Token);
    }

    public async GetStorage(): Promise<GachaProfileStorageRow[]> {
        return this.DB.prepare<[], GachaProfileStorageRow>(`
            SELECT
                GP.Token,
                GS.Banner,
                GS.Rarity,
                GS.ID,
                GS.Count
            FROM GachaStorage GS JOIN GachaProfiles GP ON GP.Token = GS.Token
        `).all();
    }

    public async GetData(): Promise<GachaProfileDataRow[]> {
        return this.DB.prepare<[], GachaProfileDataRow>(`
            SELECT
                GP.Token,
                GD.Banner,
                GD.Focused,
                GD.RollsWithoutSixStar,
                GD.RollsSinceLast6StarsRateUp,
                GD.RollsSinceLast5StarsRateUp,
                GD.RollsSinceLast4StarsRateUp,
                GD.TenRolls,
                GD.Count
            FROM GachaData GD JOIN GachaProfiles GP ON GP.Token = GD.Token
        `).all();
    }
}