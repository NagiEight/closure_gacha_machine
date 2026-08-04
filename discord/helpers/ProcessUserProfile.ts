import Database, { type User } from "../singletons/Database.js";
import AsyncMap from "./AsyncMap.js";

export default async (User: string | User, BannerName: string): Promise<{ Name: string; Rarity: 3 | 4 | 5 | 6; Count: number; }[]> => 
    (await AsyncMap(
        Object.values(
            (typeof User === "string" ? Database.Manager.Users.get(User)! : User).Profile[BannerName].Storage
        ), 
        async Storage => (await AsyncMap(
            Object.entries(Storage),
            async ([OperatorID, Count]) => ({
                ...await Database.Manager.GetOperatorInfo(OperatorID),
                Count
            })
        )).map(Operator => ({
            Name: Operator.Name,
            Rarity: Operator.Rarity,
            Count: Operator.Count
        }))
    )).flat()
;