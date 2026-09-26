import type { Banner } from "#types/Banner";
import Database from "#Database";
import Server from "#Server";

Server.get("/api/banner/:Name", (Req, Res) => {
    const Name: string = Req.params.Name;
    const Banner: Banner | undefined = Database.Manager.Banners.get(Name);

    if(!Banner) {
        Res.status(404).json({ message: `Banner '${Name}' doesn't exist.` });
        return;
    }

    Res.json({
        Name,
        OperatorPool: Banner
    });
});