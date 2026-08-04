import {
    ActionRowBuilder,
    ButtonInteraction,
    ChannelSelectMenuInteraction,
    ChatInputCommandInteraction,
    EmbedBuilder,
    MentionableSelectMenuInteraction,
    MessageContextMenuCommandInteraction,
    MessageFlags,
    ModalSubmitInteraction,
    PrimaryEntryPointCommandInteraction,
    RoleSelectMenuInteraction,
    StringSelectMenuInteraction,
    UserContextMenuCommandInteraction,
    UserSelectMenuInteraction,
    type CacheType,
    type AnySelectMenuInteraction,
    type MessageActionRowComponentBuilder,
} from "discord.js";

type Interaction<Cached extends CacheType = CacheType> =
    | ChatInputCommandInteraction<Cached>
    | MessageContextMenuCommandInteraction<Cached>
    | UserContextMenuCommandInteraction<Cached>
    | PrimaryEntryPointCommandInteraction<Cached>
    | AnySelectMenuInteraction<Cached>
    | ButtonInteraction<Cached>
    | ModalSubmitInteraction<Cached>
;

const SendMessageS = async (
    Interaction: Interaction,
    Message: string
): Promise<void> => {
    if(
        Interaction instanceof StringSelectMenuInteraction ||
        Interaction instanceof UserSelectMenuInteraction ||
        Interaction instanceof RoleSelectMenuInteraction ||
        Interaction instanceof MentionableSelectMenuInteraction ||
        Interaction instanceof ChannelSelectMenuInteraction ||
        Interaction instanceof ButtonInteraction
    ) {
        await Interaction.update({
            content: Message,
            embeds: [],
            components: [],
            allowedMentions: { repliedUser: false }
        })
        return;
    }

    if(Interaction.deferred || Interaction.replied) {
        await Interaction.editReply({
            content: Message,
            embeds: [],
            components: [],
            allowedMentions: { repliedUser: false }
        })
        return;
    }

    await Interaction.reply({
        content: Message,
        embeds: [],
        components: [],
        allowedMentions: { repliedUser: false },
        flags: MessageFlags.Ephemeral
    });
};

const SendMessageEA = async (
    Interaction: Interaction,
    Embeds: EmbedBuilder[],
    Components: ActionRowBuilder<MessageActionRowComponentBuilder>[]
): Promise<void> => {
    if(
        Interaction instanceof StringSelectMenuInteraction ||
        Interaction instanceof UserSelectMenuInteraction ||
        Interaction instanceof RoleSelectMenuInteraction ||
        Interaction instanceof MentionableSelectMenuInteraction ||
        Interaction instanceof ChannelSelectMenuInteraction ||
        Interaction instanceof ButtonInteraction
    ) {
        await Interaction.update({
            embeds: Embeds,
            components: Components,
            allowedMentions: { repliedUser: false }
        })
        return;
    }
    if(Interaction.deferred || Interaction.replied) {
        await Interaction.editReply({
            embeds: Embeds,
            components: Components,
            allowedMentions: { repliedUser: false }
        });
        return;
    }

    await Interaction.reply({
        embeds: Embeds,
        components: Components,
        allowedMentions: { repliedUser: false }
    });
};

export default async function SendMessage(
    Interaction: Interaction,
    Message: string
): Promise<void>;
export default async function SendMessage(
    Interaction: Interaction,
    Embeds: EmbedBuilder[],
    Components: ActionRowBuilder<MessageActionRowComponentBuilder>[]
): Promise<void>;
export default async function SendMessage(
    Interaction: Interaction,
    Message: string | EmbedBuilder[],
    Components?: ActionRowBuilder<MessageActionRowComponentBuilder>[]
): Promise<void> {
    if(Components == undefined)
        Components = [];

    if(typeof Message === "string") 
        return await SendMessageS(Interaction, Message);
    await SendMessageEA(Interaction, Message, Components);
}