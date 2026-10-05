import type { GachaProfile } from "#types/GachaProfile";
import type { Banner } from "#types/Banner";
import type { Selection } from "#types/BannerStrategy";
import GachaSystem from "#GachaSystem";
import Server from "#Server";
import BannerTypes from "#types/BannerTypes";
import DataManager from "#DataManager";
import z from "zod";

const OrienteeringSchema = z.object({
    SixStarsSelection: z.tuple([
        z.string(),
        z.string(),
        z.string()
    ]),
    FiveStarsSelection: z.tuple([
        z.string(),
        z.string(),
        z.string()
    ])
});

Server.post("/gacha/:BannerName/roll/:Count", async (Req, Res) => {
    const Count: number = Number(Req.params.Count) || -1;
    
    if(Count < 1) {
        Res.status(400).json({ message: "Roll count must be a number greater than 0." });
        return;
    }

    const Token: string | undefined = Req.get("Session-Token");
    
    if(!Token) {
        Res.status(404).json({ message: "Missing session token." });
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

    if(Banner.Type === BannerTypes.Orienteering) {
        const Body: Selection = Req.body ?? {};
        const Parsed = OrienteeringSchema.safeParse(Body);
        
        if(!Parsed.success) {
            Res.status(404).json({ message: Parsed.error.issues });
            return;
        }

        const Reduced: string | undefined = Req.query.reduced?.toString().trim().toLowerCase();
        Res.json({
            Result: Reduced === "true" || Reduced === "1"
                ? await GachaSystem.Roll(Count, Token, BannerName, { Selection: Parsed.data, Reduced: true })
                : (await GachaSystem.Roll(Count, Token, BannerName, { Selection: Parsed.data }))?.map(T => T[0])
        });
        return;
    }

    const Reduced: string | undefined = Req.query.reduced?.toString().trim().toLowerCase();
    Res.json({
        Result: Reduced === "true" || Reduced === "1"
            ? await GachaSystem.Roll(Count, Token, BannerName, { Reduced: true })
            : (await GachaSystem.Roll(Count, Token, BannerName))?.map(T => T[0])
    });
});