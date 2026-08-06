import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import Database from "../singletons/Database.js";

export default (Interaction: ChatInputCommandInteraction, GachaResult: Record<string, { Count: number; Rarity: 3 | 4 | 5 | 6; }>): EmbedBuilder => {
    return new EmbedBuilder()
        .setColor(Database.Manager.RarityColorMap[Math.max(...Object.values(GachaResult).map(Operator => Operator.Rarity)) as 3 | 4 | 5 | 6])
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
}