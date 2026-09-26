import DataManager from "#DataManager";
import Server from "#Server";

Server.get("/assets/banner/:BannerName", (Req, Res) => {
    const BannerName: string = Req.params.BannerName;
    const BannerCover: string | undefined = DataManager.GetBannerCover(BannerName)?.toString();

    if(!BannerCover) {
        Res.status(404).json({ message: `Banner '${BannerName}' doesn't exist.` });
        return;
    }

    Res.set("Content-Type", "text/plain");
    Res.send(BannerCover);
});