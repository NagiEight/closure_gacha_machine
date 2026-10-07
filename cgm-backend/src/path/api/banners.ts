import type { SearchQuery } from "#types/SearchQuery";
import DataManager from "#DataManager";
import type { SearchResult } from "#types/SearchResult";
import Server from "#Server";
import BannerTypes from "#types/BannerTypes";
import Env from "commaenv";
import z from "zod";

const SearchQuerySchema = z.object({
    NameQuery: z.string().transform(Name => Name.trim().toLowerCase()),
    BannerType: z.enum(BannerTypes),
    Includes: z.array(z.string()),
    From: z.int().positive(),
    To: z.int().positive()
}).partial()

Server.get("/api/banners/all", (_, Res) => Res.json(DataManager.BannerNameCache))
.get("/api/banners/search", (Req, Res) => {
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

    const Parsed = SearchQuerySchema.safeParse(Body);

    if(!Parsed.success) {
        Res.status(404).json({ message: Parsed.error.issues });
        return;
    }

    const Result: SearchResult[] = DataManager.SearchBannersSTMT(Page, Env.GetVariable("PAGE_SIZE"), Parsed.data);
    Res.json(Result);
})
.get("/api/banners/:Page", (Req, Res) => {
    const Page: number = Number(Req.params.Page) || -1;    
    if(Page < 1) {
        Res.status(400).json({ message: "Invalid pagination index." });
        return;
    }

    Res.json(DataManager.GetBannersSTMT.all(Env.GetVariable("PAGE_SIZE"), Page * Env.GetVariable<number>("PAGE_SIZE")));
});