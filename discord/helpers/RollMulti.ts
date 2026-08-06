import { 
    ActionRowBuilder,
    ButtonBuilder,
    EmbedBuilder,
    ChatInputCommandInteraction,
    MessageFlags
} from "discord.js";
import type { Operator, User } from "../singletons/Database.js";
import APIConnector from "../singletons/APIConnector.js";
import Database from "../singletons/Database.js";
import BuildGachaEmbed from "./BuildGachaEmbed.js";
import AsyncMap from "./AsyncMap.js";
import GachaResultLifetimeManager from "../singletons/GachaResultLifetimeManager.js";
import GetMaxPage from "./GetMaxPage.js";
import Paginate from "./Paginate.js";

export default async (Interaction: ChatInputCommandInteraction, BannerName: string, Count: number): Promise<void> => {
    const UserID: string = Interaction.user.id;

    const UserProfile: User = Database.Manager.Users.get(UserID)!;
    const Response: Response = await APIConnector.RollMulti(BannerName, Count, UserProfile.Token);
    if(!Response.ok) {
        await Interaction.reply({
            content: (await Response.json() as { message: string }).message,
            allowedMentions: { repliedUser: false },
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    Interaction.deferReply();

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

    const MaxPage: number = GetMaxPage(Object.keys(Operators), 20);
    
    if(MaxPage > 1) {
        const PoolID: string = GachaResultLifetimeManager.AddPool(UserID, Operators);
        const Page: Record<string, { Count: number; Rarity: 3 | 4 | 5 | 6; ID: string; }> = Object.fromEntries(
            Paginate(Object.entries(Operators), 1, 20)
        );
        const Embed: {
            Embed: EmbedBuilder;
            ButtonRow: ActionRowBuilder<ButtonBuilder>;
        } = BuildGachaEmbed(
            Interaction,
            Page,
            Interaction.commandName,
            1,
            MaxPage,
            PoolID
        );

        await Interaction.editReply({
            embeds: [Embed.Embed],
            components: [Embed.ButtonRow],
            allowedMentions: { repliedUser: false }
        });
        return;
    }

    await Interaction.editReply({
        embeds: [BuildGachaEmbed(Interaction, Operators)],
        allowedMentions: { repliedUser: false }
    });
};