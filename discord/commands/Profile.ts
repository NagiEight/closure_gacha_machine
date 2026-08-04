import { 
    ActionRowBuilder,
    AutocompleteInteraction,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    Client,
    EmbedBuilder,
    SlashCommandBuilder,
    User
} from "discord.js";
import type { Command } from "../types/Command.js";
import Database, { type User as Profile } from "../singletons/Database.js";
import SendMessage from "../helpers/SendMessage.js";
import ActionRowIDBuilder from "../helpers/ActionRowIDBuilder.js";
import ProcessUserProfile from "../helpers/ProcessUserProfile.js";
import Paginate from "../helpers/Paginate.js";
import GetMaxPage from "../helpers/GetMaxPage.js";

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

const ConstructButton = (Type: ButtonType, BannerName: string, PageIndex: number, User: string, Owner: string): ButtonBuilder => 
    new ButtonBuilder()
        .setCustomId(ActionRowIDBuilder("profile", [Type.toString(), BannerName, PageIndex.toString(), User], Owner))
        .setEmoji({ name: ButtonEmoji[Type] })
        .setStyle(ButtonStyle.Primary)
;

export default {
    Command: new SlashCommandBuilder()
        .setName("profile")
        .setDescription("Get the gacha profile of a user.")
        .addUserOption(Option =>
            Option
                .setName("user")
                .setDescription("User to retrive profile.")
                .setRequired(false)
        )
        .addStringOption(Option =>
            Option
                .setName("banner")
                .setDescription("Banner to check.")
                .setRequired(true)
                .setAutocomplete(true)
        )
    ,
    Action: async (Interaction: ChatInputCommandInteraction): Promise<void> => { 
        const User: User = Interaction.options.getUser("user", false) ?? Interaction.user;
        const BannerName: string = Interaction.options.getString("banner", true);
        const Profile: Profile | undefined = Database.Manager.Users.get(User.id);

        if(!Profile) 
            return await SendMessage(Interaction, `${User.username} doesn't exist or doesn't have a profile`);
        
        await Interaction.deferReply();
        
        const ProcessedUserBannerProfile: {
            Name: string;
            Rarity: 3 | 4 | 5 | 6;
            Count: number;
        }[] = await ProcessUserProfile(User.id, BannerName);
        const MaxPage: number = GetMaxPage(ProcessedUserBannerProfile, 10);

        const Embed: EmbedBuilder = new EmbedBuilder()
            .setAuthor({
                name: User.username,
                url: `https://discord.com/users/${User.id}`,
                iconURL: User.displayAvatarURL({ size: 256 })
            })
            .setThumbnail(User.displayAvatarURL({ size: 512 }))
            .setTitle(`Banner: ${BannerName}`)
            .setDescription(`Total rolls: ${Profile.Profile[BannerName].Count}`)
            .addFields(
                ...Paginate(ProcessedUserBannerProfile, 1, 10).map(Operator => ({
                    name: Operator.Name,
                    value: `${"★".repeat(Operator.Rarity)} - ${Operator.Count} Cop${Operator.Count > 1 ? "ies" : "y"}`
                }))
            )
        ;
                
        const ForwardButton: ButtonBuilder = ConstructButton(
            ButtonType.Forward,
            BannerName,
            1,
            User.id,
            Interaction.user.id
        );
        const ForwardToEndButton: ButtonBuilder = ConstructButton(
            ButtonType.ForwardToEnd,
            BannerName,
            1,
            User.id,
            Interaction.user.id
        );
        const ButtonRow: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                ForwardButton,
                ForwardToEndButton
            )
        ;
        
        await Interaction.editReply({
            embeds: [Embed],
            components: MaxPage > 1 ? [ButtonRow] : undefined
        });
    },
    Button: async (Interaction: ButtonInteraction, Client: Client): Promise<void> => {
        const [, ActionMeta, Owner]: string[] = Interaction.customId.split(":");
        const [ActionName, BannerName, Page, UserID]: string[] = ActionMeta.split("/");

        if(Interaction.user.id !== Owner)
            return;

        const Profile: Profile = Database.Manager.Users.get(UserID)!;
        const ProcessedUserBannerProfile: {
            Name: string;
            Rarity: 3 | 4 | 5 | 6;
            Count: number;
        }[] = await ProcessUserProfile(Profile, BannerName);
        const MaxPage: number = GetMaxPage(ProcessedUserBannerProfile, 10);
        const User: User = await Client.users.fetch(UserID);

        let NextPage: number;

        switch(ActionName) {
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

        const BackwardToStartButton: ButtonBuilder = ConstructButton(
            ButtonType.BackwardToStart,
            BannerName,
            NextPage,
            UserID,
            Owner
        );
        const BackwardButton: ButtonBuilder = ConstructButton(
            ButtonType.Backward,
            BannerName,
            NextPage,
            UserID,
            Owner
        );
        const ForwardButton: ButtonBuilder = ConstructButton(
            ButtonType.Forward,
            BannerName,
            NextPage,
            UserID,
            Owner
        );
        const ForwardToEndButton: ButtonBuilder = ConstructButton(
            ButtonType.ForwardToEnd,
            BannerName,
            NextPage,
            UserID,
            Owner
        );
        const ButtonRow: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                ...(
                    NextPage === 1 
                        ? [ForwardButton, ForwardToEndButton]
                    : NextPage === MaxPage
                        ? [BackwardToStartButton, BackwardButton]
                    : [BackwardToStartButton, BackwardButton, ForwardButton, ForwardToEndButton]
                )
            )
        ;
        
        const Embed: EmbedBuilder = new EmbedBuilder()
            .setAuthor({
                name: User.username,
                url: `https://discord.com/users/${User.id}`,
                iconURL: User.displayAvatarURL({ size: 256 })
            })
            .setThumbnail(User.displayAvatarURL({ size: 512 }))
            .setTitle(`Banner: ${BannerName}`)
            .setDescription(`Total rolls: ${Profile.Profile[BannerName].Count}`)
            .addFields(
                ...Paginate(ProcessedUserBannerProfile, NextPage, 10).map(Operator => ({
                    name: Operator.Name,
                    value: `${"★".repeat(Operator.Rarity)} - ${Operator.Count} Cop${Operator.Count > 1 ? "ies" : "y"}`
                }))
            )
        ;

        await Interaction.update({
            embeds: [Embed],
            components: MaxPage > 1 ? [ButtonRow] : undefined
        });
    },
    Autocomplete: async (Interaction: AutocompleteInteraction): Promise<void> => {
        const UserID: string = Interaction.options.data.find(
            Option => Option.name === "user"
        )?.value as string ?? Interaction.user.id;

        const Profile: Profile = Database.Manager.Users.get(UserID)!;
        if(!Profile)
            return;

        await Interaction.respond(
            Object.keys(Profile.Profile)
                .filter(
                    BannerName => BannerName
                        .toLocaleLowerCase()
                        .includes(Interaction.options.getFocused().trim().toLowerCase())
                )
                .slice(0, 25)
                .map(BannerName => ({
                    name: BannerName,
                    value: BannerName
                })
            )
        );
    }
} satisfies Command;