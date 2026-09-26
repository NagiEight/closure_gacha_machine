import DataManager from "#DataManager";
import Server from "#Server";

Server.get("/api/banners/all", (_, Res) => Res.json(DataManager.BannerNameCache));