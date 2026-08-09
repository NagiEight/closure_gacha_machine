import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    EmbedBuilder,
    MessageFlags,
    SlashCommandBuilder,
    type SlashCommandOptionsOnlyBuilder
} from "discord.js";
import Database from "../singletons/Database.js";
import APIConnector from "../singletons/APIConnector.js";
import LoadEnv from "../singletons/LoadEnv.js";
import EmbedActionInteractionManager from "../singletons/EmbedActionInteractionManager.js";
import Command, { InteractionTypes } from "../types/Command.js";

const C: SlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
    .setName("delete")
    .setDescription("Delete your gacha profile.")
;

export default Command.New(C)
(async (Interaction: ChatInputCommandInteraction): Promise<void> => {
    const UserID: string = Interaction.user.id;
    if(!Database.Manager.Users.has(UserID)) {
        await Interaction.reply({
            content: "You don't have a profile to delete.",
            allowedMentions: { repliedUser: false },
            flags: MessageFlags.Ephemeral
        });
        return;
    }

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
        .setCustomId(EmbedActionInteractionManager.AddInteraction(
            UserID, "delete", "Confirm", undefined
        ))
        .setLabel("Delete Profile")
        .setStyle(ButtonStyle.Danger)
    ;
    const CancelButton: ButtonBuilder = new ButtonBuilder()
        .setCustomId(EmbedActionInteractionManager.AddInteraction(
            UserID, "delete", "Cancel", undefined
        ))
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Secondary)
    ;
    const ButtonRow: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(ConfirmButton, CancelButton)
    ;

    await Interaction.editReply({
        embeds: [Embed],
        components: [ButtonRow],
        allowedMentions: { repliedUser: false }
    });
})
.AddSingleInteractionHandler(InteractionTypes.Button, "Confirm")
(async (Interaction: ButtonInteraction): Promise<void> => {
    const Owner: string = Interaction.user.id;
    const Token: string = Database.Manager.Users.get(Owner)!.Token;
    await APIConnector.DeleteToken(Token);

    Database.Manager.Users.delete(Owner);
    Database.Manager.RemoveTokenSTMT(Owner);
    Database.Manager.TimeoutSTMT.run(Owner, Date.now() + LoadEnv.TIMEOUT_DURATION * 1000);
    EmbedActionInteractionManager.RemoveInteraction(Owner, Interaction.customId);
})
.AddSingleInteractionHandler(InteractionTypes.Button, "Cancel")
(async (Interaction: ButtonInteraction): Promise<void> => {
    await Interaction.update({
        content: "Profile deletion cancelled.",
        embeds: [],
        components: [],
        allowedMentions: { repliedUser: false }
    });
    EmbedActionInteractionManager.RemoveInteraction(Interaction.user.id, Interaction.customId);
});