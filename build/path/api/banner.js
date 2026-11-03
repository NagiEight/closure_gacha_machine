import DataManager from "#DataManager";
import Server from "#Server";
Server.get("/api/banner/:Name", (Req, Res) => {
    const Name = Req.params.Name;
    const Banner = DataManager.Banners.get(Name);
    if (!Banner) {
        Res.status(404).json({ message: `Banner '${Name}' doesn't exist.` });
        return;
    }
    Res.json({
        Name,
        OperatorPool: Banner
    });
});
