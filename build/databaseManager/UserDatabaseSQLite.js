import UserDatabase from "#types/UserDatabase";
import Database from "better-sqlite3";
import path from "path";
export default class UserDatabaseSQLite extends UserDatabase {
    DB = new Database(path.join(import.meta.dirname, "..", "..", "database", "Users.DB"));
    CreateGachaProfileSTMT = this.DB.prepare(`
        INSERT INTO GachaProfiles(Token)
        VALUES(?)
    `);
    RefreshStorageSTMT = this.DB.prepare(`
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
    RefreshDataSTMT = this.DB.prepare(`
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
    ResetBannerSTMT = this.DB.transaction((Token, BannerName) => {
        this.DB.prepare(`
            DELETE FROM GachaData
            WHERE Token = ? AND Banner = ?
        `).run(Token, BannerName);
        this.DB.prepare(`
            DELETE FROM GachaStorage
            WHERE Token = ? AND Banner = ?
        `).run(Token, BannerName);
    });
    DeleteProfileSTMT = this.DB.transaction((Token) => {
        this.DB.prepare("DELETE FROM GachaStorage WHERE Token = ?").run(Token);
        this.DB.prepare("DELETE FROM GachaData WHERE Token = ?").run(Token);
        this.DB.prepare("DELETE FROM GachaProfiles WHERE Token = ?").run(Token);
    });
    constructor() {
        super();
        process.on("SIGINT", () => this.DB.close());
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
    async CreateProfile(Token) {
        this.CreateGachaProfileSTMT.run(Token);
    }
    async RefreshStorage(Args) {
        this.RefreshStorageSTMT.run(Args);
    }
    async RefreshData(Args) {
        this.RefreshDataSTMT.run(Args);
    }
    async ResetBanner(Token, BannerName) {
        this.ResetBannerSTMT(Token, BannerName);
    }
    async DeleteProfile(Token) {
        this.DeleteProfileSTMT(Token);
    }
    async GetStorage() {
        return this.DB.prepare(`
            SELECT
                GP.Token,
                GS.Banner,
                GS.Rarity,
                GS.ID,
                GS.Count
            FROM GachaStorage GS JOIN GachaProfiles GP ON GP.Token = GS.Token
        `).all();
    }
    async GetData() {
        return this.DB.prepare(`
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
