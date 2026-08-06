import { ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
import ActionRowIDBuilder from "./ActionRowIDBuilder.js";

enum ButtonType {
    BackwardToStart,
    Backward,
    Forward,
    ForwardToEnd
};

const ButtonEmoji: Record<ButtonType, string> = {
    [ButtonType.BackwardToStart]: "⏪",
    [ButtonType.Backward]: "◀️",
    [ButtonType.Forward]: "▶️",
    [ButtonType.ForwardToEnd]: "⏩"
};

const ConstructButton = (
    CommandName: string,
    Type: ButtonType,
    PageIndex: number,
    ExtraMeta: string[],
    Owner: string
): ButtonBuilder => 
    new ButtonBuilder()
        .setCustomId(ActionRowIDBuilder(CommandName, [Type.toString(), PageIndex.toString(), ...ExtraMeta], Owner))
        .setEmoji({ name: ButtonEmoji[Type] })
        .setStyle(ButtonStyle.Primary)
;

export default (
    CommandName: string,
    PageIndex: number,
    MaxPage: number,
    ExtraMeta: string[],
    Owner: string
): ActionRowBuilder<ButtonBuilder> => {
    const BackwardToStartButton: ButtonBuilder = ConstructButton(
        CommandName,
        ButtonType.BackwardToStart,
        PageIndex,
        ExtraMeta,
        Owner
    );
    const BackwardButton: ButtonBuilder = ConstructButton(
        CommandName,
        ButtonType.Backward,
        PageIndex,
        ExtraMeta,
        Owner
    );
    const ForwardButton: ButtonBuilder = ConstructButton(
        CommandName,
        ButtonType.Forward,
        PageIndex,
        ExtraMeta,
        Owner
    );
    const ForwardToEndButton: ButtonBuilder = ConstructButton(
        CommandName,
        ButtonType.ForwardToEnd,
        PageIndex,
        ExtraMeta,
        Owner
    );
    return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            ...[BackwardToStartButton, BackwardButton, ForwardButton, ForwardToEndButton].slice(
                ...(PageIndex === 1 ? [0, 2] : PageIndex === MaxPage ? [2, 4] : [0, 4])
            )
        )
    ;
};