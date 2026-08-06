import { 
    ActionRowBuilder,
    AutocompleteInteraction,
    ButtonBuilder,
    ButtonInteraction,
    ChatInputCommandInteraction,
    Client,
    EmbedBuilder,
    SlashCommandBuilder,
    User
} from "discord.js";
import type { Command } from "../types/Command.js";
import Database, { type User as Profile } from "../singletons/Database.js";
import ConstructButtonRow from "../helpers/ConstructButtonRow.js";
import SendMessage from "../helpers/SendMessage.js";
import ProcessUserProfile from "../helpers/ProcessUserProfile.js";
import Paginate from "../helpers/Paginate.js";
import GetMaxPage from "../helpers/GetMaxPage.js";

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

        if(!Profile) 
            return await SendMessage(Interaction, "You don't have a gacha profile.");
        
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
                
        const ButtonRow: ActionRowBuilder<ButtonBuilder> = ConstructButtonRow(
            "profile",
            1,
            MaxPage,
            [BannerName, User.id],
            Interaction.user.id
        );
        
        await SendMessage(Interaction, [Embed], MaxPage > 1 ? [ButtonRow] : []);
    },
    Button: async (Interaction: ButtonInteraction, Client: Client): Promise<void> => {
        const [, ActionMeta, Owner]: string[] = Interaction.customId.split(":");
        
        if(Interaction.user.id !== Owner)
            return;
        
        const [ActionName, Page, BannerName, UserID]: string[] = ActionMeta.split("/");
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

        const ButtonRow: ActionRowBuilder<ButtonBuilder> = ConstructButtonRow(
            "profile",
            NextPage,
            MaxPage,
            [BannerName, User.id],
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
            .setDescription(`Total rolls: ${Profile.Profile[BannerName].Count}`)
            .addFields(
                ...Paginate(ProcessedUserBannerProfile, NextPage, 10).map(Operator => ({
                    name: Operator.Name,
                    value: `${"★".repeat(Operator.Rarity)} - ${Operator.Count} Cop${Operator.Count > 1 ? "ies" : "y"}`
                }))
            )
        ;

        await SendMessage(Interaction, [Embed], MaxPage > 1 ? [ButtonRow] : []);
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