import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/Command.js";

export default {
    Command: new SlashCommandBuilder()
        .setName("source")
        .setDescription("Prints the link to the GitHub repository of this bot.")
    ,
    Action: async (Interaction: ChatInputCommandInteraction): Promise<void> => {
        await Interaction.reply({
            content: "https://github.com/NagiEight/closure_gacha_machine",
            allowedMentions: { repliedUser: false },
            flags: MessageFlags.Ephemeral
        });
    }
} as const satisfies Command;