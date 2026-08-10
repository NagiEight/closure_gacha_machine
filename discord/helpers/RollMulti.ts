import { 
    ActionRowBuilder,
    ButtonBuilder,
    EmbedBuilder,
    ChatInputCommandInteraction,
} from "discord.js";
import type { Operator, User } from "../singletons/Database.js";
import { ButtonType } from "./ConstructNavigationButtonRow.js";
import APIConnector from "../singletons/APIConnector.js";
import Database from "../singletons/Database.js";
import BuildGachaEmbed from "./BuildGachaEmbed.js";
import AsyncMap from "./AsyncMap.js";
import GetMaxPage from "./GetMaxPage.js";
import EmbedActionInteractionManager from "../singletons/EmbedActionInteractionManager.js";

export default async (Interaction: ChatInputCommandInteraction, BannerName: string, Count: number): Promise<void> => {
    const UserID: string = Interaction.user.id;

    const UserProfile: User = Database.Manager.Users.get(UserID)!;
    const Response: Response = await APIConnector.RollMulti(BannerName, Count, UserProfile.Token);
    if(!Response.ok) {
        await Interaction.editReply({
            content: (await Response.json() as { message: string }).message,
            allowedMentions: { repliedUser: false }
        });
        return;
    }

    const Result: { Result: Record<string, number> } = await Response.json() as { Result: Record<string, number> };
    const Operators: Record<string, { Count: number; Rarity: 3 | 4 | 5 | 6; ID: string; }> = Object.fromEntries(
        (await AsyncMap(
            Object.keys(Result.Result),
            async (ID): Promise<[string, Operator]> => [ID, await Database.Manager.GetOperatorInfo(ID)]
        ))
        .map(([ID, Operator]): [string, { Count: number; Rarity: 3 | 4 | 5 | 6; ID: string; }] => 
            [Operator.Name, { Count: Result.Result[ID], Rarity: Operator.Rarity, ID }]
        )
        .sort((A, B) => B[1].Rarity - A[1].Rarity)
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
        const CommandName: string = Interaction.commandName;
        const InteractionMeta: {
            CurrentPage: number;
            GachaResult: Record<string, { Count: number; Rarity: 3 | 4 | 5 | 6; ID: string; }>;
            InteractionIDs: Record<ButtonType, string>;
        } = { 
            CurrentPage: 1,
            GachaResult: Operators,
            InteractionIDs: {
                [ButtonType.BackwardToStart]: "",
                [ButtonType.Backward]: "",
                [ButtonType.Forward]: "",
                [ButtonType.ForwardToEnd]: ""
            }
        };
        const BackwardToStartID: [string, string] = EmbedActionInteractionManager.AddInteraction(
            UserID,
            CommandName,
            ButtonType.BackwardToStart,
            InteractionMeta
        );
        const InteractionIDs: Record<ButtonType, string> = {
            [ButtonType.BackwardToStart]: BackwardToStartID[0],
            [ButtonType.Backward]: EmbedActionInteractionManager.AddInteraction(
                UserID,
                CommandName,
                ButtonType.Backward,
                BackwardToStartID[1]
            ),
            [ButtonType.Forward]: EmbedActionInteractionManager.AddInteraction(
                UserID,
                CommandName,
                ButtonType.Forward,
                BackwardToStartID[1]
            ),
            [ButtonType.ForwardToEnd]: EmbedActionInteractionManager.AddInteraction(
                UserID,
                CommandName,
                ButtonType.ForwardToEnd,
                BackwardToStartID[1]
            )
        };

        InteractionMeta.InteractionIDs = InteractionIDs;

        const Embed: {
            Embed: EmbedBuilder;
            ButtonRow: ActionRowBuilder<ButtonBuilder>;
        } = BuildGachaEmbed(
            Interaction,
            Operators,
            1,
            InteractionIDs
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