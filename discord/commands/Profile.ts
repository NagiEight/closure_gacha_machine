import { 
    ActionRowBuilder,
    AutocompleteInteraction,
    ButtonBuilder,
    ButtonInteraction,
    ChatInputCommandInteraction,
    Client,
    EmbedBuilder,
    MessageFlags,
    SlashCommandBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
    User
} from "discord.js";
import type { Command } from "../types/Command.js";
import Database, { type User as Profile } from "../singletons/Database.js";
import ConstructButtonRow from "../helpers/ConstructNavigationButtonRow.js";
import ProcessUserProfile from "../helpers/ProcessUserProfile.js";
import Paginate from "../helpers/Paginate.js";
import GetMaxPage from "../helpers/GetMaxPage.js";
import ActionCustomIDParser from "../helpers/ActionCustomIDParser.js";
import ActionRowIDBuilder from "../helpers/ActionRowIDBuilder.js";

export enum FilterType {
    All,
    ThreeStars,
    FourStars,
    FiveStars,
    SixStars
}

export const PlaceholderText: Record<FilterType, string> = {
    [FilterType.All]: "All",
    [FilterType.ThreeStars]: "★★★",
    [FilterType.FourStars]: "★★★★",
    [FilterType.FiveStars]: "★★★★★",
    [FilterType.SixStars]: "★★★★★★"
};

