import {
    ActionRowBuilder,
    AutocompleteInteraction,
    ButtonBuilder,
    ButtonInteraction,
    ChatInputCommandInteraction,
    EmbedBuilder,
    MessageFlags,
    SlashCommandBuilder
} from "discord.js";
import type { Command } from "../types/Command.js";
import { ButtonType } from "../helpers/ConstructNavigationButtonRow.js";
import Database from "../singletons/Database.js";
import Roll from "../helpers/Roll.js";
import RollMulti from "../helpers/RollMulti.js";
import BuildGachaEmbed from "../helpers/BuildGachaEmbed.js";
import GetMaxPage from "../helpers/GetMaxPage.js";
import EmbedActionInteractionManager from "../singletons/EmbedActionInteractionManager.js";

const NavigationButtonHandler = async (Interaction: ButtonInteraction, Type: ButtonType): Promise<void> => {
    interface InteractionMeta {
        CurrentPage: number;
        GachaResult: Record<string, { Count: number; Rarity: 3 | 4 | 5 | 6; ID: string; }>;
        InteractionIDs: Record<ButtonType, string>;
    }

    const InteractionMeta: InteractionMeta | undefined = EmbedActionInteractionManager.GetInteraction<InteractionMeta>(
        Interaction.user.id, 
        Interaction.customId
    );
    
    if(!InteractionMeta)
        return;
    
    await Interaction.deferUpdate();
    
    const MaxPage: number = GetMaxPage(Object.keys(InteractionMeta.GachaResult), 20);

    InteractionMeta.CurrentPage = {
        [ButtonType.BackwardToStart]: 1,
        [ButtonType.Backward]: InteractionMeta.CurrentPage - 1,
        [ButtonType.Forward]: InteractionMeta.CurrentPage + 1,
        [ButtonType.ForwardToEnd]: MaxPage
    }[Type];

    const Embed: {
        Embed: EmbedBuilder;
        ButtonRow: ActionRowBuilder<ButtonBuilder>;
    } = BuildGachaEmbed(
        Interaction,
        InteractionMeta.GachaResult,
        InteractionMeta.CurrentPage,
        InteractionMeta.InteractionIDs
    );

    await Interaction.update({
        embeds: [Embed.Embed],
        components: [Embed.ButtonRow],
        allowedMentions: { repliedUser: false }
    });
};

export default {
    Command: new SlashCommandBuilder()
        .setName("roll")
        .setDescription("Perform Gacha rolls on a specific banner.")
        .addStringOption(Option => 
            Option
                .setName("banner")
                .setDescription("Banner to roll on.")
                .setAutocomplete(true)
                .setRequired(true)
        )
        .addIntegerOption(Option =>
            Option
                .setName("count")
                .setDescription("Amount of times to roll.")
                .setRequired(false)
        )
    ,
    Action: async (Interaction: ChatInputCommandInteraction): Promise<void> => {
        const UserID: string = Interaction.user.id;
        const Count: number = Interaction.options.getInteger("count", false) ?? 1;
        const Banner: string = Interaction.options.getString("banner", true);
        
        if(!Database.Manager.GetToken(UserID)) {
            await Interaction.reply({
                content: "You don't have a gacha profile.",
                allowedMentions: { repliedUser: false },
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        if(Count < 1) {
            await Interaction.reply({
                content: "Roll count has to be 1 or higher.",
                allowedMentions: { repliedUser: false },
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        try {
            await Database.Manager.GetBannerInfo(Banner);
        }
        catch(Err) {
            if(Err instanceof Error && Err.name === "UnknownBannerError") {
                await Interaction.reply({
                    content: Err.message,
                    allowedMentions: { repliedUser: false },
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
            throw Err;
        }

        await Interaction.deferReply();

        if(Count === 1) 
            return await Roll(Interaction, Banner);
        return await RollMulti(Interaction, Banner, Count);
    },
    Autocomplete: {
        banner: async (Interaction: AutocompleteInteraction): Promise<void> => {
            await Interaction.respond((await Database.Manager.GetAllBanners())
                .filter(Banner => Banner.toLowerCase().includes(Interaction.options.getFocused().toLowerCase()))
                .slice(0, 25)
                .map(Banner => ({
                    name: Banner,
                    value: Banner
                }))
            );
        }
    },  
    Button: {
        [ButtonType.BackwardToStart]: async (Interaction: ButtonInteraction): Promise<void> =>
            await NavigationButtonHandler(Interaction, ButtonType.BackwardToStart)
        ,
        [ButtonType.Backward]: async (Interaction: ButtonInteraction): Promise<void> =>
            await NavigationButtonHandler(Interaction, ButtonType.Backward)
        ,
        [ButtonType.Forward]: async (Interaction: ButtonInteraction): Promise<void> =>
            await NavigationButtonHandler(Interaction, ButtonType.Forward)
        ,
        [ButtonType.ForwardToEnd]: async (Interaction: ButtonInteraction): Promise<void> =>
            await NavigationButtonHandler(Interaction, ButtonType.ForwardToEnd)
    }
} as const satisfies Command;