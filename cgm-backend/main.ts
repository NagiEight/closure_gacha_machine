import type { Express } from "express";
import express from "express";
import LoadEnv from "./singletons/LoadEnv.js";
import Database, { type Banner, type Operator } from "./singletons/Database.js";
import GachaSystem, { type GachaProfile } from "./singletons/GachaSystem.js";

const Server: Express = express();

// API endpoint
Server.get("/api/banners/:Page", (Req, Res) => {
    const Page: number = Number(Req.params.Page);

    if(!Page || Page <= 0) {
        Res.status(404).json({ message: "Invalid pagination index." });
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
    const BannerCover: Buffer | undefined = Database.Manager.GetBannerCover(BannerName);

    if(!BannerCover) {
        Res.status(404).json({ message: `Banner '${BannerName}' doesn't exist.` });
        return;
    }

    Res.set("Content-Type", "image/png");
    Res.send(BannerCover);
})
.get("/assets/operator/:OperatorID", (Req, Res) => {
    const OperatorID: string = Req.params.OperatorID;
    const OperatorArt: Buffer | undefined = Database.Manager.GetOperatorArt(OperatorID);

    if(!OperatorArt) {
        Res.status(404).json({ message: `Operator '${OperatorID}' doesn't exist.` });
        return;
    }
    
    Res.set("Content-Type", "image/png");
    Res.send(OperatorArt);
})
.get("/assets/e2operator/:OperatorID", (Req, Res) => {
    const OperatorID: string = Req.params.OperatorID;
    const OperatorArt: Buffer | undefined = Database.Manager.GetOperatorE2Art(OperatorID);

    if(!OperatorArt) {
        Res.status(404).json({ message: `Operator '${OperatorID}' doesn't exist.` });
        return;
    }
    
    Res.set("Content-Type", "image/png");
    Res.send(OperatorArt);
});

// Gacha endpoint
Server.post("/gacha/create", (_, Res) => {
    const Token: string = GachaSystem.CreateProfile();
    Res.set("Session-Token", Token);
    Res.send("Create profile successfully.");
})
.post("/gacha/:BannerName/roll", (Req, Res) => {
    const BannerName: string = Req.params.BannerName;
    
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

    const Banner: Banner | undefined = Database.Manager.GetBanner(BannerName);
    
    if(!Banner) {
        Res.status(404).json({ message: `Banner '${BannerName}' doesn't exist.` });
        return;
    }

    const Result: string = Object.keys(GachaSystem.Roll(Token, BannerName)!)[0];
    Res.json({ Result });
})
.post("/gacha/:BannerName/roll/:Count", (Req, Res) => {
    const BannerName: string = Req.params.BannerName;
    const Count: number = Number(Req.params.Count);

    if(!Count && Count < 1) {
        Res.status(404).json({ message: "Roll count has to be a number greater or equals to 1." });
        return;
    }

    const Banner: Banner | undefined = Database.Manager.GetBanner(BannerName);
    
    if(!Banner) {
        Res.status(404).json({ message: `Banner '${BannerName}' doesn't exist.` });
        return;
    }

    const Token: string | undefined = Req.get("Session-Token");
    
    if(!Token) {
        Res.status(404).json({ message: `Missing session token.` });
        return;
    }
    
    const Profile: GachaProfile | undefined = GachaSystem.GetProfile(Token);
    
    if(!Profile) {
        Res.status(404).json({ message: `There are no profile associated with this token.` });
        return;
    }

    const Result: string[] = GachaSystem.RollMulti(Token, BannerName, Count)!;
    Res.json({ Result });
})
.purge("/gacha/delete", (Req, Res) => {
    const Token: string | undefined = Req.get("Session-Token");

    if(!Token) {
        Res.status(404).json({ message: `Missing session token.` });
        return;
    }
    
    const Profile: GachaProfile | undefined = GachaSystem.GetProfile(Token);
    
    if(!Profile) {
        Res.status(404).json({ message: `There are no profile associated with this token.` });
        return;
    }

    GachaSystem.DeleteProfile(Token);
    Res.send("Delete profile successfully.");
});

Server.listen(LoadEnv.PORT, (): void => console.log(`Server is running on port ${LoadEnv.PORT}.`));