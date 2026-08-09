import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder, User, type SlashCommandOptionsOnlyBuilder } from "discord.js";
import Database from "../singletons/Database.js";
import Command from "../types/Command.js";

const C: SlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
    .setName("removetimeout")
    .setDescription("Remove someone's profile creation timeout.")
    .addUserOption(Option => 
        Option  
            .setName("user")
            .setDescription("User to remove timeout of.")
            .setRequired(true)
    )
;

export default Command.New(C, { Administrator: true })
(async (Interaction: ChatInputCommandInteraction): Promise<void> => {
    const User: User = Interaction.options.getUser("user", true);
    if(!Database.Manager.TimeoutZone.has(User.id)) {
        await Interaction.reply({
            content: "User isn't timed out.",
            allowedMentions: { repliedUser: false },
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    Database.Manager.RemoveTimeoutSTMT.run(User.id);
    Database.Manager.TimeoutZone.delete(User.id);
    await Interaction.reply({
        content: `Removed timeout for ${User.username} successfully.`,
        allowedMentions: { repliedUser: false },
        flags: MessageFlags.Ephemeral
    });
});