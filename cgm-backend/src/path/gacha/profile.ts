import type { GachaProfile } from "#types/GachaProfile";
import GachaSystem from "#GachaSystem";
import Server from "#Server";

Server.get("/gacha/profile", (Req, Res) => {
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
});