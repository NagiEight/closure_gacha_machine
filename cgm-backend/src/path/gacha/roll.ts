import type { Selection } from "#types/BannerStrategy";
import type { GachaProfile } from "#types/GachaProfile";
import type { Banner } from "#types/Banner";
import DataManager from "#DataManager";
import GachaSystem from "#GachaSystem";
import Server from "#Server";
import BannerTypes from "#types/BannerTypes";
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

Server.post("/gacha/:BannerName/roll", async (Req, Res) => {
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

    if(Banner.Type === BannerTypes.Orienteering) {
        const Body: Selection = Req.body ?? {};
        const Parsed = OrienteeringSchema.safeParse(Body);
        
        if(!Parsed.success) {
            Res.status(404).json({ message: Parsed.error.issues });
            return;
        }

        Res.json({
            Result: (await GachaSystem.Roll(1, Token, BannerName, { Selection: Parsed.data }))![0][0]
        });
        return;
    }

    const Result: string = (await GachaSystem.Roll(1, Token, BannerName))![0][0];
    Res.json({ Result });
});