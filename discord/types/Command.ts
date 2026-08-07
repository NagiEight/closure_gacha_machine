import { 
    AutocompleteInteraction,
    ButtonInteraction,
    ChannelSelectMenuInteraction,
    ChatInputCommandInteraction,
    Client,
    MentionableSelectMenuInteraction,
    RoleSelectMenuInteraction,
    SlashCommandBuilder,
    StringSelectMenuInteraction,
    UserSelectMenuInteraction,
    type SlashCommandOptionsOnlyBuilder
} from "discord.js";

export interface Command {
    Command: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
    Action: (Interaction: ChatInputCommandInteraction, Signal?: AbortSignal, Client?: Client) => Promise<void>;
    Autocomplete?: {
        [OptionName: string]: (Interaction: AutocompleteInteraction, Client: Client) => Promise<void>;
    };
    Button?: {
        [ActionName: string]: (Interaction: ButtonInteraction, Client: Client) => Promise<void>;
    };
    StringMenu?: {
        [ActionName: string]: (Interaction: StringSelectMenuInteraction, Client: Client) => Promise<void>;
    };
    UserMenu?: {
        [ActionName: string]: (Interaction: UserSelectMenuInteraction, Client: Client) => Promise<void>;
    };
    RoleMenu?: {
        [ActionName: string]: (Interaction: RoleSelectMenuInteraction, Client: Client) => Promise<void>;
    };
    ChannelMenu?: {
        [ActionName: string]: (Interaction: ChannelSelectMenuInteraction, Client: Client) => Promise<void>;
    };
    MentionableMenu?: {
        [ActionName: string]: (Interaction: MentionableSelectMenuInteraction, Client: Client) => Promise<void>;
    };
    Cancelable?: {
        Pool: Map<string, AbortController>;
        Message?: string;
    };
    Administrator?: boolean;
}