import type { Selection } from "#types/BannerStrategy";
import type { GachaProfile } from "#types/GachaProfile";
import type { Banner } from "#types/Banner";
import Database from "#Database";
import GachaSystem from "#GachaSystem";
import Server from "#Server";
import BannerTypes from "#types/BannerTypes";

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
    const Banner: Banner | undefined = Database.Manager.Banners.get(BannerName);
    
    if(!Banner) {
        Res.status(404).json({ message: `Banner '${BannerName}' doesn't exist.` });
        return;
    }

    if(Banner.Type === BannerTypes.Orienteering) {
        const Body: Selection = Req.body ?? {};

        if(!Object.keys(Body).length) {
            Res.status(400).json({ message: `Banner type '${Banner.Type}' requires a request body.` });
            return;
        }

        if(!Body.SixStarsSelection || !Array.isArray(Body.SixStarsSelection)) {
            Res.status(400).json({ message: `Missing or invalid 6 stars selection.` });
            return;
        }

        if(!Body.FiveStarsSelection || !Array.isArray(Body.FiveStarsSelection)) {
            Res.status(400).json({ message: `Missing or invalid 5 stars selection.` });
            return;
        }
        
        Body.SixStarsSelection = [...new Set(Body.SixStarsSelection)];
        Body.FiveStarsSelection = [...new Set(Body.FiveStarsSelection)];

        const Checker = (Selection: string[], Pool: string[], Rarity: number): boolean => {
            const Excluded: string[] = [];
            const IsValid: boolean = Selection.length === 3 && Selection.every(OP => {
                const IsIncluded: boolean = Pool.includes(OP);
                if(!IsIncluded)
                    Excluded.push(OP);
                return IsIncluded;
            });

            if(!IsValid) {
                Res.status(400).json({ 
                    message: `Operator${Excluded.length > 1 ? "s" : ""} ${Excluded.join(", ")}` +
                        ` do${Excluded.length > 1 ? "" : "es"} not exist or not included in ${BannerName} ${Rarity} stars pool.`
                });
            }
            return IsValid;
        };

        if(!Checker(Body.SixStarsSelection, Banner.SixStarsPool.Primary, 6))
            return;

        if(!Checker(Body.FiveStarsSelection, Banner.FiveStarsPool.Primary, 5))
            return;

        Res.json({
            Result: GachaSystem.Roll(Token, BannerName, true, Body)
        });
        return;
    }

    const Result: string = (await GachaSystem.Roll(Token, BannerName))![0];
    Res.json({ Result });
});