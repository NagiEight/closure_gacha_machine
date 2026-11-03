import DataManager from "#DataManager";
import GachaSystem from "#GachaSystem";
import Server from "#Server";
Server.patch("/gacha/reset/:BannerName", async (Req, Res) => {
    const Token = Req.get("Session-Token");
    if (!Token) {
        Res.status(400).json({ message: "Missing session token." });
        return;
    }
    const Profile = GachaSystem.GetProfile(Token);
    if (!Profile) {
        Res.status(404).json({ message: "There are no profile associated with this token." });
        return;
    }
    const BannerName = Req.params.BannerName;
    const Banner = DataManager.Banners.get(BannerName);
    if (!Banner) {
        Res.status(404).json({ message: `Banner '${BannerName}' doesn't exist.` });
        return;
    }
    await GachaSystem.ResetBanner(Token, BannerName);
    Res.send(`Progress on ${BannerName} has been reset successfully.`);
});
