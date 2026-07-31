import type { Database as DBType } from "better-sqlite3";
import LoadEnv from "./LoadEnv.js";
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
        ReleaseDate INTEGER NOT NULL,
        Limited INTEGER NOT NULL,

        CHECK(Rarity IN (3, 4, 5, 6))
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
        Type INTEGER NOT NULL,

        CHECK(Type IN (0, 1, 2, 3, 4))
    );
`);

export enum BannerTypes {
    Standard,
    Limited,
    Orienteering,
    JointOperation,
    TFTW
}
export interface Banner {
    ReleaseDate: number;
    Type: BannerTypes;
    SixStarsPool: {
        Primary: string[];
        Secondary: string[];
        Standard: string[];
    };
    FiveStarsPool: {
        Primary: string[];
        Standard: string[];
    };
    FourStarsPool: {
        Primary: string[];
        Standard: string[];
    };
    ThreeStarsPool: string[];
}
interface BannersRow {
    Name: string;
    ReleaseDate: number;
    Type: number;
    Rarity: 3 | 4 | 5 | 6;
    Prima: string | null;
    Secondary: string | null;
    Standard: string;
}

export interface Operator {
    Name: string;
    Rarity: 3 | 4 | 5 | 6;
    ReleaseDate: number;
    Limited: boolean;
}
interface OperatorsRow {
    ID: string;
    Name: string;
    Rarity: 3 | 4 | 5 | 6;
    ReleaseDate: number;
    Limited: number;
}

class DataManager {
    private readonly Operators: Map<string, Operator> = new Map(
        (DB.prepare<[], OperatorsRow>("SELECT ID, Name, Rarity, ReleaseDate, Limited FROM Operators").all()).map(Row => 
            [Row.ID, { Name: Row.Name, Rarity: Row.Rarity, ReleaseDate: Row.ReleaseDate, Limited: !!Row.Limited }]
        )
    );
    private readonly OperatorIDs: string[] = DB.prepare<[], { Name: string }>("SELECT ID FROM Operators").all().map(Row => Row.Name);
    private readonly BannerNames: string[] = DB.prepare<[], { Name: string }>("SELECT Name FROM Banners").all().map(Row => Row.Name);
    private readonly Banners: Map<string, Banner> = new Map(this.BannerNames.map(Name => [Name, {
        ReleaseDate: 0,
        Type: BannerTypes.Standard,
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
    }]));

    public constructor() {
        const Query: BannersRow[] = DB.prepare<[], BannersRow>(`
            SELECT B.Name, B.ReleaseDate, B.Type, BP.Rarity, BP.Prima, BP.Secondary, BP.Standard
            FROM BannerPools BP JOIN Banners B ON BP.BannerName = B.Name
        `).all();
        for(const Row of Query) {
            const Name: string = Row.Name;
            const Banner: Banner | undefined = this.Banners.get(Name);

            if(!Banner)
                continue;

            Banner.ReleaseDate = Row.ReleaseDate;
            Banner.Type = Row.Type;

            switch(Row.Rarity) {
                case 3:
                    Banner.ThreeStarsPool = JSON.parse(Row.Standard);
                    break;

                case 4:
                    if(Row.Prima)
                        Banner.FourStarsPool.Primary = JSON.parse(Row.Prima);
                    Banner.FourStarsPool.Standard = JSON.parse(Row.Standard);
                    break;

                case 5:
                    if(Row.Prima)
                        Banner.FiveStarsPool.Primary = JSON.parse(Row.Prima);
                    Banner.FiveStarsPool.Standard = JSON.parse(Row.Standard);
                    break;

                case 6:
                    if(Row.Prima)
                        Banner.SixStarsPool.Primary = JSON.parse(Row.Prima);
                    if(Row.Secondary)
                        Banner.SixStarsPool.Secondary = JSON.parse(Row.Secondary);
                    Banner.SixStarsPool.Standard = JSON.parse(Row.Standard);
                    break;
            }
        }
    }

    private static Pagination<T>(Page: number, Set: T[]): T[] {
        const Start: number = (Page - 1) * LoadEnv.PAGE_SIZE;
        const End: number = Start + LoadEnv.PAGE_SIZE;
        return Set.slice(Start, End);
    }

    public GetBanner(Name: string): Banner | undefined {
        return this.Banners.get(Name);
    }
    public GetBanners(Page: number): { Name: string; Type: BannerTypes; ReleaseDate: number; }[] {
        return DataManager.Pagination(Page, this.BannerNames).map(B => {
            const Banner: Banner = this.Banners.get(B)!;
            return {
                Name: B,
                Type: Banner.Type,
                ReleaseDate: Banner.ReleaseDate
            }
        });
    }
    public GetBannerCover(Name: string): string | undefined {
        return this.BannerNames.includes(Name) ? DataManager.FormMediaURL("banners/covers", Name) : undefined;
    }

    public GetOperator(OperatorID: string): Operator | undefined {
        return this.Operators.get(OperatorID);
    }
    public GetOperatorArt(OperatorID: string): string | undefined {
        return this.OperatorIDs.includes(OperatorID) ? DataManager.FormMediaURL("operators/e0", OperatorID) : undefined;
    }
    public GetOperatorE2Art(OperatorID: string): string | undefined {
        return this.OperatorIDs.includes(OperatorID) ? DataManager.FormMediaURL("operators/e2", OperatorID) : undefined;
    }
    public GetOperatorCard(OperatorID: string): string | undefined {
        return this.OperatorIDs.includes(OperatorID) ? DataManager.FormMediaURL("operators/cards", OperatorID) : undefined;
    }

    private static FormMediaURL(Base: string, Name: string): string {
        const MediaURL: URL = new URL(`${LoadEnv.BASE_MEDIA_URL}/${Base}/${Name}`);
        MediaURL.pathname = MediaURL.pathname.replace(/\/+/g, '/');
        return MediaURL.toString(); 
    };
}

const Signals: string[] = ["SIGTERM", "SIGINT"];
for(const Signal in Signals) 
    process.on(Signal, () => DB.close());

export default {
    DB,
    Manager: new DataManager()
};