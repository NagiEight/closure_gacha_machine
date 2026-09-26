import type { Operator } from "@Operator";
import Database from "@Database";
import Server from "@Server";

Server.get("/api/operator/:OperatorID", (Req, Res) => {
    const OperatorID: string = Req.params.OperatorID;
    const Operator: Operator | undefined = Database.Manager.Operators.get(OperatorID);

    if(!Operator) {
        Res.status(404).json({ message: `Operator '${OperatorID}' doesn't exist.` });
        return;
    }

    Res.json({ 
        ID: OperatorID,
        ...Operator
    });
});