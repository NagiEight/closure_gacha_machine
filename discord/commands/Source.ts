import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/Command.js";
import SendMessage from "../helpers/SendMessage.js";

export default {
    Command: new SlashCommandBuilder()
        .setName("source")
        .setDescription("Prints the link to the GitHub repository of this bot.")
    ,
    Action: async (Interaction: ChatInputCommandInteraction): Promise<void> => 
        await SendMessage(Interaction, "https://github.com/NagiEight/closure_gacha_machine")
} satisfies Command;