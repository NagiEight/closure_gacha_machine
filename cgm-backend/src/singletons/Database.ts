import type { Database as DBType } from "better-sqlite3";
import type { Banner } from "#types/Banner";
import type { Operator } from "#types/Operator";
import type { SearchQuery } from "#types/SearchQuery";
import type { SearchResult } from "#types/SearchResult";
import { BannerTypes } from "#types/BannerTypes";
import { Items } from "#types/Items";
import Switch from "../helpers/Switch.js";
import FormMediaURL from "../helpers/FormMediaURL.js";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs/promises";

const DBDir: string = path.join(import.meta.dirname, "..", "..", "database");
await fs.mkdir(DBDir, { recursive: true });

const DB: DBType = new Database(path.join(DBDir, "Banners.db"));
DB.pragma("journal_mode = WAL");
DB.pragma("foreign_keys = ON");
DB.exec(`
    CREATE TABLE IF NOT EXISTS Operators(
        ID TEXT PRIMARY KEY,
        Name TEXT NOT NULL,
        Rarity INTEGER NOT NULL,
        Limited INTEGER NOT NULL,
        ReleaseDate INTEGER,

        CHECK(Rarity IN (3, 4, 5, 6)),
        CHECK(Limited IN (0, 1))
    );

    CREATE TABLE IF NOT EXISTS BannerPools(
        BannerName TEXT NOT NULL,
        Rarity INTEGER NOT NULL,

        Prima TEXT,
        Secondary TEXT,
        Standard TEXT NOT NULL,

        PRIMARY KEY (BannerName, Rarity),
        FOREIGN KEY (BannerName) REFERENCES Banners(Name),

        CHECK(Rarity IN (3, 4, 5, 6))
    );

    CREATE TABLE IF NOT EXISTS Banners(
        Name TEXT PRIMARY KEY,
        ReleaseDate INTEGER NOT NULL,
        Type TEXT NOT NULL
    );
`);
DB.function(
    "every",
    { deterministic: true },
    (SetJSON: string, BannerName: string): 0 | 1 => {
        const Set: string[] = JSON.parse(SetJSON);
        const PoolOps: Set<string> = Manager.BannerPoolCache.get(BannerName)!;
        return +Set.every(OP => PoolOps.has(OP)) as 0 | 1;
    }
);

interface BannersRow {
    Name: string;
    ReleaseDate: number;
    Type: BannerTypes;
    Rarity: Items;
    Prima: string | null;
    Secondary: string | null;
    Standard: string;
}

interface OperatorsRow {
    ID: string;
    Name: string;
    Rarity: Items;
    ReleaseDate: number | null;
    Limited: number;
}
class DataManager {
    public readonly Operators: Map<string, Operator> = new Map<string, Operator>(
        DB.prepare<[], OperatorsRow>("SELECT * FROM Operators").all().map(Row => {
            const { ID, Limited, ...Rest } = Row;
            return [ID, { ...Rest, Limited: !!Limited }];
        })
    );
    public readonly Banners: Map<string, Banner> = new Map();
    public readonly BannerPoolCache: Map<string, Set<string>> = new Map();

    public readonly GetBannersSTMT = DB.prepare<[number, number], SearchResult>(`
        SELECT * FROM Banners
        ORDER BY ReleaseDate DESC
        LIMIT ? OFFSET ?
    `);
    public readonly SearchBannersSTMT = DB.transaction((
        PageIndex: number,
        PageSize: number,
        {
            NameQuery,
            BannerType,
            Includes,
            From,
            To
        }: SearchQuery
    ): SearchResult[] => {
        const Conditions: string[] = [];
        const Args: any[] = [];

        if(NameQuery) {
            Conditions.push("LOWER(Name) LIKE ?");
            Args.push(`%${NameQuery.trim().toLowerCase()}%`);
        }

        if(BannerType) {
            Conditions.push("Type = ?");
            Args.push(BannerType);
        }
        
        if(From != undefined) {
            Conditions.push("ReleaseDate >= ?");
            Args.push(From);
        }

        if(To != undefined) {
            Conditions.push("ReleaseDate <= ?");
            Args.push(To);
        }

        if(Includes?.length) {
            const JSONString: string = JSON.stringify(Includes);
            Conditions.push(`every(?, Name)`);
            Args.push(JSONString);
        }

        return DB.prepare<any[], SearchResult>(`
            SELECT * FROM Banners
            ${Conditions.length ? `WHERE ${Conditions.join(" AND ")}` : ""}
            ORDER BY ReleaseDate DESC
            LIMIT ? OFFSET ?
        `).all(...Args, PageSize, (PageIndex - 1) * PageSize);
    });

    public constructor() {
        const Query: BannersRow[] = DB.prepare<[], BannersRow>(`
            SELECT
                B.Name,
                B.ReleaseDate,
                B.Type,
                BP.Rarity,
                BP.Prima,
                BP.Secondary,
                BP.Standard
            FROM BannerPools BP JOIN Banners B ON BP.BannerName = B.Name
            ORDER BY ReleaseDate DESC
        `).all();
        for(const Row of Query) {
            const Name: string = Row.Name;
            const Banner: Banner = this.Banners.get(Name) ?? {
                ReleaseDate: Row.ReleaseDate,
                Type: Row.Type,
                SixStarsPool: {
                    Primary: [],
                    Secondary: [],
                    Standard: []
                },
                FiveStarsPool: {
                    Primary: [],
                    Standard: []
                },
                FourStarsPool: {
                    Primary: [],
                    Standard: []
                },
                ThreeStarsPool: []
            };

            const Primary: string[] = JSON.parse(Row.Prima ?? "[]");
            const Secondary: string[] = JSON.parse(Row.Secondary ?? "[]");
            const Standard: string[] = JSON.parse(Row.Standard);

            this.BannerPoolCache.set(Name, new Set([
                ...(this.BannerPoolCache.get(Name) ?? []),
                ...Primary,
                ...Secondary,
                ...Standard
            ]));

            Switch(Row.Rarity, {
                [Items.SixStars]: (): any => Banner.SixStarsPool = { Primary, Secondary, Standard },
                [Items.FiveStars]: (): any => Banner.FiveStarsPool = { Primary, Standard },
                [Items.FourStars]: (): any => Banner.FourStarsPool = { Primary, Standard },
                [Items.ThreeStars]: (): any => Banner.ThreeStarsPool = Standard
            });

            this.Banners.set(Name, Banner);
        }
    }

    public GetBannerCover(Name: string): string | undefined {
        return this.Banners.has(Name)
            ? FormMediaURL("banners/covers", Name)
            : undefined
        ;
    }

    public GetOperatorArt(OperatorID: string): string | undefined {
        return this.Operators.has(OperatorID)
            ? FormMediaURL("operators/e0", OperatorID)
            : undefined
        ;
    }
    public GetOperatorE2Art(OperatorID: string): string | undefined {
        return this.Operators.has(OperatorID)
            ? FormMediaURL("operators/e2", OperatorID)
            : undefined
        ;
    }
    public GetOperatorCard(OperatorID: string): string | undefined {
        return this.Operators.has(OperatorID)
            ? FormMediaURL("operators/cards", OperatorID)
            : undefined
        ;
    }
}

const Manager: DataManager = new DataManager();

export default { DB, Manager };