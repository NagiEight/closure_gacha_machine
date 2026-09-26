import type { GachaProfile } from "#types/GachaProfile";
import type { Banner } from "#types/Banner";
import DataManager from "#DataManager";
import GachaSystem from "#GachaSystem";
import Server from "#Server";

Server.patch("/gacha/reset/:BannerName", async (Req, Res) => {
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
    const Banner: Banner | undefined = DataManager.Banners.get(BannerName);

    if(!Banner) {
        Res.status(404).json({ message: `Banner '${BannerName}' doesn't exist.` });
        return;
    }

    await GachaSystem.ResetBanner(Token, BannerName);
    Res.send(`Progress on ${BannerName} has been reset successfully.`);
});