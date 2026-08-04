import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    EmbedBuilder,
    MessageFlags,
    SlashCommandBuilder
} from "discord.js";
import type { Command } from "../types/Command.js";
import CommandManager from "../singletons/CommandManager.js";
import Paginate from "../helpers/Paginate.js";
import GetMaxPage from "../helpers/GetMaxPage.js";
import ActionRowIDBuilder from "../helpers/ActionRowIDBuilder.js";
import SendMessage from "../helpers/SendMessage.js";

enum ButtonType {
    BackwardToStart,
    Backward,
    Forward,
    ForwardToEnd
}
const ButtonEmoji: Record<ButtonType, string> = {
    [ButtonType.BackwardToStart]: "⏪",
    [ButtonType.Backward]: "◀️",
    [ButtonType.Forward]: "▶️",
    [ButtonType.ForwardToEnd]: "⏩"
};

const ConstructButton = (Type: ButtonType, PageIndex: number, Owner: string): ButtonBuilder => 
    new ButtonBuilder()
        .setCustomId(ActionRowIDBuilder("help", [Type.toString(), PageIndex.toString()], Owner))
        .setEmoji({ name: ButtonEmoji[Type] })
        .setStyle(ButtonStyle.Primary)
;

export default {
    Command: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Get a list of commands.")
    ,
    Action: async (Interaction: ChatInputCommandInteraction): Promise<void> => {
        await Interaction.deferReply({
            flags: MessageFlags.Ephemeral
        });

        const Commands: Command[] = [...CommandManager.Values()];
        const CommandPages: Command[] = Paginate(Commands, 1, 25);
        const MaxPage: number = GetMaxPage(Commands, 25);

        const Embed: EmbedBuilder = new EmbedBuilder()
            .setColor(0x00ffff)
            .setTitle("Help command.")
            .addFields(
                ...CommandPages.map(Command => ({
                    name: `/${Command.Command.name} ${
                        Command.Command.options.map(
                            Option => `[${Option.toJSON().name}${Option.toJSON().required ? "*" : ""}]`
                        ).join(" ")
                    }`.trim(),
                    value: `${Command.Command.description}`,
                    inline: true 
                }))
            )
            .setFooter({ 
                text: "* = required options, (Administrator Command) = commands only the bot administrators can run, (Cancelable) = long running commands that can be cancel with /cancel."
             })
        ;

        const ForwardButton: ButtonBuilder = ConstructButton(ButtonType.Forward, 1, Interaction.user.id);
        const ForwardToEndButton: ButtonBuilder = ConstructButton(ButtonType.ForwardToEnd, 1, Interaction.user.id);
        const ButtonRow: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                ForwardButton,
                ForwardToEndButton
            )
        ;

        await SendMessage(Interaction, [Embed], MaxPage > 1 ? [ButtonRow] : []);
    },
    Button: async (Interaction: ButtonInteraction): Promise<void> => {
        const [, ActionMeta, Owner]: string[] = Interaction.customId.split(":");
        const [Type, Page]: string[] = ActionMeta.split("/");
        const Commands: Command[] = [...CommandManager.Values()];
        const MaxPage: number = GetMaxPage(Commands, 25);

        if(Interaction.user.id !== Owner)
            return;

        let NextPage: number;

        switch(Type) {
            case "0":
                if(Number(Page) === 1)
                    return;
                NextPage = 1;
                break;

            case "1":
                if(Number(Page) === 1)
                    return;
                NextPage = Number(Page) - 1;
                break;

            case "2":
                if(Number(Page) === MaxPage)
                    return;
                NextPage = Number(Page) + 1;
                break;

            case "3":
                if(Number(Page) === MaxPage)
                    return;
                NextPage = MaxPage;
                break;
            
            default: return;
        }

        const CommandPages: Command[] = Paginate(Commands, NextPage, 25);
        const Embed: EmbedBuilder = new EmbedBuilder()
            .setColor(0x00ffff)
            .setTitle(`Help command.`)
            .addFields(
                ...CommandPages.map(Command => ({
                    name: `/${Command.Command.name} ${
                        Command.Command.options.map(
                            Option => `[${Option.toJSON().name}${Option.toJSON().required ? "*" : ""}]`
                        ).join(" ")
                    }`.trim(),
                    value: `${Command.Command.description}`,
                    inline: true 
                }))
            )
            .setFooter({ 
                text: "* = required options, (Administrator Command) = commands only the bot administrators can run, (Cancelable) = long running commands that can be cancel with /cancel."
             })
        ;

        const BackwardToStartButton: ButtonBuilder = ConstructButton(ButtonType.BackwardToStart, NextPage, Owner);
        const BackwardButton: ButtonBuilder = ConstructButton(ButtonType.Backward, NextPage, Owner);
        const ForwardButton: ButtonBuilder = ConstructButton(ButtonType.Forward, NextPage, Owner);
        const ForwardToEndButton: ButtonBuilder = ConstructButton(ButtonType.ForwardToEnd, NextPage, Owner);
        const ButtonRow: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                ...[BackwardToStartButton, BackwardButton, ForwardButton, ForwardToEndButton].slice(
                    ...(NextPage === 1 ? [0, 2] : NextPage === MaxPage ? [2, 4] : [0, 4])
                )
            )
        ;

        await SendMessage(Interaction, [Embed], MaxPage > 1 ? [ButtonRow] : []);
    }
} satisfies Command;