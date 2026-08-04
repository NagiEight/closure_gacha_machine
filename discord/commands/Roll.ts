import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/Command.js";
import Database from "../singletons/Database.js";
import Roll from "../helpers/Roll.js";
import RollMulti from "../helpers/RollMulti.js";
import SendMessage from "../helpers/SendMessage.js";

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
    }
} satisfies Command;