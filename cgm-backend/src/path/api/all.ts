import Database from "#Database";
import Server from "#Server";

Server.get("/api/banners/all", (_, Res) => Res.json(Database.Manager.BannerNameCache));