import { 
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ChatInputCommandInteraction,
    Client,
    EmbedBuilder,
    MessageFlags,
    SlashCommandBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
    User,
    type SlashCommandOptionsOnlyBuilder
} from "discord.js";
import Database, { type User as Profile } from "../singletons/Database.js";
import ConstructButtonRow, { ButtonType } from "../helpers/ConstructNavigationButtonRow.js";
import Command, { InteractionTypes } from "../types/Command.js";
import ProcessUserProfile from "../helpers/ProcessUserProfile.js";
import Paginate from "../helpers/Paginate.js";
import GetMaxPage from "../helpers/GetMaxPage.js";
import EmbedActionInteractionManager from "../singletons/EmbedActionInteractionManager.js";
import CreateNavigationButtonHandler from "../helpers/CreateNavigationButtonHandler.js";

interface BannerBrowserInteractionMeta {
    UserID: string;
    BannerPickerID: string;
    CurrentPage: number;
    NavigationButtonRowIDs: Record<ButtonType, string>;
}

interface FilterInteractionMeta {
    BannerName: string;
    UserID: string;
    CurrentFilter: FilterType;
    FilterID: string;
    CurrentPage?: number;
    InteractionIDs?: Record<ButtonType, string>;
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

const C: SlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Get the gacha profile of a user.")
    .addUserOption(Option =>
        Option
            .setName("user")
            .setDescription("User to retrive profile.")
            .setRequired(false)
    )
;

export default Command.New(C)
(async (Interaction: ChatInputCommandInteraction): Promise<void> => { 
    const User: User = Interaction.options.getUser("user", false) ?? Interaction.user;
    const UserID: string = User.id;
    const Profile: Profile | undefined = Database.Manager.Users.get(UserID);

    if(!Profile) {
        await Interaction.reply({
            content: "This user doesn't have a gacha profile.",
            allowedMentions: { repliedUser: false },
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    await Interaction.deferReply();

    const Banners = Profile.Profile;
    const MaxPage: number = GetMaxPage(Object.keys(Banners), 10);
    const Owner: string = Interaction.user.id;
    const CommandName: string = Interaction.commandName;
    
    if(MaxPage > 1) {
        const BannerPage = Object.fromEntries(
            Paginate(Object.entries(Banners), 1, 10)
        );

        const InteractionMeta: BannerBrowserInteractionMeta = {
            CurrentPage: 1,
            UserID,
            BannerPickerID: "",
            NavigationButtonRowIDs: {
                [ButtonType.BackwardToStart]: "",
                [ButtonType.Backward]: "",
                [ButtonType.Forward]: "",
                [ButtonType.ForwardToEnd]: ""
            }
        };
        const BackwardToStartID: [string, string] = EmbedActionInteractionManager.AddInteraction(
            Owner,
            CommandName,
            `BannerBrowser${ButtonType.BackwardToStart}`,
            InteractionMeta
        );
        const InteractionIDs: Record<ButtonType, string> = {
            [ButtonType.BackwardToStart]: BackwardToStartID[0],
            [ButtonType.Backward]: EmbedActionInteractionManager.AddInteraction(
                Owner,
                CommandName,
                `BannerBrowser${ButtonType.Backward}`,
                BackwardToStartID[1]
            ),
            [ButtonType.Forward]: EmbedActionInteractionManager.AddInteraction(
                Owner,
                CommandName,
                `BannerBrowser${ButtonType.Forward}`,
                BackwardToStartID[1]
            ),
            [ButtonType.ForwardToEnd]: EmbedActionInteractionManager.AddInteraction(
                Owner,
                CommandName,
                `BannerBrowser${ButtonType.ForwardToEnd}`,
                BackwardToStartID[1]
            )
        };

        InteractionMeta.NavigationButtonRowIDs = InteractionIDs;

        const BannerPickerID: string = EmbedActionInteractionManager.AddInteraction(
            Owner, CommandName, "BannerPickerSelect", BackwardToStartID[1]
        );
        const BannerPicker: StringSelectMenuBuilder = new StringSelectMenuBuilder()
            .setCustomId(BannerPickerID)
            .addOptions(
                Object.keys(BannerPage).map(BannerName => ({
                    label: BannerName,
                    value: BannerName
                }))
            )
            .setMinValues(1)
            .setMaxValues(1)
        ;
        const BannerPickerRow: ActionRowBuilder<StringSelectMenuBuilder> = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(BannerPicker)
        ;
        
        InteractionMeta.BannerPickerID = BannerPickerID;

        const ButtonRow: ActionRowBuilder<ButtonBuilder> = ConstructButtonRow(
            1, 10, InteractionIDs
        );

        const Embed: EmbedBuilder = new EmbedBuilder()
            .setAuthor({
                name: User.username,
                url: `https://discord.com/users/${User.id}`,
                iconURL: User.displayAvatarURL({ size: 256 })
            })
            .setDescription(
                `${User.username} 's banners.\n` +
                `Page 1 / 8`
            )
            .addFields(
                Object.entries(BannerPage).map(([BannerName, Data]) => ({
                    name: BannerName,
                    value: `${Data.Count} rolls`
                }))
            )
        ;

        await Interaction.editReply({
            embeds: [Embed],
            components: [ButtonRow, BannerPickerRow],
            allowedMentions: { repliedUser: false }
        });
        return;
    }

    const BannerPickerID: string = EmbedActionInteractionManager.AddInteraction(
        Owner, CommandName, "BannerPickerSelect"
    );

    const BannerPicker: StringSelectMenuBuilder = new StringSelectMenuBuilder()
        .setCustomId(BannerPickerID)
        .addOptions(
            Object.keys(Banners).map(BannerName => ({
                label: BannerName,
                value: BannerName
            }))
        )
    ;
    const BannerPickerRow: ActionRowBuilder<StringSelectMenuBuilder> = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(BannerPicker)
    ;

    const Embed: EmbedBuilder = new EmbedBuilder()
        .setAuthor({
            name: User.username,
            url: `https://discord.com/users/${User.id}`,
            iconURL: User.displayAvatarURL({ size: 256 })
        })
        .setDescription(
            `${User.username} 's banners.\n` +
            `Page 1 / ${MaxPage}`
        )
        .addFields(
            Object.entries(Banners).map(([BannerName, Data]) => ({
                name: BannerName,
                value: `${Data.Count} rolls`
            }))
        )
    ;

    await Interaction.editReply({
        embeds: [Embed],
        components: [BannerPickerRow],
        allowedMentions: { repliedUser: false }
    });
})
.AddMultipleInteractionHandlers(InteractionTypes.Button)
(CreateNavigationButtonHandler("BannerBrowser")
(async (Interaction: ButtonInteraction, Type: ButtonType, Client: Client): Promise<void> => {
    const InteractionMeta: BannerBrowserInteractionMeta | undefined = EmbedActionInteractionManager.GetInteractionMeta(
        Interaction.user.id,
        Interaction.customId
    );

    if(!InteractionMeta)
        return;

    const User: User = await Client.users.fetch(InteractionMeta.UserID);
    const UserID: string = User.id;
    const Profile: Profile | undefined = Database.Manager.Users.get(UserID)!;

    InteractionMeta.CurrentPage = InteractionMeta.CurrentPage = {
        [ButtonType.BackwardToStart]: 1,
        [ButtonType.Backward]: InteractionMeta.CurrentPage! - 1,
        [ButtonType.Forward]: InteractionMeta.CurrentPage! + 1,
        [ButtonType.ForwardToEnd]: 0
    }[Type];

    await Interaction.deferReply();

    const Banners = Profile.Profile;
    const MaxPage: number = GetMaxPage(Object.keys(Banners), 10);

    const BannerPage = Object.fromEntries(
        Paginate(Object.entries(Banners), 1, 10)
    );

    const BannerPicker: StringSelectMenuBuilder = new StringSelectMenuBuilder()
        .setCustomId(InteractionMeta.BannerPickerID)
        .addOptions(
            Object.keys(BannerPage).map(BannerName => ({
                label: BannerName,
                value: BannerName
            }))
        )
        .setMinValues(1)
        .setMaxValues(1)
    ;
    const BannerPickerRow: ActionRowBuilder<StringSelectMenuBuilder> = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(BannerPicker)
    ;
    
    const ButtonRow: ActionRowBuilder<ButtonBuilder> = ConstructButtonRow(
        1, 10, InteractionMeta.NavigationButtonRowIDs
    );

    const Embed: EmbedBuilder = new EmbedBuilder()
        .setAuthor({
            name: User.username,
            url: `https://discord.com/users/${User.id}`,
            iconURL: User.displayAvatarURL({ size: 256 })
        })
        .setDescription(
            `${User.username} 's banners.\n` +
            `Page ${InteractionMeta.CurrentPage} / ${MaxPage}`
        )
        .addFields(
            Object.entries(BannerPage).map(([BannerName, Data]) => ({
                name: BannerName,
                value: `${Data.Count} rolls`
            }))
        )
    ;

    await Interaction.editReply({
        embeds: [Embed],
        components: [ButtonRow, BannerPickerRow],
        allowedMentions: { repliedUser: false }
    });
    return;
}))
.AddSingleInteractionHandler(InteractionTypes.StringMenu, "BannerPickerSelect")
(async (Interaction: StringSelectMenuInteraction, Client: Client): Promise<void> => {
    const InteractionMeta: BannerBrowserInteractionMeta | undefined = EmbedActionInteractionManager.GetInteractionMeta(
        Interaction.user.id,
        Interaction.customId
    );

    if(!InteractionMeta)
        return;

    const User: User = await Client.users.fetch(InteractionMeta.UserID);
    const BannerName: string = Interaction.values[0];
    const UserID: string = User.id;
    const Profile: Profile | undefined = Database.Manager.Users.get(UserID)!;

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
        CurrentFilter: FilterType.All,
        CurrentPage: 0,
        FilterID: ""
    };
    const FilterID: [string, string] = EmbedActionInteractionManager.AddInteraction(
        Interaction.user.id,
        "profile",
        "ProfileFilter",
        FilterInteractionMeta
    );
    const Filter: StringSelectMenuBuilder = new StringSelectMenuBuilder()
        .setCustomId(FilterID[0])
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

    FilterInteractionMeta.FilterID = FilterID[0];

    if(MaxPage > 1) {
        const Owner: string = Interaction.user.id;
        const CommandName: string = "profile";
        const BackwardToStartID: [string, string] = EmbedActionInteractionManager.AddInteraction(
            Owner,
            CommandName,
            ButtonType.BackwardToStart,
            InteractionMeta
        );
        const InteractionIDs: Record<ButtonType, string> = {
            [ButtonType.BackwardToStart]: BackwardToStartID[0],
            [ButtonType.Backward]: EmbedActionInteractionManager.AddInteraction(
                Owner,
                CommandName,
                ButtonType.Backward,
                BackwardToStartID[1]
            ),
            [ButtonType.Forward]: EmbedActionInteractionManager.AddInteraction(
                Owner,
                CommandName,
                ButtonType.Forward,
                BackwardToStartID[1]
            ),
            [ButtonType.ForwardToEnd]: EmbedActionInteractionManager.AddInteraction(
                Owner,
                CommandName,
                ButtonType.ForwardToEnd,
                BackwardToStartID[1]
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

        FilterInteractionMeta.CurrentPage = 1;
        FilterInteractionMeta.InteractionIDs = InteractionIDs;

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
})
.AddMultipleInteractionHandlers(InteractionTypes.Button)
(CreateNavigationButtonHandler()
(async (Interaction: ButtonInteraction, Type: ButtonType, Client: Client): Promise<void> => {
    const UserID: string = Interaction.user.id;
    const InteractionMeta: FilterInteractionMeta | undefined = EmbedActionInteractionManager.GetInteractionMeta(
        UserID, Interaction.customId
    );

    if(!InteractionMeta)
        return;

    await Interaction.deferUpdate();

    InteractionMeta.CurrentPage = {
        [ButtonType.BackwardToStart]: 1,
        [ButtonType.Backward]: InteractionMeta.CurrentPage! - 1,
        [ButtonType.Forward]: InteractionMeta.CurrentPage! + 1,
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
        InteractionMeta.CurrentPage, MaxPage, InteractionMeta.InteractionIDs!
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
}))
.AddSingleInteractionHandler(InteractionTypes.StringMenu, "FilterMenu")
(async (Interaction: StringSelectMenuInteraction, Client: Client): Promise<void> => {
    const InteractionMeta: FilterInteractionMeta | undefined = EmbedActionInteractionManager.GetInteractionMeta(
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
});