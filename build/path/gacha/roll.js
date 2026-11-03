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
    if (Banner.Type === BannerTypes.Orienteering) {
        const Body = Req.body ?? {};
        const Parsed = OrienteeringSchema.safeParse(Body);
        if (!Parsed.success) {
            Res.status(404).json({ message: Parsed.error.issues });
            return;
        }
        Res.json({
            Result: (await GachaSystem.Roll(1, Token, BannerName, { Selection: Parsed.data }))[0][0]
        });
        return;
    }
    const Result = (await GachaSystem.Roll(1, Token, BannerName))[0][0];
    Res.json({ Result });
});
