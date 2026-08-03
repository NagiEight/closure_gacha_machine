import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/Command.js";
import Database from "../singletons/Database.js";

export default {
    Command: new SlashCommandBuilder()
        .setName("create")
        .setDescription("Create a new gacha profile.")
    ,
    Action: async (Interaction: ChatInputCommandInteraction): Promise<void> => await Database.Manager.CreateToken(Interaction)
} satisfies Command;