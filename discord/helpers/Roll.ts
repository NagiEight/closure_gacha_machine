import { MessageFlags, type ChatInputCommandInteraction, type EmbedBuilder } from "discord.js";
import Database, { type User, type Operator } from "../singletons/Database.js";
import APIConnector from "../singletons/APIConnector.js";
import BuildGachaEmbed from "./BuildGachaEmbed.js";

export default async (Interaction: ChatInputCommandInteraction, BannerName: string): Promise<void> => {
    const UserID: string = Interaction.user.id;
    const UserProfile: User = Database.Manager.Users.get(UserID)!;
    const Response: Response = await APIConnector.Roll(BannerName, UserProfile.Token);
    if(!Response.ok) {
        await Interaction.reply({
            content: (await Response.json() as { message: string }).message,
            allowedMentions: { repliedUser: false },
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    await Interaction.deferReply();
    
    const Result: { Result: string; } = await Response.json() as { Result: string; };
    const Operator: Operator = await Database.Manager.GetOperatorInfo(Result.Result);

    Database.Manager.Users.get(UserID)!.Profile[BannerName] ??= {
        Count: 0,
        Storage: {
            SixStars: {},
            FiveStars: {},
            FourStars: {},
            ThreeStars: {}
        }
    };
    
    const Banner = Database.Manager.Users.get(UserID)!.Profile[BannerName];
    const OperatorID: string = Result.Result;
    let ToWrite: number;
    switch(Operator.Rarity) {
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
    Database.Manager.RefreshStorageSTMT.run(UserID, BannerName, Operator.Rarity, OperatorID, ToWrite);
    Database.Manager.RefreshDataSTMT.run(UserID, BannerName, ++Banner.Count);

    const Embed: EmbedBuilder = BuildGachaEmbed(
        Interaction, 
        { [Operator.Name]: { Count: 1, Rarity: Operator.Rarity } }
    );
    
    await Interaction.editReply({
        embeds: [Embed],
        allowedMentions: { repliedUser: false }
    });
};