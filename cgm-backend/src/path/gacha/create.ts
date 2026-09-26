import GachaSystem from "#GachaSystem";
import Server from "#Server";

Server.post("/gacha/create", async (_, Res) => {
    const Token: string = await GachaSystem.CreateProfile();
    Res.set("Session-Token", Token);
    Res.send("Create profile successfully.");
});