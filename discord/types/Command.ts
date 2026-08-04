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
    Autocomplete?: (Interaction: AutocompleteInteraction, Client: Client) => Promise<void>;
    Button?: (Interaction: ButtonInteraction, Client: Client) => Promise<void>;
    StringMenu?: (Interaction: StringSelectMenuInteraction, Client: Client) => Promise<void>;
    UserMenu?: (Interaction: UserSelectMenuInteraction, Client: Client) => Promise<void>;
    RoleMenu?: (Interaction: RoleSelectMenuInteraction, Client: Client) => Promise<void>;
    ChannelMenu?: (Interaction: ChannelSelectMenuInteraction, Client: Client) => Promise<void>;
    MentionableMenu?: (Interaction: MentionableSelectMenuInteraction, Client: Client) => Promise<void>;
    Cancelable?: {
        Pool: Map<string, AbortController>;
        Message?: string;
    };
    Administrator?: boolean;
}