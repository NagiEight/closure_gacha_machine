import { Client as C, GatewayIntentBits, Events, MessageFlags } from "discord.js";
import type { Command } from "./types/Command.js";
import CommandManager from "./singletons/CommandManager.js";
import LoadEnv from "./singletons/LoadEnv.js";
import ActionCustomIDParser from "./helpers/ActionCustomIDParser.js";

await CommandManager.LoadCommands();

const Client: C = new C({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.DirectMessages
    ]
});

Client.once(Events.ClientReady, Client => console.log(`Logged in as ${Client.user.tag}`));
Client.on(Events.InteractionCreate, async Interaction => {
    if(Interaction.isAutocomplete()) {
        const Command: Command | undefined = CommandManager.Get(Interaction.commandName);
        if(Command && Command.Autocomplete) {
            if(Command.Administrator && !LoadEnv.ADMINISTRATOR_IDS.includes(Interaction.user.id)) 
                return;
            
            await Command.Autocomplete(Interaction, Client);
        }
        return;
    }

    if(Interaction.isButton()) {
        const CustomID = ActionCustomIDParser(Interaction.customId);
        const Command: Command | undefined = CommandManager.Get(CustomID.CommandName);
        if(!Command?.Button) 
            return;

        return await Command.Button(Interaction, Client);
    }

    if(Interaction.isAnySelectMenu()) {
        const CustomID = ActionCustomIDParser(Interaction.customId);
        const Command: Command | undefined = CommandManager.Get(CustomID.CommandName);

        if(!Command)
            return;

        switch(true) {
            case Interaction.isStringSelectMenu():
                if(!Command.StringMenu)
                    return;

                return await Command.StringMenu(Interaction, Client);
            
            case Interaction.isUserSelectMenu():
                if(!Command.UserMenu)
                    return;
                
                return await Command.UserMenu(Interaction, Client);

            case Interaction.isRoleSelectMenu():
                if(!Command.RoleMenu)
                    return;
                
                return await Command.RoleMenu(Interaction, Client);
            
            case Interaction.isChannelSelectMenu():
                if(!Command.ChannelMenu)
                    return;
                
                return await Command.ChannelMenu(Interaction, Client);

            case Interaction.isMentionableSelectMenu():
                if(!Command.MentionableMenu)
                    return;
                
                return await Command.MentionableMenu(Interaction, Client);
            
            default: return;
        }
    }

    if(!Interaction.isChatInputCommand()) 
        return;

    const Command: Command | undefined = CommandManager.Get(Interaction.commandName);
    if(!Command)
        return;
    
    if(Command.Cancelable) {
        const Existing: AbortController | undefined = Command.Cancelable.Pool.get(Interaction.user.id);
        if(Existing) {
            await Interaction.reply({
                content: Command.Cancelable.Message ?? "This command is still running.",
                allowedMentions: { repliedUser: false },
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        
        Command.Cancelable.Pool.set(Interaction.user.id, new AbortController());
    }

    try {
        console.log(`${Interaction.user.id}(${Interaction.user.username}) used ${Interaction.commandName}.`);
        if(Command.Administrator && !LoadEnv.ADMINISTRATOR_IDS.includes(Interaction.user.id)) {
            await Interaction.reply({
                content: "You are not permitted to use this command.",
                allowedMentions: { repliedUser: false },
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        await Command.Action(Interaction, Command.Cancelable?.Pool.get(Interaction.user.id)?.signal, Client);
    }
    catch(Err) {
        console.error(Err);
        if(Interaction.deferred || Interaction.replied) {
            await Interaction.editReply({
                content: "Something went wrong.",
                allowedMentions: { repliedUser: false }
            });
            return;
        }
        await Interaction.reply({
            content: "Something went wrong.",
            allowedMentions: { repliedUser: false },
            flags: MessageFlags.Ephemeral
        });
    }
    finally {
        if(Command.Cancelable) {
            Command.Cancelable.Pool.delete(Interaction.user.id);
        }
    }
});
Client.login(LoadEnv.DISCORD_TOKEN);