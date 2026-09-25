import type { GachaProfileDataRow } from "#types/GachaProfileDataRow";
import type { GachaProfileStorageRow } from "#types/GachaProfileStorageRow";
import type { Client, Transaction } from "@libsql/client";
import { createClient } from "@libsql/client";
import UserDatabase from "#types/UserDatabase";
import LoadEnv from "#LoadEnv";

export default class UserDatabaseTurso extends UserDatabase {
    public readonly DB: Client = createClient({
        url: LoadEnv.DATABASE_URL,
        authToken: LoadEnv.DATABASE_TOKEN
    });

    public async Initialize(): Promise<UserDatabaseTurso> {
        await this.DB.batch([
            "PRAGMA foreign_keys = ON",
            `CREATE TABLE IF NOT EXISTS GachaData(
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
            )`,
            `CREATE TABLE IF NOT EXISTS GachaStorage(
                Token TEXT NOT NULL,
                Banner TEXT NOT NULL,
                Rarity INTEGER NOT NULL,
                ID TEXT NOT NULL,

                Count INTEGER NOT NULL,

                PRIMARY KEY (Token, Banner, Rarity, ID),
                FOREIGN KEY (Token) REFERENCES GachaProfiles(Token),

                CHECK(Rarity IN (3, 4, 5, 6)),
                CHECK(Count >= 0)
            )`,
            `CREATE TABLE IF NOT EXISTS GachaProfiles(
                Token TEXT PRIMARY KEY
            )`
        ], "write");
        return this;
    }

    public async CreateProfile(Token: string): Promise<void> {
        await this.DB.execute(`
            INSERT INTO GachaProfiles(Token)
            VALUES(?)
        `, [Token]);
    }

    public async RefreshStorage(Args: GachaProfileStorageRow): Promise<void> {
        await this.DB.execute({
            sql: `
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
            `,
            args: { ...Args }
        });
    }

    public async RefreshData(Args: GachaProfileDataRow): Promise<void> {
        await this.DB.execute({
            sql: `
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
            `,
            args: { ...Args }
        })
    }

    public async ResetBanner(Token: string, BannerName: string): Promise<void> {
        const Transaction: Transaction = await this.DB.transaction("write");
        const args: [string, string] = [Token, BannerName];
        try {
            await Transaction.execute({
                sql: `
                    DELETE FROM GachaData
                    WHERE Token = ? AND Banner = ?
                `,
                args
            });
            await Transaction.execute({
                sql: `
                    DELETE FROM GachaStorage
                    WHERE Token = ? AND Banner = ?
                `,
                args
            });
            await Transaction.commit();
        }
        catch(Err) {
            console.error(Err);
            await Transaction.rollback();
        }
        finally {
            Transaction.close();
        }
    }

    public async DeleteProfile(Token: string): Promise<void> {
        const Transaction: Transaction = await this.DB.transaction("write");
        const args: [string] = [Token];
        try {
            await Transaction.execute({
                sql: "DELETE FROM GachaStorage WHERE Token = ?",
                args
            });
            await Transaction.execute({
                sql: "DELETE FROM GachaData WHERE Token = ?",
                args
            });
            await Transaction.execute({
                sql: "DELETE FROM GachaProfiles WHERE Token = ?",
                args
            });
    
            await Transaction.commit();
        }
        catch(Err) {
            console.error(Err);
            await Transaction.rollback();
        }
        finally {
            Transaction.close();
        }
    }

    public async GetStorage(): Promise<GachaProfileStorageRow[]> {
        return (await this.DB.execute(`
            SELECT
                GP.Token,
                GS.Banner,
                GS.Rarity,
                GS.ID,
                GS.Count
            FROM GachaStorage GS JOIN GachaProfiles GP ON GP.Token = GS.Token
        `)).rows as unknown as GachaProfileStorageRow[];
    }

    public async GetData(): Promise<GachaProfileDataRow[]> {
        return (await this.DB.execute(`
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
        `)).rows as unknown as GachaProfileDataRow[];
    }
}