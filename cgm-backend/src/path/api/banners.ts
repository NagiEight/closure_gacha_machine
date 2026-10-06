import DataManager from "#DataManager";
import Server from "#Server";
import Env from "commaenv";

Server.get("/api/banners/:Page", (Req, Res) => {
    const Page: number = Number(Req.params.Page) || -1;    
    if(Page < 1) {
        Res.status(400).json({ message: "Invalid pagination index." });
        return;
    }

    Res.json(DataManager.GetBannersSTMT.all(Env.GetVariable("PAGE_SIZE"), Page * Env.GetVariable<number>("PAGE_SIZE")));
});