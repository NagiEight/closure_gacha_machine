import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import Database from "../singletons/Database.js";
import ConstructButtonRow from "./ConstructNavigationButtonRow.js";

export default function BuildGachaEmbed(
    Interaction: ChatInputCommandInteraction,
    GachaResult: Record<string, { Count: number; Rarity: 3 | 4 | 5 | 6; }>
): EmbedBuilder;
export default function BuildGachaEmbed(
    Interaction: ChatInputCommandInteraction | ButtonInteraction,
    GachaResult: Record<string, { Count: number; Rarity: 3 | 4 | 5 | 6; }>,
    CommandName: string,
    PageIndex: number,
    MaxPage: number,
    PoolID: string
): { Embed: EmbedBuilder; ButtonRow: ActionRowBuilder<ButtonBuilder>; };
export default function BuildGachaEmbed(
    Interaction: ChatInputCommandInteraction | ButtonInteraction,
    GachaResult: Record<string, { Count: number; Rarity: 3 | 4 | 5 | 6; }> | string,
    CommandName?: string,
    PageIndex?: number,
    MaxPage?: number,
    PoolID?: string
): { Embed: EmbedBuilder; ButtonRow: ActionRowBuilder<ButtonBuilder>; } | EmbedBuilder {
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
    return PoolID && MaxPage && PageIndex && CommandName
        ? {
            Embed: Embed.setDescription(`Page ${PageIndex} / ${MaxPage}`),
            ButtonRow: ConstructButtonRow(
                CommandName,
                PageIndex,
                MaxPage,
                [PoolID],
                Interaction.user.id
            )
        }
        : Embed
    ;
}