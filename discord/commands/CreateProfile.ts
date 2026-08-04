import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/Command.js";
import Database from "../singletons/Database.js";
import SendMessage from "../helpers/SendMessage.js";
import APIConnector from "../singletons/APIConnector.js";

export default {
    Command: new SlashCommandBuilder()
        .setName("create")
        .setDescription("Create a new gacha profile.")
    ,
    Action: async (Interaction: ChatInputCommandInteraction): Promise<void> => {
        const UserID: string = Interaction.user.id;
        if(Database.Manager.Users.has(UserID)) 
            return await SendMessage(Interaction, "You already have a profile.");

        const Timeout: number | undefined = Database.Manager.TimeoutZone.get(UserID);
        if(Timeout) {
            if(Timeout > Date.now()) 
                return await SendMessage(Interaction, `You are still in timeout, timeout will expire <t:${Math.ceil((Timeout - Date.now()) / 1000)}:R>.`);
            else {
                Database.Manager.RemoveTimeoutSTMT.run(UserID);
                Database.Manager.TimeoutZone.delete(UserID);
            }
        }

        const Response: Response = await APIConnector.CreateToken();
        const Token: string = Response.headers.get("Seession-Token")!;

        Database.Manager.AddTokenSTMT.run(UserID, Token);
        Database.Manager.Users.set(UserID, {
            Token,
            Profile: {}
        });

        await SendMessage(Interaction, "Profile created successfully.");
    }
} satisfies Command;