import type { ChatInputCommandInteraction } from "discord.js";
import type { Operator, User } from "../singletons/Database.js";
import APIConnector from "../singletons/APIConnector.js";
import Database from "../singletons/Database.js";

export default async (Interaction: ChatInputCommandInteraction, BannerName: string, Count: number): Promise<void> => {
    const UserID: string = Interaction.user.id;

    const UserProfile: User = Database.Manager.Users.get(UserID)!;
    const Response: Response = await APIConnector.RollMulti(BannerName, Count, UserProfile.Token);
    if(!Response.ok) {
        await Database.Manager.SendMessage(Interaction, (await Response.json() as { message: string }).message);
        return;
    }

    const Result: Record<string, number> = await Response.json() as Record<string, number>;
    const Operators: [string, Operator][] = [];
    for(const ID of Object.keys(Result)) {
        Operators.push([ID, await Database.Manager.GetOperatorInfo(ID)]);
    }

    Interaction.reply({
        embeds: [Database.Manager.BuildGachaEmbed(Interaction, Object.fromEntries(
            Operators.map(Operator => [Operator[1].Name, Result[Operator[0]]])
        ), Math.max(...Operators.map(Operator => Operator[1].Rarity)) as 3 | 4 | 5 | 6)],
        allowedMentions: { repliedUser: false }
    });

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

    for(const Operator of Operators) {
        const OperatorID: string = Operator[0];
        let ToWrite: number;
        switch(Operator[1].Rarity) {
            case 3:
                Banner.Storage.ThreeStars[OperatorID] ??= 0;
                ToWrite = ++Banner.Storage.ThreeStars[OperatorID];
                break;
            case 4:
                Banner.Storage.FourStars[OperatorID] ??= 0;
                ToWrite = ++Banner.Storage.FourStars[OperatorID];
                break;
            case 5:
                Banner.Storage.FiveStars[OperatorID] ??= 0;
                ToWrite = ++Banner.Storage.FiveStars[OperatorID];
                break;
            case 6:
                Banner.Storage.SixStars[OperatorID] ??= 0;
                ToWrite = ++Banner.Storage.SixStars[OperatorID];
                break;
        }
        Database.Manager.RefreshStorageSTMT.run(UserID, BannerName, Operator[1].Rarity, OperatorID, ToWrite);
    }
    Database.Manager.RefreshDataSTMT.run(UserID, BannerName, Banner.Count += Count);
};