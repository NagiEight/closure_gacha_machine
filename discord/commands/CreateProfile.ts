import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/Command.js";
import Database from "../singletons/Database.js";
import APIConnector from "../singletons/APIConnector.js";

export default {
    Command: new SlashCommandBuilder()
        .setName("create")
        .setDescription("Create a new gacha profile.")
    ,
    Action: async (Interaction: ChatInputCommandInteraction): Promise<void> => {
        const UserID: string = Interaction.user.id;
        if(Database.Manager.Users.has(UserID)) {
            await Interaction.reply({
                content: "You already have a profile.",
                allowedMentions: { repliedUser: false },
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const Timeout: number | undefined = Database.Manager.TimeoutZone.get(UserID);
        if(Timeout) {
            if(Timeout > Date.now()) {
                await Interaction.reply({
                    content: `You are still in timeout, timeout will expire <t:${Math.ceil((Timeout - Date.now()) / 1000)}:R>.`,
                    allowedMentions: { repliedUser: false },
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
            else {
                Database.Manager.RemoveTimeoutSTMT.run(UserID);
                Database.Manager.TimeoutZone.delete(UserID);
            }
        }

        const Response: Response = await APIConnector.CreateToken();
        const Token: string = Response.headers.get("Session-Token")!;

        Database.Manager.AddTokenSTMT.run(UserID, Token);
        Database.Manager.Users.set(UserID, {
            Token,
            Profile: {}
        });

        await Interaction.reply({
            content: "Profile created successfully.",
            allowedMentions: { repliedUser: false },
            flags: MessageFlags.Ephemeral
        });
    }
} satisfies Command;