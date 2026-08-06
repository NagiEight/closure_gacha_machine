import {
    ActionRowBuilder,
    AutocompleteInteraction,
    ButtonBuilder,
    ButtonInteraction,
    ChatInputCommandInteraction,
    EmbedBuilder,
    SlashCommandBuilder
} from "discord.js";
import type { Command } from "../types/Command.js";
import GachaResultLifetimeManager, { type GachaResult } from "../singletons/GachaResultLifetimeManager.js";
import Database from "../singletons/Database.js";
import Roll from "../helpers/Roll.js";
import RollMulti from "../helpers/RollMulti.js";
import SendMessage from "../helpers/SendMessage.js";
import GetMaxPage from "../helpers/GetMaxPage.js";
import Paginate from "../helpers/Paginate.js";
import BuildGachaEmbed from "../helpers/BuildGachaEmbed.js";

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
        if(!Database.Manager.GetToken(UserID)) 
            return await SendMessage(Interaction, "You don't have a gacha profile.");

        if(Count < 1) 
            return await SendMessage(Interaction, "Roll count has to be 1 or higher.");

        try {
            await Database.Manager.GetBannerInfo(Banner);
        }
        catch(Err) {
            if(Err instanceof Error && Err.name === "UnknownBannerError") 
                return await SendMessage(Interaction, Err.message);
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
        const [, ActionMeta, Owner] = Interaction.customId.split(":");

        if(Owner !== Interaction.user.id)
            return;
        
        const [ActionName, Page, PoolID] = ActionMeta.split("/");
        const GachaResult: GachaResult | undefined = GachaResultLifetimeManager.GetPool(Owner, PoolID);
        
        if(!GachaResult)
            return;
        
        const MaxPage: number = GetMaxPage(Object.keys(GachaResult), 20);
        let NextPageIndex: number;

        switch(ActionName) {
            case "0":
                if(Number(Page) === 1)
                    return;
                NextPageIndex = 1;
                break;
                
            case "1":
                if(Number(Page) === 1)
                    return;
                NextPageIndex = Number(Page) - 1;
                break;

            case "2":
                if(Number(Page) === MaxPage)
                    return;
                NextPageIndex = Number(Page) + 1;
                break;

            case "3":
                if(Number(Page) === MaxPage)
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
            PoolID
        );
    }
} satisfies Command;