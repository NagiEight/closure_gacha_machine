import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    EmbedBuilder,
    SlashCommandBuilder
} from "discord.js";
import type { Command } from "../types/Command.js";
import Database from "../singletons/Database.js";
import SendMessage from "../helpers/SendMessage.js";
import APIConnector from "../singletons/APIConnector.js";
import LoadEnv from "../singletons/LoadEnv.js";
import ActionRowIDBuilder from "../helpers/ActionRowIDBuilder.js";

export default {
    Command: new SlashCommandBuilder()
        .setName("delete")
        .setDescription("Delete your gacha profile.")
    ,
    Action: async (Interaction: ChatInputCommandInteraction): Promise<void> => {
        const UserID: string = Interaction.user.id;
        if(!Database.Manager.Users.has(UserID)) 
            return await SendMessage(Interaction, "You don't have a profile to delete.");

        await Interaction.deferReply();

        const Embed: EmbedBuilder = new EmbedBuilder()
            .setTitle("Delete Profile")
            .setDescription(
                "Are you sure you want to delete your gacha profile?\n\n" +
                `This action cannot be undone and will place you in a ${LoadEnv.TIMEOUT_DURATION / 86400} days timeout.`
            )
            .setColor(0xff0000)
        ;

        const ConfirmButton: ButtonBuilder = new ButtonBuilder()
            .setCustomId(ActionRowIDBuilder("delete", ["Confirm"], Interaction.user.id))
            .setLabel("Delete Profile")
            .setStyle(ButtonStyle.Danger)
        ;
        const CancelButton: ButtonBuilder = new ButtonBuilder()
            .setCustomId(ActionRowIDBuilder("delete", ["Cancel"], Interaction.user.id))
            .setLabel("Cancel")
            .setStyle(ButtonStyle.Secondary)
        ;
        const ButtonRow: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(ConfirmButton, CancelButton)
        ;
        
        await SendMessage(Interaction, [Embed], [ButtonRow]);
    },
    Button: async (Interaction: ButtonInteraction): Promise<void> => {
        const [, ActionName, Owner] = Interaction.customId.split(":");

        if(Interaction.user.id !== Owner)
            return;

        switch(ActionName) {
            case "Confirm":
                const Token: string = Database.Manager.Users.get(Owner)!.Token;
                await APIConnector.DeleteToken(Token);
            
                Database.Manager.Users.delete(Owner);
                Database.Manager.RemoveTokenSTMT(Owner);
                Database.Manager.TimeoutSTMT.run(Owner, Date.now() + LoadEnv.TIMEOUT_DURATION * 1000);

                return await SendMessage(Interaction, "Profile deleted successfully.");

            case "Cancel":
                return await SendMessage(Interaction, "Profile deletion cancelled.");
        }
    }
} satisfies Command;