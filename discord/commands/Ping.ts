import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/Command.js";
import SendMessage from "../helpers/SendMessage.js";

export default {
    Command: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Check if the bot is alive or not.")
    ,
    Action: async (Interaction: ChatInputCommandInteraction): Promise<void> => await SendMessage(Interaction, "It is alive!")
} satisfies Command;