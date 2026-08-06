import type { ChatInputCommandInteraction } from "discord.js";
import type { Operator, User } from "../singletons/Database.js";
import APIConnector from "../singletons/APIConnector.js";
import Database from "../singletons/Database.js";
import SendMessage from "./SendMessage.js";
import BuildGachaEmbed from "./BuildGachaEmbed.js";
import AsyncMap from "./AsyncMap.js";

export default async (Interaction: ChatInputCommandInteraction, BannerName: string, Count: number): Promise<void> => {
    const UserID: string = Interaction.user.id;

    const UserProfile: User = Database.Manager.Users.get(UserID)!;
    const Response: Response = await APIConnector.RollMulti(BannerName, Count, UserProfile.Token);
    if(!Response.ok) 
        return await SendMessage(Interaction, (await Response.json() as { message: string }).message);

    const Result: { Result: Record<string, number> } = await Response.json() as { Result: Record<string, number> };
    const Operators: Record<string, { Count: number; Rarity: 3 | 4 | 5 | 6; ID: string; }> = Object.fromEntries(
        (await AsyncMap(
            Object.keys(Result.Result),
            async (ID): Promise<[string, Operator]> => [ID, await Database.Manager.GetOperatorInfo(ID)]
        )).map(([ID, Operator]) => [Operator.Name, { Count: Result.Result[ID], Rarity: Operator.Rarity, ID }])
    );

    UserProfile.Profile[BannerName] ??= {
        Count: 0,
        Storage: {
            SixStars: {},
            FiveStars: {},
            FourStars: {},
            ThreeStars: {}
        }
    };
    const Banner = UserProfile.Profile[BannerName];

    for(const [, Data] of Object.entries(Operators)) {
        let ToWrite: number;
        switch(Data.Rarity) {
            case 3:
                Banner.Storage.ThreeStars[Data.ID] ??= 0;
                ToWrite = ++Banner.Storage.ThreeStars[Data.ID];
                break;
            case 4:
                Banner.Storage.FourStars[Data.ID] ??= 0;
                ToWrite = ++Banner.Storage.FourStars[Data.ID];
                break;
            case 5:
                Banner.Storage.FiveStars[Data.ID] ??= 0;
                ToWrite = ++Banner.Storage.FiveStars[Data.ID];
                break;
            case 6:
                Banner.Storage.SixStars[Data.ID] ??= 0;
                ToWrite = ++Banner.Storage.SixStars[Data.ID];
                break;
        }
        Database.Manager.RefreshStorageSTMT.run(UserID, BannerName, Data.Rarity, Data.ID, ToWrite);
    }
    Database.Manager.RefreshDataSTMT.run(UserID, BannerName, Banner.Count += Count);
    
    await SendMessage(
        Interaction,
        [BuildGachaEmbed(
            Interaction, 
            Object.fromEntries(
                Object.entries(Operators).map(([Operator, Data]) => [Operator, { Count: Data.Count, Rarity: Data.Rarity }])
            )
        )],
        []
    );
};