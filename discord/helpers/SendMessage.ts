import { ChatInputCommandInteraction, MessageFlags } from "discord.js";

export default async (Interaction: ChatInputCommandInteraction, Message: string): Promise<void> => {
    await Interaction.reply({
        content: Message,
        allowedMentions: { repliedUser: false },
        flags: MessageFlags.Ephemeral
    });
};