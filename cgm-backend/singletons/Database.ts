import type { Database as DBType } from "better-sqlite3";
import type { Banner } from "#types/Banner";
import type { Operator } from "#types/Operator";
import type { SearchQuery } from "#types/SearchQuery";
import type { SearchResult } from "#types/SearchResult";
import { BannerTypes } from "#types/BannerTypes";
import { Items } from "#types/Items";
import LoadEnv from "#LoadEnv";
import Switch from "#helpers/Switch";
import FormMediaURL from "#helpers/FormMediaURL";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs/promises";

const DBDir: string = path.join(import.meta.dirname, "..", "database");
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
    (SubsetJSON: string, SupersetJSON: string): 0 | 1 => {
        const Subset: string[] = JSON.parse(SubsetJSON);
        const Superset: Set<string> = new Set(JSON.parse(SupersetJSON));

        return Number(Subset.length && Subset.every(x => Superset.has(x))) as 0 | 1;
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
        DB.prepare<[], OperatorsRow>("SELECT ID, Name, Rarity, ReleaseDate, Limited FROM Operators").all().map(Row => 
            [Row.ID, { Name: Row.Name, Rarity: Row.Rarity, ReleaseDate: Row.ReleaseDate, Limited: !!Row.Limited }]
        )
    );
    public readonly Banners: Map<string, Banner> = new Map();
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
        const Condition: string[] = [];
        const Args: any[] = [];

        if(NameQuery) {
            Condition.push("LOWER(B.Name) LIKE ?");
            Args.push(`%${NameQuery}%`.toLowerCase());
        }

        if(BannerType) {
            Condition.push("B.Type = ?");
            Args.push(BannerType);
        }
        
        if(From) {
            Condition.push("B.ReleaseDate >= ?");
            Args.push(From);
        }

        if(To) {
            Condition.push("B.ReleaseDate <= ?");
            Args.push(To);
        }

        if(Includes) {
            const JSONString: string = JSON.stringify(Includes);
            Condition.push(`(
                BP.Prima IS NOT NULL AND every(?, BP.Prima) OR
                BP.Secondary IS NOT NULL AND every(?, BP.Secondary) OR
                every(?, BP.Standard)
            )`);
            Args.push(JSONString, JSONString, JSONString);
        }

        return DB.prepare<any[], SearchResult>(`
            SELECT B.Name, B.ReleaseDate, B.Type
            FROM BannerPools BP JOIN Banners B ON BP.BannerName = B.Name
            ${Condition.length ? `WHERE ${Condition.join(" AND ")}` : ""}
            LIMIT ? OFFSET ?
            ORDER BY ReleaseDate DESC
        `).all(...Args, PageSize, PageIndex * PageSize);
    });

    public constructor() {
        const Query: BannersRow[] = DB.prepare<[], BannersRow>(`
            SELECT B.Name, B.ReleaseDate, B.Type, BP.Rarity, BP.Prima, BP.Secondary, BP.Standard
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
            Switch(Row.Rarity, {
                [Items.SixStars]: (): void => {
                    Banner.SixStarsPool = {
                        Primary: JSON.parse(Row.Prima ?? "[]"),
                        Secondary: JSON.parse(Row.Secondary ?? "[]"),
                        Standard: JSON.parse(Row.Standard)
                    };
                },
                [Items.FiveStars]: (): void => {
                    Banner.FiveStarsPool = {
                        Primary: JSON.parse(Row.Prima ?? "[]"),
                        Standard: JSON.parse(Row.Standard)
                    };
                },
                [Items.FourStars]: (): void => {
                    Banner.FourStarsPool = {
                        Primary: JSON.parse(Row.Prima ?? "[]"),
                        Standard: JSON.parse(Row.Standard)
                    };
                },
                [Items.ThreeStars]: (): void => {
                    Banner.ThreeStarsPool = JSON.parse(Row.Standard);
                }
            });

            this.Banners.set(Name, Banner);
        }
    }

    // We'll see how bad this is
    public SearchBanners(Page: number, { NameQuery, BannerType, Includes, From, To }: SearchQuery): SearchResult[] {
        const Output: SearchResult[] = [];
        
        if(Includes)
            Includes = [...new Set(Includes)];

        const IncludesIn = (OP: string, Banner: Banner): boolean => 
            Banner.SixStarsPool.Primary.includes(OP) ||
            Banner.SixStarsPool.Secondary.includes(OP) ||
            Banner.SixStarsPool.Standard.includes(OP) ||
            
            Banner.FiveStarsPool.Primary.includes(OP) ||
            Banner.FiveStarsPool.Standard.includes(OP) ||

            Banner.FourStarsPool.Primary.includes(OP) ||
            Banner.FourStarsPool.Standard.includes(OP) ||

            Banner.ThreeStarsPool.includes(OP)
        ;

        const PageStart: number = (Page - 1) * LoadEnv.PAGE_SIZE;
        const PageEnd: number = PageStart + LoadEnv.PAGE_SIZE;
        let Matched: number = 0;

        for(const [Name, Banner] of this.Banners) {
            const IsMatch: boolean =
                (NameQuery == undefined || Name.toLowerCase().includes(NameQuery.trim().toLowerCase())) &&
                (BannerType == undefined || Banner.Type === BannerType) &&
                (Includes == undefined || !!Includes.length && Includes.every(OP => IncludesIn(OP, Banner))) &&
                (From == undefined || Banner.ReleaseDate >= From) &&
                (To == undefined || Banner.ReleaseDate <= To)
            ;

            if(!IsMatch)
                continue;

            if(Matched >= PageStart && Matched < PageEnd)
                Output.push({ Name, Type: Banner.Type, ReleaseDate: Banner.ReleaseDate });

            Matched++
            if(Matched >= PageEnd) {
                break;
            }
        }

        return Output;
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

export default {
    DB,
    Manager: new DataManager()
};
