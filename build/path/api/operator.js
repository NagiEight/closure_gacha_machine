import DataManager from "#DataManager";
import Server from "#Server";
Server.get("/api/operator/:OperatorID", (Req, Res) => {
    const OperatorID = Req.params.OperatorID;
    const Operator = DataManager.Operators.get(OperatorID);
    if (!Operator) {
        Res.status(404).json({ message: `Operator '${OperatorID}' doesn't exist.` });
        return;
    }
    Res.json({
        ID: OperatorID,
        ...Operator
    });
});
