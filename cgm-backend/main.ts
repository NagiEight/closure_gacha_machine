import express, { type Express } from "express";
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
        Res.status(404).json({ message: "Missing session token." });
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

    const PreserveRarity: string | undefined = Req.query.preserverarity?.toString().trim().toLowerCase();
    const Result: [string, 3 | 4 | 5 | 6] = GachaSystem.Roll(Token, BannerName)!;
    if(PreserveRarity === "true" || PreserveRarity === "1") {
        Res.json({ Result });
        return;
    }
    Res.json({ Result: Result[0] });
})
.post("/gacha/:BannerName/roll/:Count", (Req, Res) => {
    const BannerName: string = Req.params.BannerName;
    const Count: number = Number(Req.params.Count);

    if(!Count && Count <= 0) {
        Res.status(404).json({ message: "Roll count must be a number greater than 0." });
        return;
    }

    const Banner: Banner | undefined = Database.Manager.GetBanner(BannerName);
    
    if(!Banner) {
        Res.status(404).json({ message: `Banner '${BannerName}' doesn't exist.` });
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

    const Reduced: string | undefined = Req.query.reduced?.toString().trim().toLowerCase();
    const PreserveRarity: string | undefined = Req.query.preserverarity?.toString().trim().toLowerCase();
    if(Reduced === "true" || Reduced === "1") {
        Res.json(PreserveRarity === "true" || PreserveRarity === "1"
            ? GachaSystem.RollMultiReduced(Token, BannerName, Count, true)!
            : GachaSystem.RollMultiReduced(Token, BannerName, Count)!
        );
        return;
    }
    Res.json({ 
        Result: PreserveRarity === "true" || PreserveRarity === "1"
            ? GachaSystem.RollMulti(Token, BannerName, Count, true)!
            : GachaSystem.RollMulti(Token, BannerName, Count)!
    });
})
.purge("/gacha/delete", (Req, Res) => {
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

    GachaSystem.DeleteProfile(Token);
    Res.send("Delete profile successfully.");
});

Server.listen(LoadEnv.PORT, (): void => console.log(`Server is running on port ${LoadEnv.PORT}.`));