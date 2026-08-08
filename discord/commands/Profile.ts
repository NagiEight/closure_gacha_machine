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
import Database, { type User as Profile } from "../singletons/Database.js";
import ConstructButtonRow, { ButtonType } from "../helpers/ConstructNavigationButtonRow.js";
import ProcessUserProfile from "../helpers/ProcessUserProfile.js";
import Paginate from "../helpers/Paginate.js";
import GetMaxPage from "../helpers/GetMaxPage.js";
import EmbedActionInteractionManager from "../singletons/EmbedActionInteractionManager.js";
import CreateNavigationButtonHandler from "../helpers/CreateNavigationButtonHandler.js";
import Command, { InteractionTypes } from "../types/Command.js";

interface FilterInteractionMeta {
    BannerName: string;
    UserID: string;
    CurrentFilter: FilterType;
    InteractionIDs?: Record<ButtonType, string>;
}

interface InteractionMeta extends FilterInteractionMeta {
    CurrentPage: number;
    FilterID: string;
    InteractionIDs: Record<ButtonType, string>;
}

export enum FilterType {
    All = "All",
    ThreeStars = "ThreeStars",
    FourStars = "FourStars",
    FiveStars = "FiveStars",
    SixStars = "SixStars"
}

const PlaceholderText: Record<FilterType, string> = {
    [FilterType.All]: "All",
    [FilterType.ThreeStars]: "★★★",
    [FilterType.FourStars]: "★★★★",
    [FilterType.FiveStars]: "★★★★★",
    [FilterType.SixStars]: "★★★★★★"
};
const FilterRarity: Record<FilterType, number> = {
    [FilterType.All]: 0,
    [FilterType.ThreeStars]: 3,
    [FilterType.FourStars]: 4,
    [FilterType.FiveStars]: 5,
    [FilterType.SixStars]: 6
}

