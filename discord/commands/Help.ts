import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ChatInputCommandInteraction,
    EmbedBuilder,
    MessageFlags,
    SlashCommandBuilder
} from "discord.js";
import type { Command } from "../types/Command.js";
import ConstructButtonRow from "../helpers/ConstructNavigationButtonRow.js";
import CommandManager from "../singletons/CommandManager.js";
import Paginate from "../helpers/Paginate.js";
import GetMaxPage from "../helpers/GetMaxPage.js";
import ActionCustomIDParser from "../helpers/ActionCustomIDParser.js";

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
            .setDescription(MaxPage > 1 ? `Page ${1} / ${MaxPage}` : null)
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

        const ButtonRow: ActionRowBuilder<ButtonBuilder> = ConstructButtonRow(
            "help",
            1,
            MaxPage,
            [],
            Interaction.user.id
        );

        await Interaction.editReply({
            embeds: [Embed],
            components: MaxPage > 1 ? [ButtonRow] : [],
            allowedMentions: { repliedUser: false }
        });
    },
    Button: async (Interaction: ButtonInteraction): Promise<void> => {
        const CustomID = ActionCustomIDParser(
            Interaction.customId,
            {
                Type: "",
                Page: ""
            }
        );
        
        if(Interaction.user.id !== CustomID.Owner)
            return;
        
        const Page: string = CustomID.Meta.Page;
        const Commands: Command[] = [...CommandManager.Values()];
        const MaxPage: number = GetMaxPage(Commands, 25);
        let NextPage: number;

        switch(CustomID.Meta.Type) {
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
            .setDescription(`Page ${NextPage} / ${MaxPage}`)
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

        const ButtonRow: ActionRowBuilder<ButtonBuilder> = ConstructButtonRow(
            "help",
            NextPage,
            MaxPage,
            [],
            Interaction.user.id
        );

        await Interaction.update({
            embeds: [Embed],
            components: [ButtonRow],
            allowedMentions: { repliedUser: false }
        });
    }
} satisfies Command;