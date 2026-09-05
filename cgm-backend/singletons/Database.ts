import type { Database as DBType } from "better-sqlite3";
import type { BannerTypes } from "../types/BannerTypes.js";
import type { Banner } from "../types/Banner.js";
import type { Operator } from "../types/Operator.js";
import type { SearchQuery } from "../types/SearchQuery.js";
import type { SearchResult } from "../types/SearchResult.js";
import { Items } from "../types/Items.js";
import LoadEnv from "./LoadEnv.js";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs/promises";
import Paginate from "../helpers/Paginate.js";
import Switch from "../helpers/Switch.js";

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
    private readonly Operators: Map<string, Operator> = new Map<string, Operator>(
        DB.prepare<[], OperatorsRow>("SELECT ID, Name, Rarity, ReleaseDate, Limited FROM Operators").all().map(Row => 
            [Row.ID, { Name: Row.Name, Rarity: Row.Rarity, ReleaseDate: Row.ReleaseDate, Limited: !!Row.Limited }]
        )
    );
    private readonly Banners: Map<string, Banner>;

    public constructor() {
        const Query: BannersRow[] = DB.prepare<[], BannersRow>(`
            SELECT B.Name, B.ReleaseDate, B.Type, BP.Rarity, BP.Prima, BP.Secondary, BP.Standard
            FROM BannerPools BP JOIN Banners B ON BP.BannerName = B.Name
        `).all();
        const Banners: Map<string, Banner> = new Map();
        for(const Row of Query) {
            const Name: string = Row.Name;
            const Banner: Banner = Banners.get(Name) ?? {
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

            Banners.set(Name, Banner);
        }

        this.Banners = new Map([...Banners.entries()].sort((A, B) => B[1].ReleaseDate - A[1].ReleaseDate));
    }

    private static FormMediaURL(Base: string, Name: string): string {
        const MediaURL: URL = new URL(`${LoadEnv.BASE_MEDIA_URL}/${Base}/${encodeURIComponent(Name).replace(/\ /g, "_")}.png`);
        MediaURL.pathname = MediaURL.pathname.replace(/\/+/g, '/');
        return MediaURL.toString();
    };

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
    public GetBanner(Name: string): Banner | undefined {
        return this.Banners.get(Name);
    }
    public GetBanners(Page: number): SearchResult[] {
        return [...Paginate(LoadEnv.PAGE_SIZE, Page, this.Banners.entries())].map(([Name, Banner]) => ({
            Name,
            Type: Banner.Type,
            ReleaseDate: Banner.ReleaseDate
        }));
    }
    public GetBannerCover(Name: string): string | undefined {
        return this.Banners.has(Name) 
            ? DataManager.FormMediaURL("banners/covers", Name) 
            : undefined
        ;
    }

    public GetOperator(OperatorID: string): Operator | undefined {
        return this.Operators.get(OperatorID);
    }
    public GetOperatorArt(OperatorID: string): string | undefined {
        return this.Operators.has(OperatorID) 
            ? DataManager.FormMediaURL("operators/e0", OperatorID) 
            : undefined
        ;
    }
    public GetOperatorE2Art(OperatorID: string): string | undefined {
        return this.Operators.has(OperatorID) 
            ? DataManager.FormMediaURL("operators/e2", OperatorID) 
            : undefined
        ;
    }
    public GetOperatorCard(OperatorID: string): string | undefined {
        return this.Operators.has(OperatorID) 
            ? DataManager.FormMediaURL("operators/cards", OperatorID) 
            : undefined
        ;
    }
}

export default {
    DB,
    Manager: new DataManager()
};