export default new Command(
    new SlashCommandBuilder()
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
    async (Interaction: ChatInputCommandInteraction): Promise<void> => { 
        const User: User = Interaction.options.getUser("user", false) ?? Interaction.user;
        const BannerName: string = Interaction.options.getString("banner", true);
        const UserID: string = User.id;
        const Profile: Profile | undefined = Database.Manager.Users.get(UserID);

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
        }[] = await ProcessUserProfile(Profile, BannerName);
        
        const MaxPage: number = GetMaxPage(ProcessedUserBannerProfile, 10);
        const IncludedRarity: Set<number> = new Set(Object.values(ProcessedUserBannerProfile).map(V => V.Rarity));

        const FilterInteractionMeta: FilterInteractionMeta = {
            BannerName,
            UserID,
            CurrentFilter: FilterType.All
        };
        const FilterID: string = EmbedActionInteractionManager.AddInteraction(
            Interaction.user.id,
            Interaction.commandName,
            "ProfileFilter",
            FilterInteractionMeta
        );
        const Filter: StringSelectMenuBuilder = new StringSelectMenuBuilder()
            .setCustomId(FilterID)
            .setPlaceholder(`Filter: ${PlaceholderText[FilterType.All]}`)
            .addOptions(
                ...Object.entries(PlaceholderText)
                    .filter(([Type,]) => IncludedRarity.has(FilterRarity[Type as FilterType]))
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

        if(MaxPage > 1) {
            const Owner: string = Interaction.user.id;
            const CommandName: string = Interaction.commandName;
            const InteractionMeta: InteractionMeta = {
                CurrentPage: 1,
                BannerName,
                CurrentFilter: FilterType.All,
                UserID,
                FilterID,
                InteractionIDs: {
                    [ButtonType.BackwardToStart]: "",
                    [ButtonType.Backward]: "",
                    [ButtonType.Forward]: "",
                    [ButtonType.ForwardToEnd]: ""
                }
            };
            const InteractionIDs: Record<ButtonType, string> = {
                [ButtonType.BackwardToStart]: EmbedActionInteractionManager.AddInteraction(
                    Owner,
                    CommandName,
                    ButtonType.BackwardToStart,
                    InteractionMeta
                ),
                [ButtonType.Backward]: EmbedActionInteractionManager.AddInteraction(
                    Owner,
                    CommandName,
                    ButtonType.Backward,
                    InteractionMeta
                ),
                [ButtonType.Forward]: EmbedActionInteractionManager.AddInteraction(
                    Owner,
                    CommandName,
                    ButtonType.Forward,
                    InteractionMeta
                ),
                [ButtonType.ForwardToEnd]: EmbedActionInteractionManager.AddInteraction(
                    Owner,
                    CommandName,
                    ButtonType.ForwardToEnd,
                    InteractionMeta
                )
            };
            const ButtonRow: ActionRowBuilder<ButtonBuilder> = ConstructButtonRow(
                1, MaxPage, InteractionIDs
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
                    ...Paginate(ProcessedUserBannerProfile, 1, 10).map(Operator => ({
                        name: Operator.Name,
                        value: `${"★".repeat(Operator.Rarity)} - x${Operator.Count}`,
                        inline: true
                    }))
                )
            ;

            await Interaction.editReply({
                embeds: [Embed],
                components: [ButtonRow, FilterRow],
                allowedMentions: { repliedUser: false }
            });
            return;
        }

        const Embed: EmbedBuilder = new EmbedBuilder()
            .setAuthor({
                name: User.username,
                url: `https://discord.com/users/${User.id}`,
                iconURL: User.displayAvatarURL({ size: 256 })
            })
            .setThumbnail(User.displayAvatarURL({ size: 512 }))
            .setTitle(`Banner: ${BannerName}`)
            .setDescription(
                `Total rolls: ${Profile.Profile[BannerName].Count}`
            )
            .addFields(
                ...ProcessedUserBannerProfile.map(Operator => ({
                    name: Operator.Name,
                    value: `${"★".repeat(Operator.Rarity)} - x${Operator.Count}`,
                    inline: true
                }))
            )
        ;
        
        await Interaction.editReply({
            embeds: [Embed],
            components: [FilterRow],
            allowedMentions: { repliedUser: false }
        });
    }
)
.AddInteractionHandler(
    InteractionTypes.Autocomplete,
    "banner",
    async (Interaction: AutocompleteInteraction): Promise<void> => {
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
)
.AddInteractionHandler(
    InteractionTypes.Button,
    CreateNavigationButtonHandler(
        async (Interaction: ButtonInteraction, Type: ButtonType, Client: Client): Promise<void> => {
            const UserID: string = Interaction.user.id;
            const InteractionMeta: InteractionMeta | undefined = EmbedActionInteractionManager.GetInteraction<InteractionMeta>(
                UserID, Interaction.customId
            );

            if(!InteractionMeta)
                return;

            await Interaction.deferUpdate();

            InteractionMeta.CurrentPage = {
                [ButtonType.BackwardToStart]: 1,
                [ButtonType.Backward]: InteractionMeta.CurrentPage - 1,
                [ButtonType.Forward]: InteractionMeta.CurrentPage + 1,
                [ButtonType.ForwardToEnd]: 0
            }[Type];

            const User: User = await Client.users.fetch(InteractionMeta.UserID);
            const BannerName: string = InteractionMeta.BannerName;
            const Profile: Profile = Database.Manager.Users.get(User.id)!;

            const ProcessedUserBannerProfile: {
                Name: string;
                Rarity: 3 | 4 | 5 | 6;
                Count: number;
            }[] = await ProcessUserProfile(Profile, BannerName);
            const FilteredProfile: {
                Name: string;
                Rarity: 3 | 4 | 5 | 6;
                Count: number;
            }[] = ProcessedUserBannerProfile.filter(V => {
                switch(InteractionMeta.CurrentFilter) {
                    case FilterType.ThreeStars:
                        return V.Rarity === 3;

                    case FilterType.FourStars:
                        return V.Rarity === 4;

                    case FilterType.FiveStars:
                        return V.Rarity === 5;

                    case FilterType.SixStars:
                        return V.Rarity === 6;
                    
                    case FilterType.All:
                    default: return true;
                }
            });

            const MaxPage: number = GetMaxPage(ProcessedUserBannerProfile, 10);

            const IncludedRarity: Set<number> = new Set(Object.values(ProcessedUserBannerProfile).map(V => V.Rarity));
            const Filter: StringSelectMenuBuilder = new StringSelectMenuBuilder()
                .setCustomId(InteractionMeta.FilterID)
                .setPlaceholder(`Filter: ${PlaceholderText[FilterType.All]}`)
                .addOptions(
                    ...Object.entries(PlaceholderText)
                        .filter(
                            ([Type,]) =>
                                (IncludedRarity.has(FilterRarity[Type as FilterType]) || Type === FilterType.All) && 
                                Type !== InteractionMeta.CurrentFilter
                        )
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

            const ButtonRow = ConstructButtonRow(
                InteractionMeta.CurrentPage, MaxPage, InteractionMeta.InteractionIDs
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
                    `Page ${InteractionMeta.CurrentPage} / ${MaxPage}`
                )
                .addFields(
                    ...Paginate(FilteredProfile, InteractionMeta.CurrentPage, 10).map(Operator => ({
                        name: Operator.Name,
                        value: `${"★".repeat(Operator.Rarity)} - x${Operator.Count}`,
                        inline: true
                    }))
                )
            ;

            await Interaction.editReply({
                embeds: [Embed],
                components: [ButtonRow, FilterRow],
                allowedMentions: { repliedUser: false }
            });
        }
    )
)
.AddInteractionHandler(
    InteractionTypes.StringMenu,
    "FilterMenu",
    async (Interaction: StringSelectMenuInteraction, Client: Client): Promise<void> => {
        const InteractionMeta: FilterInteractionMeta | undefined = EmbedActionInteractionManager.GetInteraction(
            Interaction.user.id, Interaction.customId
        );

        if(!InteractionMeta)
            return;

        const BannerName: string = InteractionMeta.BannerName;
        const UserID: string = InteractionMeta.UserID;
        const User: User = await Client.users.fetch(UserID);

        await Interaction.deferUpdate();

        InteractionMeta.CurrentFilter = Interaction.values[0] as FilterType;
        const Profile: Profile = Database.Manager.Users.get(UserID)!;
        const ProcessedUserBannerProfile: {
            Name: string;
            Rarity: 3 | 4 | 5 | 6;
            Count: number;
        }[] = await ProcessUserProfile(Profile, BannerName);
        const FilteredProfile: {
            Name: string;
            Rarity: 3 | 4 | 5 | 6;
            Count: number;
        }[] = ProcessedUserBannerProfile.filter(V => {
            switch(InteractionMeta.CurrentFilter) {
                case FilterType.ThreeStars:
                    return V.Rarity === 3;

                case FilterType.FourStars:
                    return V.Rarity === 4;

                case FilterType.FiveStars:
                    return V.Rarity === 5;

                case FilterType.SixStars:
                    return V.Rarity === 6;
                
                case FilterType.All:
                default: return true;
            }
        });

        const IncludedRarity: Set<number> = new Set(Object.values(ProcessedUserBannerProfile).map(V => V.Rarity));
        const Filter: StringSelectMenuBuilder = new StringSelectMenuBuilder()
            .setCustomId(Interaction.customId)
            .setPlaceholder(`Filter: ${PlaceholderText[InteractionMeta.CurrentFilter]}`)
            .addOptions(
                ...Object.entries(PlaceholderText)
                    .filter(
                        ([Type,]) =>
                            (IncludedRarity.has(FilterRarity[Type as FilterType]) || Type === FilterType.All) && 
                            Type !== InteractionMeta.CurrentFilter
                    )
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
        const MaxPage: number = GetMaxPage(FilteredProfile, 10);

        if(InteractionMeta.InteractionIDs && MaxPage > 1) {
            const ButtonRow: ActionRowBuilder<ButtonBuilder> = ConstructButtonRow(
                1,
                MaxPage,
                InteractionMeta.InteractionIDs
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
                    ...Paginate(FilteredProfile, 1, 10).map(Operator => ({
                        name: Operator.Name,
                        value: `${"★".repeat(Operator.Rarity)} - x${Operator.Count}`,
                        inline: true
                    }))
                )
            ;

            await Interaction.editReply({
                embeds: [Embed],
                components: [ButtonRow, FilterRow],
                allowedMentions: { repliedUser: false }
            });
            return;
        }

        const Embed: EmbedBuilder = new EmbedBuilder()
            .setAuthor({
                name: User.username,
                url: `https://discord.com/users/${User.id}`,
                iconURL: User.displayAvatarURL({ size: 256 })
            })
            .setThumbnail(User.displayAvatarURL({ size: 512 }))
            .setTitle(`Banner: ${BannerName}`)
            .setDescription(
                `Total rolls: ${Profile.Profile[BannerName].Count}`
            )
            .addFields(
                ...FilteredProfile.map(Operator => ({
                    name: Operator.Name,
                    value: `${"★".repeat(Operator.Rarity)} - x${Operator.Count}`,
                    inline: true
                }))
            )
        ;

        await Interaction.editReply({
            embeds: [Embed],
            components: [FilterRow],
            allowedMentions: { repliedUser: false }
        });
    }
);