import Database from "@Database";
import LoadEnv from "@LoadEnv";
import Server from "@Server";

Server.get("/api/banners/:Page", (Req, Res) => {
    const Page: number = Number(Req.params.Page) || -1;    
    if(Page < 1) {
        Res.status(400).json({ message: "Invalid pagination index." });
        return;
    }

    Res.json(Database.Manager.GetBannersSTMT.all(LoadEnv.PAGE_SIZE, Page * LoadEnv.PAGE_SIZE));
});