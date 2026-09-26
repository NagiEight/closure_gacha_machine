import type { SearchQuery } from "#types/SearchQuery";
import type { SearchResult } from "#types/SearchResult";
import LoadEnv from "#LoadEnv";
import Server from "#Server";
import DataManager from "#DataManager";
import BannerTypes from "#types/BannerTypes";

Server.get("/api/banners/search", (Req, Res) => {
    const Body: SearchQuery = Req.body ?? {};
    const Page: number = Number(Req.query.page?.toString()) || -1;

    if(Page < 1) {
        Res.status(400).json({ message: "Invalid pagination index." });
        return;
    }

    if(!Object.keys(Body).length) {
        Res.status(400).json({ message: "Missing request body." });
        return;
    }

    if(Body.BannerType && !Object.values(BannerTypes).includes(Body.BannerType)) {
        Res.status(404).json({ message: `Unknown banner type '${Body.BannerType}'.` });
        return;
    }

    if(Body.NameQuery && typeof Body.NameQuery !== "string") {
        Res.status(404).json({ message: "Incorrect data type for option 'NameQuery'." });
        return;
    }

    if(Body.From && typeof Body.From !== "number") {
        Res.status(404).json({ message: "Incorrect data type for option 'From'." });
        return;
    }

    if(Body.To && typeof Body.To !== "number") {
        Res.status(404).json({ message: "Incorrect data type for option 'To'." });
        return;
    }

    if(Body.Includes && !Array.isArray(Body.Includes)) {
        Res.status(404).json({ message: "Incorrect data type for option 'Includes'." });
        return;
    }

    const Result: SearchResult[] = DataManager.SearchBannersSTMT(Page, LoadEnv.PAGE_SIZE, Body);
    Res.json(Result);
});