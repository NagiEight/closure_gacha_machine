import DataManager from "#DataManager";
import Server from "#Server";

Server.get("/assets/e2operator/:OperatorID", (Req, Res) => {
    const OperatorID: string = Req.params.OperatorID;
    const OperatorArt: string | undefined = DataManager.GetOperatorE2Art(OperatorID)?.toString();

    if(!OperatorArt) {
        Res.status(404).json({ message: `Operator '${OperatorID}' doesn't exist.` });
        return;
    }
    
    Res.set("Content-Type", "text/plain");
    Res.send(OperatorArt);
});