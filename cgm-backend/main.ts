import type { Banner } from "./types/Banner.js";
import type { Operator } from "./types/Operator.js";
import type { Selection } from "./types/BannerStrategy.js";
import type { GachaProfile } from "./types/GachaProfile.js";
import type { SearchQuery } from "./types/SearchQuery.js";
import type { Express } from "express";
import type { RateLimitRequestHandler } from "express-rate-limit";
import { BannerTypes } from "./types/BannerTypes.js";
import Database from "./singletons/Database.js";
import GachaSystem from "./singletons/GachaSystem.js";
import LoadEnv from "./singletons/LoadEnv.js";
import rateLimit from "express-rate-limit";
import express from "express";

const Server: Express = express();
const Limiter: RateLimitRequestHandler = rateLimit({
    windowMs: 1000,
    limit: LoadEnv.RATE_LIMIT,
    message: {
        error: "Too many requests, please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false
});

Server.use(Limiter, express.json());

// API endpoint
Server.get("/api/banners/search", (Req, Res) => {
    const Body: SearchQuery = Req.body ?? {};
    const Page: number = Number(Req.query.page?.toString()) || -1;

    if(Page <= 0) {
        Res.status(400).json({ message: "Invalid pagination index." });
        return;
    }

    if(!Object.keys(Body).length) {
        Res.status(400).json({ message: "Missing request body." });
        return;
    }

    if(Body.BannerType && Object.values(BannerTypes).includes(Body.BannerType)) {
        Res.status(404).json({ message: `Unknown banner type '${Body.BannerType}'.` });
        return;
    }

    Res.json(Database.Manager.SearchBanners(Page, Body));
})
.get("/api/banners/:Page", (Req, Res) => {
    if(Req.params.Page === "all") {
        Res.json(Database.DB.prepare<[], { Name: string; }>("SELECT Name FROM Banners").all().map(Row => Row.Name));
        return;
    }

    const Page: number = Number(Req.params.Page) || -1;    
    if(Page <= 0) {
        Res.status(400).json({ message: "Invalid pagination index." });
        return;
    }

    Res.json(Database.Manager.GetBanners(Page));
})
.get("/api/banner/:BannerName", (Req, Res) => {
    const BannerName: string = Req.params.BannerName;
    const Banner: Banner | undefined = Database.Manager.GetBanner(BannerName);

    if(!Banner) {
        Res.status(404).json({ message: `Banner '${BannerName}' doesn't exist.` });
        return;
    }

    Res.json({
        Name: BannerName,
        OperatorPool: Banner
    });
})
.get("/api/operator/:OperatorID", (Req, Res) => {
    const OperatorID: string = Req.params.OperatorID;
    const Operator: Operator | undefined = Database.Manager.GetOperator(OperatorID);

    if(!Operator) {
        Res.status(404).json({ message: `Operator '${OperatorID}' doesn't exist.` });
        return;
    }

    Res.json({ 
        ID: OperatorID,
        ...Operator
    });
});

// Assets endpoint
Server.get("/assets/banner/:BannerName", (Req, Res) => {
    const BannerName: string = Req.params.BannerName;
    const BannerCover: string | undefined = Database.Manager.GetBannerCover(BannerName);

    if(!BannerCover) {
        Res.status(404).json({ message: `Banner '${BannerName}' doesn't exist.` });
        return;
    }

    Res.set("Content-Type", "text/plain");
    Res.send(BannerCover);
})
.get("/assets/operator/:OperatorID", (Req, Res) => {
    const OperatorID: string = Req.params.OperatorID;
    const OperatorArt: string | undefined = Database.Manager.GetOperatorArt(OperatorID);

    if(!OperatorArt) {
        Res.status(404).json({ message: `Operator '${OperatorID}' doesn't exist.` });
        return;
    }
    
    Res.set("Content-Type", "text/plain");
    Res.send(OperatorArt);
})
.get("/assets/e2operator/:OperatorID", (Req, Res) => {
    const OperatorID: string = Req.params.OperatorID;
    const OperatorArt: string | undefined = Database.Manager.GetOperatorE2Art(OperatorID);

    if(!OperatorArt) {
        Res.status(404).json({ message: `Operator '${OperatorID}' doesn't exist.` });
        return;
    }
    
    Res.set("Content-Type", "text/plain");
    Res.send(OperatorArt);
})
.get("/assets/card/:OperatorID", (Req, Res) => {
    const OperatorID: string = Req.params.OperatorID;
    const OperatorArt: string | undefined = Database.Manager.GetOperatorCard(OperatorID);

    if(!OperatorArt) {
        Res.status(404).json({ message: `Operator '${OperatorID}' doesn't exist.` });
        return;
    }
    
    Res.set("Content-Type", "text/plain");
    Res.send(OperatorArt);
});

// Gacha endpoint
Server.post("/gacha/create", (_, Res) => {
    const Token: string = GachaSystem.CreateProfile();
    Res.set("Session-Token", Token);
    Res.send("Create profile successfully.");
})
.get("/gacha/profile", (Req, Res) => {
    const Token: string | undefined = Req.get("Session-Token");

    if(!Token) {
        Res.status(400).json({ message: "Missing session token." });
        return;
    }
    
    const Profile: GachaProfile | undefined = GachaSystem.GetProfile(Token);

    if(!Profile) {
        Res.status(404).json({ message: "There are no profile associated with this token." });
        return;
    }

    Res.json(Profile);
})
.post("/gacha/:BannerName/roll", (Req, Res) => {
    const Token: string | undefined = Req.get("Session-Token");
    
    if(!Token) {
        Res.status(400).json({ message: "Missing session token." });
        return;
    }
    
    const Profile: GachaProfile | undefined = GachaSystem.GetProfile(Token);
    
    if(!Profile) {
        Res.status(404).json({ message: "There are no profile associated with this token." });
        return;
    }
    
    const BannerName: string = Req.params.BannerName;
    const Banner: Banner | undefined = Database.Manager.GetBanner(BannerName);
    
    if(!Banner) {
        Res.status(404).json({ message: `Banner '${BannerName}' doesn't exist.` });
        return;
    }

    if(Banner.Type === BannerTypes.Orienteering) {
        const Body: Selection = Req.body ?? {};

        if(!Object.keys(Body).length) {
            Res.status(400).json({ message: `Banner type '${Banner.Type}' requires a request body.` });
            return;
        }

        if(!Body.SixStarsSelection || !Array.isArray(Body.SixStarsSelection)) {
            Res.status(400).json({ message: `Missing or invalid 6 stars selection.` });
            return;
        }

        if(!Body.FiveStarsSelection || !Array.isArray(Body.FiveStarsSelection)) {
            Res.status(400).json({ message: `Missing or invalid 5 stars selection.` });
            return;
        }
        
        Body.SixStarsSelection = [...new Set(Body.SixStarsSelection)];
        Body.FiveStarsSelection = [...new Set(Body.FiveStarsSelection)];

        const Checker = (Selection: string[], Pool: string[], Rarity: number): boolean => {
            const Excluded: string[] = [];
            const IsValid: boolean = Selection.length !== 3 || !Selection.every(OP => {
                const IsIncluded: boolean = Pool.includes(OP);
                if(!IsIncluded)
                    Excluded.push(OP);
                return IsIncluded;
            });
            
            if(IsValid) {
                Res.status(400).json(
                    `Operator${Excluded.length > 1 ? "s" : ""} ${Excluded.join(", ")}` +
                    ` do${Excluded.length > 1 ? "" : "es"} not exist or not included in ${BannerName} ${Rarity} stars pool.`
                );
                return false;
            }
            return true;
        };

        if(
            !Checker(Body.SixStarsSelection, Banner.SixStarsPool.Primary, 6) || 
            !Checker(Body.FiveStarsSelection, Banner.FiveStarsPool.Primary, 5)
        ) return;

        Res.json({
            Result: GachaSystem.Roll(Token, BannerName, true, Body)
        });
        return;
    }

    const Result: string = GachaSystem.Roll(Token, BannerName)![0];
    Res.json({ Result });
})
.post("/gacha/:BannerName/roll/:Count", (Req, Res) => {
    const Count: number = Number(Req.params.Count) || -1;
    
    if(Count <= 0) {
        Res.status(400).json({ message: "Roll count must be a number greater than 0." });
        return;
    }

    const Token: string | undefined = Req.get("Session-Token");
    
    if(!Token) {
        Res.status(404).json({ message: "Missing session token." });
        return;
    }
    
    const Profile: GachaProfile | undefined = GachaSystem.GetProfile(Token);

    if(!Profile) {
        Res.status(404).json({ message: "There are no profile associated with this token." });
        return;
    }
    
    const BannerName: string = Req.params.BannerName;
    const Banner: Banner | undefined = Database.Manager.GetBanner(BannerName);
    
    if(!Banner) {
        Res.status(404).json({ message: `Banner '${BannerName}' doesn't exist.` });
        return;
    }

    if(Banner.Type === BannerTypes.Orienteering) {
        const Body: { SixStarsSelection: string[]; FiveStarsSelection: string[]; } = Req.body ?? {};

        if(!Object.keys(Body).length) {
            Res.status(400).json({ message: `Banner type '${Banner.Type}' requires a request body.` });
            return;
        }

        if(!Body.SixStarsSelection || !Array.isArray(Body.SixStarsSelection)) {
            Res.status(400).json({ message: `Missing or invalid 6 stars selection.` });
            return;
        }

        if(!Body.FiveStarsSelection || !Array.isArray(Body.FiveStarsSelection)) {
            Res.status(400).json({ message: `Missing or invalid 5 stars selection.` });
            return;
        }
        
        Body.SixStarsSelection = [...new Set(Body.SixStarsSelection)];
        Body.FiveStarsSelection = [...new Set(Body.FiveStarsSelection)];

        const Checker = (Selection: string[], Pool: string[], Rarity: number): boolean => {
            const Excluded: string[] = [];
            const IsValid: boolean = Selection.length !== 3 || !Selection.every(OP => {
                const IsIncluded: boolean = Pool.includes(OP);
                if(!IsIncluded)
                    Excluded.push(OP);
                return IsIncluded;
            });

            if(IsValid) {
                Res.status(400).json(
                    `Operator${Excluded.length > 1 ? "s" : ""} ${Excluded.join(", ")}` +
                    ` do${Excluded.length > 1 ? "" : "es"} not exist or not included in ${BannerName} ${Rarity} stars pool.`
                );
                return false;
            }
            return true;
        };

        if(
            !Checker(Body.SixStarsSelection, Banner.SixStarsPool.Primary, 6) || 
            !Checker(Body.FiveStarsSelection, Banner.FiveStarsPool.Primary, 5)
        ) return;

        const Reduced: string | undefined = Req.query.reduced?.toString().trim().toLowerCase();
        Res.json({
            Result: Reduced === "true" || Reduced === "1"
                ? GachaSystem.RollMultiReduced(Token, BannerName, Count, Body)!
                : GachaSystem.RollMulti(Token, BannerName, Count, Body)!
        });
        return;
    }

    const Reduced: string | undefined = Req.query.reduced?.toString().trim().toLowerCase();
    Res.json({
        Result: Reduced === "true" || Reduced === "1"
            ? GachaSystem.RollMultiReduced(Token, BannerName, Count)!
            : GachaSystem.RollMulti(Token, BannerName, Count)!
    });
})
.patch("/gacha/reset/:BannerName", (Req, Res) => {
    const Token: string | undefined = Req.get("Session-Token");

    if(!Token) {
        Res.status(400).json({ message: "Missing session token." });
        return;
    }
    
    const Profile: GachaProfile | undefined = GachaSystem.GetProfile(Token);
    
    if(!Profile) {
        Res.status(404).json({ message: "There are no profile associated with this token." });
        return;
    }

    const BannerName: string = Req.params.BannerName;
    const Banner: Banner | undefined = Database.Manager.GetBanner(BannerName);

    if(!Banner) {
        Res.status(404).json({ message: `Banner '${BannerName}' doesn't exist.` });
        return;
    }

    GachaSystem.ResetBanner(Token, BannerName);
    Res.send(`Progress on ${BannerName} has been reset successfully.`);
})
.purge("/gacha/delete", (Req, Res) => {
    const Token: string | undefined = Req.get("Session-Token");

    if(!Token) {
        Res.status(400).json({ message: "Missing session token." });
        return;
    }
    
    const Profile: GachaProfile | undefined = GachaSystem.GetProfile(Token);
    
    if(!Profile) {
        Res.status(404).json({ message: "There are no profile associated with this token." });
        return;
    }

    GachaSystem.DeleteProfile(Token);
    Res.send("Delete profile successfully.");
});

Server.listen(LoadEnv.PORT, "0.0.0.0", (): void => console.log(`Server is running on port ${LoadEnv.PORT}.`));