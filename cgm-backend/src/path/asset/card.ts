import Database from "#Database";
import Server from "#Server";

Server.get("/assets/card/:OperatorID", (Req, Res) => {
    const OperatorID: string = Req.params.OperatorID;
    const OperatorArt: string | undefined = Database.Manager.GetOperatorCard(OperatorID)?.toString();

    if(!OperatorArt) {
        Res.status(404).json({ message: `Operator '${OperatorID}' doesn't exist.` });
        return;
    }
    
    Res.set("Content-Type", "text/plain");
    Res.send(OperatorArt);
});