export default {
    Command: new SlashCommandBuilder()
        .setName("profile")
        .setDescription("Get the gacha profile of a user.")
        .addStringOption(Option =>
            Option
                .setName("banner")
                .setDescription("Banner to check.")
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addUserOption(Option =>
            Option
                .setName("user")
                .setDescription("User to retrive profile.")
                .setRequired(false)
        )
    ,
    Action: async (Interaction: ChatInputCommandInteraction): Promise<void> => { 
        const User: User = Interaction.options.getUser("user", false) ?? Interaction.user;
        const BannerName: string = Interaction.options.getString("banner", true);
        const Profile: Profile | undefined = Database.Manager.Users.get(User.id);

        if(!Profile) {
            await Interaction.reply({
                content: "You don't have a gacha profile.",
                allowedMentions: { repliedUser: false },
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        
        await Interaction.deferReply();
        
        const ProcessedUserBannerProfile: {
            Name: string;
            Rarity: 3 | 4 | 5 | 6;
            Count: number;
        }[] = await ProcessUserProfile(User.id, BannerName);
        
        const MaxPage: number = GetMaxPage(ProcessedUserBannerProfile, 10);
        const IncludedRarity: Set<number> = new Set(Object.values(ProcessedUserBannerProfile).map(V => V.Rarity));

        const Filter: StringSelectMenuBuilder = new StringSelectMenuBuilder()
            .setCustomId(ActionRowIDBuilder("profile", [BannerName, User.id], Interaction.user.id))
            .setPlaceholder(`Filter: ${PlaceholderText[FilterType.All]}`)
            .addOptions(
                ...Object.entries(PlaceholderText)
                    .filter(([Type,]) => IncludedRarity.has(Number(Type) + 2))
                    .map(([Type, Text]) => ({
                        label: Text,
                        value: Type
                    }))
            )
            .setMinValues(1)
            .setMaxValues(1)
        ;
        const FilterRow: ActionRowBuilder<StringSelectMenuBuilder> = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(Filter)
        ;

        const Embed: EmbedBuilder = new EmbedBuilder()
            .setAuthor({
                name: User.username,
                url: `https://discord.com/users/${User.id}`,
                iconURL: User.displayAvatarURL({ size: 256 })
            })
            .setThumbnail(User.displayAvatarURL({ size: 512 }))
            .setTitle(`Banner: ${BannerName}`)
            .setDescription(
                `Total rolls: ${Profile.Profile[BannerName].Count}` +
                (MaxPage > 1 ? `\nPage ${1} / ${MaxPage}` : "")
            )
            .addFields(
                ...Paginate(ProcessedUserBannerProfile, 1, 10).map(Operator => ({
                    name: Operator.Name,
                    value: `${"★".repeat(Operator.Rarity)} - x${Operator.Count}`,
                    inline: true
                }))
            )
        ;
        
        const ButtonRow: ActionRowBuilder<ButtonBuilder> = ConstructButtonRow(
            "profile",
            1,
            MaxPage,
            // filter type
            ["0", BannerName ,User.id],
            Interaction.user.id
        );
        
        await Interaction.editReply({
            embeds: [Embed],
            components: MaxPage > 1 ? [ButtonRow, FilterRow] : [FilterRow],
            allowedMentions: { repliedUser: false }
        });
    },
    Button: async (Interaction: ButtonInteraction, Client: Client): Promise<void> => {
        const CustomID = ActionCustomIDParser(
            Interaction.customId,
            {
                ActionName: "",
                Page: "",
                FilterType: "",
                BannerName: "",
                UserID: ""
            }
        );
        const Filter: string = CustomID.Meta.FilterType;
        
        if(Interaction.user.id !== CustomID.Owner)
            return;

        await Interaction.deferUpdate();
        
        const Page: string = CustomID.Meta.Page;
        const BannerName: string = CustomID.Meta.BannerName;
        const Profile: Profile = Database.Manager.Users.get(CustomID.Meta.UserID)!;
        const ProcessedUserBannerProfile: {
            Name: string;
            Rarity: 3 | 4 | 5 | 6;
            Count: number;
        }[] = (await ProcessUserProfile(Profile, CustomID.Meta.BannerName)).filter(V => {
            switch(Filter) {
                case "1":
                    return V.Rarity === 3;

                case "2":
                    return V.Rarity === 4;

                case "3":
                    return V.Rarity === 5;

                case "4":
                    return V.Rarity === 6;

                default: return true;
            }
        });
        const MaxPage: number = GetMaxPage(ProcessedUserBannerProfile, 10);
        const User: User = await Client.users.fetch(CustomID.Meta.UserID);

        let NextPage: number;

        switch(CustomID.Meta.ActionName) {
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

        const IncludedRarity: Set<number> = new Set(Object.values(ProcessedUserBannerProfile).map(V => V.Rarity));
        const FilterMenu: StringSelectMenuBuilder = new StringSelectMenuBuilder()
            .setCustomId(ActionRowIDBuilder("profile", [BannerName, User.id], Interaction.user.id))
            .setPlaceholder(`Filter: ${PlaceholderText[Number(Filter) as FilterType]}`)
            .addOptions(
                ...Object.entries(PlaceholderText)
                    .filter(([Type,]) => (IncludedRarity.has(Number(Type) + 2) || Type === "0") && Type !== Filter)
                    .map(([Type, Text]) => ({
                        label: Text,
                        value: Type
                    }))
            )
            .setMinValues(1)
            .setMaxValues(1)
        ;
        const FilterRow: ActionRowBuilder<StringSelectMenuBuilder> = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(FilterMenu)
        ;

        const ButtonRow: ActionRowBuilder<ButtonBuilder> = ConstructButtonRow(
            "profile",
            NextPage,
            MaxPage,
            [Filter, BannerName, User.id],
            Interaction.user.id
        );
        
        const Embed: EmbedBuilder = new EmbedBuilder()
            .setAuthor({
                name: User.username,
                url: `https://discord.com/users/${User.id}`,
                iconURL: User.displayAvatarURL({ size: 256 })
            })
            .setThumbnail(User.displayAvatarURL({ size: 512 }))
            .setTitle(`Banner: ${BannerName}`)
            .setDescription(
                `Total rolls: ${Profile.Profile[BannerName].Count}\n` +
                `Page ${NextPage} / ${MaxPage}`
            )
            .addFields(
                ...Paginate(ProcessedUserBannerProfile, NextPage, 10).map(Operator => ({
                    name: Operator.Name,
                    value: `${"★".repeat(Operator.Rarity)} - x${Operator.Count}`,
                    inline: true
                }))
            )
        ;

        await Interaction.editReply({
            embeds: [Embed],
            components: MaxPage > 1 ? [ButtonRow, FilterRow] : [FilterRow],
            allowedMentions: { repliedUser: false }
        });
    },
    StringMenu: async (Interaction: StringSelectMenuInteraction, Client: Client): Promise<void> => {
        // ActionRowIDBuilder("profile", [BannerName, User.id], Interaction.user.id)
        const CustomID = ActionCustomIDParser(
            Interaction.customId,
            {
                BannerName: "",
                UserID: ""
            }
        );
        const BannerName: string = CustomID.Meta.BannerName;
        const UserID: string = CustomID.Meta.UserID;
        const User: User = await Client.users.fetch(UserID);

        if(Interaction.user.id != CustomID.Owner) 
            return;

        await Interaction.deferUpdate();
        
        const FilterType: string = Interaction.values[0];
        const Profile: Profile = Database.Manager.Users.get(UserID)!;
        const ProcessedUserBannerProfile: {
            Name: string;
            Rarity: 3 | 4 | 5 | 6;
            Count: number;
        }[] = await ProcessUserProfile(Profile, BannerName);
        const IncludedRarity: Set<number> = new Set(Object.values(ProcessedUserBannerProfile).map(V => V.Rarity));
        const FilteredProcessedUserBannerProfile: {
            Name: string;
            Rarity: 3 | 4 | 5 | 6;
            Count: number;
        }[] = ProcessedUserBannerProfile.filter(V => {
            switch(FilterType) {
                case "1":
                    return V.Rarity === 3;

                case "2":
                    return V.Rarity === 4;

                case "3":
                    return V.Rarity === 5;

                case "4":
                    return V.Rarity === 6;

                default: return true;
            }
        });
        const MaxPage: number = GetMaxPage(FilteredProcessedUserBannerProfile, 10);

        const FilterMenu: StringSelectMenuBuilder = new StringSelectMenuBuilder()
            .setCustomId(ActionRowIDBuilder("profile", [BannerName, UserID], Interaction.user.id))
            .setPlaceholder(`Filter: ${PlaceholderText[Number(FilterType) as FilterType]}`)
            .addOptions(
                ...Object.entries(PlaceholderText)
                    .filter(([Type,]) => (IncludedRarity.has(Number(Type) + 2)  || Type === "0") && Type !== FilterType)
                    .map(([Type, Text]) => ({
                        label: Text,
                        value: Type
                    }))
            )
            .setMinValues(1)
            .setMaxValues(1)
        ;
        const FilterRow: ActionRowBuilder<StringSelectMenuBuilder> = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(FilterMenu)
        ;

        const ButtonRow: ActionRowBuilder<ButtonBuilder> = ConstructButtonRow(
            "profile",
            1,
            MaxPage,
            // filter type
            [FilterType, BannerName, UserID],
            Interaction.user.id
        );

        const Embed: EmbedBuilder = new EmbedBuilder()
            .setAuthor({
                name: User.username,
                url: `https://discord.com/users/${User.id}`,
                iconURL: User.displayAvatarURL({ size: 256 })
            })
            .setThumbnail(User.displayAvatarURL({ size: 512 }))
            .setTitle(`Banner: ${BannerName}`)
            .setDescription(
                `Total rolls: ${Profile.Profile[BannerName].Count}\n` +
                `Page ${1} / ${MaxPage}`
            )
            .addFields(
                ...Paginate(FilteredProcessedUserBannerProfile, 1, 10).map(Operator => ({
                    name: Operator.Name,
                    value: `${"★".repeat(Operator.Rarity)} - x${Operator.Count}`,
                    inline: true
                }))
            )
        ;

        await Interaction.editReply({
            embeds: [Embed],
            components: MaxPage > 1 ? [ButtonRow, FilterRow] : [FilterRow],
            allowedMentions: { repliedUser: false }
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
} as const satisfies Command;