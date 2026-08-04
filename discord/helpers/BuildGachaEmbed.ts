import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import Database from "../singletons/Database.js";

export default (Interaction: ChatInputCommandInteraction, GachaResult: Record<string, number>, Rarity: 3 | 4 | 5 | 6): EmbedBuilder =>
    new EmbedBuilder()
        .setColor(Database.Manager.RarityColorMap[Rarity])
        .setAuthor({
            name: Interaction.user.username,
            url: `https://discord.com/users/${Interaction.user.id}`,
            iconURL: Interaction.user.displayAvatarURL({ size: 256 })
        })
        .setThumbnail(Interaction.user.displayAvatarURL({ size: 512 }))
        .setTitle(`${Interaction.user.username}'s gacha result`)
        .addFields(
            ...Object.entries(GachaResult).map(([Operator, Count]) => ({
                name: Operator,
                value: `x${Count}`
            }))
        )
;