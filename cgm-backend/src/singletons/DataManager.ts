import type { Database as DBType, Statement } from "better-sqlite3";
import type { Banner } from "#types/Banner";
import type BannerTypes from "#types/BannerTypes";
import type { Operator } from "#types/Operator";
import type { SearchQuery } from "#types/SearchQuery";
import type { SearchResult } from "#types/SearchResult";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs/promises";
import FormMediaURL from "#helpers/FormMediaURL";
import Switch from "#helpers/Switch";
import Items from "#types/Items";

const DBDir: string = path.join(import.meta.dirname, "..", "..", "database");
await fs.mkdir(DBDir, { recursive: true });

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

export default new class DataManager {
    public readonly DB: DBType = new Database(path.join(DBDir, "Banners.db"));
    public readonly GetBannersSTMT: Statement<[number, number], SearchResult>;
    public readonly SearchBannersSTMT = this.DB.transaction((
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
            Conditions.push(`every(?, Name)`);
            Args.push(JSON.stringify(Includes));
        }

        return this.DB.prepare<any[], SearchResult>(`
            SELECT * FROM Banners
            ${Conditions.length ? `WHERE ${Conditions.join(" AND ")}` : ""}
            ORDER BY ReleaseDate DESC
            LIMIT ? OFFSET ?
        `).all(...Args, PageSize, (PageIndex - 1) * PageSize);
    });

    public readonly Operators: Map<string, Operator>;
    public readonly Banners: Map<string, Banner> = new Map();
    public readonly BannerNameCache: string[];
    public readonly BannerPoolCache: Map<string, Set<string>> = new Map();
    
    public constructor() {
        process.on("SIGINT", () => this.DB.close());

        this.DB.pragma("journal_mode = WAL");
        this.DB.pragma("foreign_keys = ON");
        this.DB.exec(`
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
                Name TEXT NOT NULL,
                Rarity INTEGER NOT NULL,

                Prima TEXT,
                Secondary TEXT,
                Standard TEXT NOT NULL,

                PRIMARY KEY (Name, Rarity),
                FOREIGN KEY (Name) REFERENCES Banners(Name),

                CHECK(Rarity IN (3, 4, 5, 6))
            );

            CREATE TABLE IF NOT EXISTS Banners(
                Name TEXT PRIMARY KEY,
                ReleaseDate INTEGER NOT NULL,
                Type TEXT NOT NULL
            );
        `);
        this.DB.function(
            "every",
            { deterministic: true },
            (SetJSON: string, Name: string): 0 | 1 => {
                const Set: string[] = JSON.parse(SetJSON);
                const PoolOps: Set<string> = this.BannerPoolCache.get(Name)!;
                return +Set.every(OP => PoolOps.has(OP)) as 0 | 1;
            }
        );
        this.GetBannersSTMT = this.DB.prepare<[number, number], SearchResult>(`
            SELECT * FROM Banners
            ORDER BY ReleaseDate DESC
            LIMIT ? OFFSET ?
        `);

        this.Operators = new Map<string, Operator>(
            this.DB.prepare<[], OperatorsRow>("SELECT * FROM Operators").all().map(Row => {
                const { ID, Limited, ...Rest } = Row;
                return [ID, { ...Rest, Limited: !!Limited }];
            })
        );
        this.BannerNameCache = this.DB.prepare<[], { Name: string; }>("SELECT Name FROM Banners").all().map(Row => Row.Name);

        const Query: BannersRow[] = this.DB.prepare<[], BannersRow>(`
            SELECT
                B.Name,
                B.ReleaseDate,
                B.Type,
                BP.Rarity,
                BP.Prima,
                BP.Secondary,
                BP.Standard
            FROM BannerPools BP JOIN Banners B ON BP.Name = B.Name
            ORDER BY ReleaseDate DESC
        `).all();

        Query.forEach(Row => {
            const { Name, Prima, Secondary: Second, Standard: STD, ...Rest } = Row;
            const Banner: Banner = this.Banners.get(Name) ?? {
                ...Rest,
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

            const Primary: string[] = JSON.parse(Prima ?? "[]");
            const Secondary: string[] = JSON.parse(Second ?? "[]");
            const Standard: string[] = JSON.parse(STD);

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
        });
    }

    public GetBannerCover(Name: string): URL | undefined {
        return this.Banners.has(Name)
            ? FormMediaURL("banners/covers", Name)
            : undefined
        ;
    }

    public GetOperatorArt(OperatorID: string): URL | undefined {
        return this.Operators.has(OperatorID)
            ? FormMediaURL("operators/e0", OperatorID)
            : undefined
        ;
    }
    public GetOperatorE2Art(OperatorID: string): URL | undefined {
        return this.Operators.has(OperatorID)
            ? FormMediaURL("operators/e2", OperatorID)
            : undefined
        ;
    }
    public GetOperatorCard(OperatorID: string): URL | undefined {
        return this.Operators.has(OperatorID)
            ? FormMediaURL("operators/cards", OperatorID)
            : undefined
        ;
    }
}();