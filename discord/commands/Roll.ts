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
import GachaResultLifetimeManager, { type GachaResult } from "../singletons/GachaResultLifetimeManager.js";
import Database from "../singletons/Database.js";
import Roll from "../helpers/Roll.js";
import RollMulti from "../helpers/RollMulti.js";
import GetMaxPage from "../helpers/GetMaxPage.js";
import Paginate from "../helpers/Paginate.js";
import BuildGachaEmbed from "../helpers/BuildGachaEmbed.js";
import ActionCustomIDParser from "../helpers/ActionCustomIDParser.js";

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

        if(Count === 1) 
            return await Roll(Interaction, Banner);
        return await RollMulti(Interaction, Banner, Count);
    },
    Autocomplete: async (Interaction: AutocompleteInteraction): Promise<void> => {
        await Interaction.respond((await Database.Manager.GetAllBanners())
            .filter(Banner => Banner.toLowerCase().includes(Interaction.options.getFocused().toLowerCase()))
            .slice(0, 25)
            .map(Banner => ({
                name: Banner,
                value: Banner
            }))
        );
    },
    Button: async (Interaction: ButtonInteraction): Promise<void> => {
        const CustomID = ActionCustomIDParser(
            Interaction.customId,
            {
                ActionName: "",
                Page: "",
                PoolID: ""
            }
        );

        if(CustomID.Owner !== Interaction.user.id)
            return;
        
        const GachaResult: GachaResult | undefined = GachaResultLifetimeManager.GetPool(CustomID.Owner, CustomID.Meta.PoolID);
        
        if(!GachaResult)
            return;
        
        const MaxPage: number = GetMaxPage(Object.keys(GachaResult), 20);
        let NextPageIndex: number;

        switch(CustomID.Meta.ActionName) {
            case "0":
                if(Number(CustomID.Meta.Page) === 1)
                    return;
                NextPageIndex = 1;
                break;
                
            case "1":
                if(Number(CustomID.Meta.Page) === 1)
                    return;
                NextPageIndex = Number(CustomID.Meta.Page) - 1;
                break;

            case "2":
                if(Number(CustomID.Meta.Page) === MaxPage)
                    return;
                NextPageIndex = Number(CustomID.Meta.Page) + 1;
                break;

            case "3":
                if(Number(CustomID.Meta.Page) === MaxPage)
                    return;
                NextPageIndex = MaxPage;
                break;

            default: return;
        }

        const NextPage: Record<string, { Count: number; Rarity: 3 | 4 | 5 | 6; }> = Object.fromEntries(
            Paginate(Object.entries(GachaResult), NextPageIndex, 20)
        );
        const Embed: {
            Embed: EmbedBuilder;
            ButtonRow: ActionRowBuilder<ButtonBuilder>;
        } = BuildGachaEmbed(
            Interaction,
            NextPage,
            "roll",
            NextPageIndex,
            MaxPage,
            CustomID.Meta.PoolID
        );
        
        await Interaction.update({
            embeds: [Embed.Embed],
            components: [Embed.ButtonRow],
            allowedMentions: { repliedUser: false }
        });
    }
} as const satisfies Command;