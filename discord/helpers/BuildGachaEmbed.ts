import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ChatInputCommandInteraction,
    EmbedBuilder
} from "discord.js";
import Database from "../singletons/Database.js";
import ConstructButtonRow, { ButtonType } from "./ConstructNavigationButtonRow.js";
import Paginate from "./Paginate.js";
import GetMaxPage from "./GetMaxPage.js";

export default function BuildGachaEmbed(
    Interaction: ChatInputCommandInteraction,
    GachaResult: Record<string, { Count: number; Rarity: 3 | 4 | 5 | 6; }>
): EmbedBuilder;
export default function BuildGachaEmbed(
    Interaction: ChatInputCommandInteraction | ButtonInteraction,
    GachaResult: Record<string, { Count: number; Rarity: 3 | 4 | 5 | 6; }>,
    PageIndex: number,
    InteractionIDs: Record<ButtonType, string>
): { Embed: EmbedBuilder; ButtonRow: ActionRowBuilder<ButtonBuilder>; };
export default function BuildGachaEmbed(
    Interaction: ChatInputCommandInteraction | ButtonInteraction,
    GachaResult: Record<string, { Count: number; Rarity: 3 | 4 | 5 | 6; }>,
    PageIndex?: number,
    InteractionIDs?: Record<ButtonType, string>
): { Embed: EmbedBuilder; ButtonRow: ActionRowBuilder<ButtonBuilder>; } | EmbedBuilder {
    if(PageIndex && InteractionIDs) {
        const CurrentPage: Record<string, { Count: number; Rarity: 3 | 4 | 5 | 6; }> = Object.fromEntries(
            Paginate(Object.entries(GachaResult), PageIndex, 20)
        );
        const MaxPage: number = GetMaxPage(Object.keys(GachaResult), 20);

        const Embed: EmbedBuilder = new EmbedBuilder()
            .setColor(Database.Manager.RarityColorMap[
                Math.max(
                    ...Object.values(CurrentPage).map(Operator => Operator.Rarity)
                ) as 3 | 4 | 5 | 6
            ])
            .setAuthor({
                name: Interaction.user.username,
                url: `https://discord.com/users/${Interaction.user.id}`,
                iconURL: Interaction.user.displayAvatarURL({ size: 256 })
            })
            .setThumbnail(Interaction.user.displayAvatarURL({ size: 512 }))
            .setTitle(`${Interaction.user.username}'s gacha result`)
            .setDescription(`Page ${PageIndex} / ${MaxPage}`)
            .addFields(
                ...Object.entries(CurrentPage).map(([Name, Operator]) => ({
                    name: `${"★".repeat(Operator.Rarity)} - ${Name}`,
                    value: `x${Operator.Count}`,
                    inline: true
                }))
            )
        ;
        const ButtonRow: ActionRowBuilder<ButtonBuilder> = ConstructButtonRow(
            PageIndex,
            MaxPage,
            InteractionIDs
        );

        return {
            Embed,
            ButtonRow
        }
    }

    const Embed: EmbedBuilder = new EmbedBuilder()
        .setColor(Database.Manager.RarityColorMap[
            Math.max(
                ...Object.values(GachaResult).map(Operator => Operator.Rarity)
            ) as 3 | 4 | 5 | 6
        ])
        .setAuthor({
            name: Interaction.user.username,
            url: `https://discord.com/users/${Interaction.user.id}`,
            iconURL: Interaction.user.displayAvatarURL({ size: 256 })
        })
        .setThumbnail(Interaction.user.displayAvatarURL({ size: 512 }))
        .setTitle(`${Interaction.user.username}'s gacha result`)
        .addFields(
            ...Object.entries(GachaResult).map(([Name, Operator]) => ({
                name: `${"★".repeat(Operator.Rarity)} - ${Name}`,
                value: `x${Operator.Count}`,
                inline: true
            }))
        )
    ;
    return Embed;
}