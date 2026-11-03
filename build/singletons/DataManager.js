import FormMediaURL from "#helpers/FormMediaURL";
import Switch from "#helpers/Switch";
import Items from "#types/Items";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs/promises";
const DBDir = path.join(import.meta.dirname, "..", "database");
await fs.mkdir(DBDir, { recursive: true });
export default new class DataManager extends Database {
    GetBannersSTMT;
    SearchBannersSTMT = this.transaction((PageIndex, PageSize, { NameQuery, BannerType, Includes, From, To }) => {
        const Conditions = [];
        const Args = [];
        if (NameQuery) {
            Conditions.push("LOWER(Name) LIKE ? ESCAPE '\\'");
            Args.push(`%${NameQuery
                .trim()
                .toLowerCase()
                .replace(/\\/g, "\\\\")
                .replace(/%/g, "\\%")
                .replace(/_/g, "\\_")}%`);
        }
        if (BannerType) {
            Conditions.push("Type = ?");
            Args.push(BannerType);
        }
        if (From != undefined) {
            Conditions.push("ReleaseDate >= ?");
            Args.push(From);
        }
        if (To != undefined) {
            Conditions.push("ReleaseDate <= ?");
            Args.push(To);
        }
        if (Includes?.length) {
            Conditions.push("every(?, Name)");
            Args.push(JSON.stringify(Includes));
        }
        return this.prepare(`
            SELECT * FROM Banners
            ${Conditions.length ? `WHERE ${Conditions.join(" AND ")}` : ""}
            ORDER BY ReleaseDate DESC
            LIMIT ? OFFSET ?
        `).all(...Args, PageSize, (PageIndex - 1) * PageSize);
    });
    Operators;
    Banners = new Map();
    BannerNameCache;
    BannerPoolCache = new Map();
    constructor() {
        super(path.join(DBDir, "Banners.db"));
        process.on("SIGINT", () => this.close());
        this.pragma("journal_mode = WAL");
        this.pragma("foreign_keys = ON");
        this.exec(`
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
        `)
            .function("every", { deterministic: true }, (SetJSON, Name) => {
            const Set = JSON.parse(SetJSON);
            const PoolOps = this.BannerPoolCache.get(Name);
            return +Set.every(OP => PoolOps.has(OP));
        });
        this.GetBannersSTMT = this.prepare(`
            SELECT * FROM Banners
            ORDER BY ReleaseDate DESC
            LIMIT ? OFFSET ?
        `);
        this.Operators = new Map(this.prepare("SELECT * FROM Operators").all().map(Row => {
            const { ID, Limited: LTD, ...Rest } = Row;
            const Limited = !!LTD;
            return [ID, { ...Rest, Limited }];
        }));
        this.BannerNameCache = this.prepare("SELECT Name FROM Banners").all().map(Row => Row.Name);
        const Query = this.prepare(`
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
            const Banner = this.Banners.get(Name) ?? {
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
            const Primary = JSON.parse(Prima ?? "[]");
            const Secondary = JSON.parse(Second ?? "[]");
            const Standard = JSON.parse(STD);
            this.BannerPoolCache.set(Name, new Set([
                ...(this.BannerPoolCache.get(Name) ?? []),
                ...Primary,
                ...Secondary,
                ...Standard
            ]));
            Switch(Row.Rarity, {
                [Items.SixStars]: () => Banner.SixStarsPool = { Primary, Secondary, Standard },
                [Items.FiveStars]: () => Banner.FiveStarsPool = { Primary, Standard },
                [Items.FourStars]: () => Banner.FourStarsPool = { Primary, Standard },
                [Items.ThreeStars]: () => Banner.ThreeStarsPool = Standard
            });
            this.Banners.set(Name, Banner);
        });
    }
    GetBannerCover(Name) {
        return this.Banners.has(Name)
            ? FormMediaURL("banners/covers", Name)
            : undefined;
    }
    GetOperatorArt(OperatorID) {
        return this.Operators.has(OperatorID)
            ? FormMediaURL("operators/e0", OperatorID)
            : undefined;
    }
    GetOperatorE2Art(OperatorID) {
        return this.Operators.has(OperatorID)
            ? FormMediaURL("operators/e2", OperatorID)
            : undefined;
    }
    GetOperatorCard(OperatorID) {
        return this.Operators.has(OperatorID)
            ? FormMediaURL("operators/cards", OperatorID)
            : undefined;
    }
}();
