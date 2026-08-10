import EventEmitter from "events";
import GenerateUniqueUUID from "../helpers/GenerateUniqueUUID.js";
import LoadEnv from "./LoadEnv.js";

export interface Action {
    CommandName: string;
    ActionName: string;
    MetaID?: string;
    Timeout: NodeJS.Timeout;
};

interface Registry {
    [UserID: string]: {
        // assert type before usage
        [InteractionUUID: string]: Action;
    };
}

interface MetaRegistry {
    [MetaID: string]: any;
}

export default new class extends EventEmitter {
    public readonly InteractionRegistry: Registry = {};
    public readonly MetaRegistry: MetaRegistry = {};

    public GetInteractionMeta<T>(Owner: string, InteractionID: string): T | undefined {
        const MetaID: string | undefined = this.InteractionRegistry[Owner][InteractionID].MetaID;
        if(!MetaID)
            return;
        return this.MetaRegistry[MetaID];
    }

    public AddInteraction(Owner: string, CommandName: string, ActionName: string): string; 
    public AddInteraction(Owner: string, CommandName: string, ActionName: string, MetaID: string): string;
    public AddInteraction(Owner: string, CommandName: string, ActionName: string, Meta?: any): [string, string];
    /**
     * [InteractionID, MetaID]
     */
    public AddInteraction(Owner: string, CommandName: string, ActionName: string, Meta?: any): [string, string] | string {
        this.InteractionRegistry[Owner] ??= {};
        const InteractionID: string = GenerateUniqueUUID(UUID => !!this.InteractionRegistry[Owner][UUID]);

        if(typeof Meta === "string" && this.MetaRegistry[Meta]) {
            this.InteractionRegistry[Owner][InteractionID] = {
                CommandName,
                ActionName,
                MetaID: Meta,
                Timeout: setTimeout((): void => {
                    this.emit("LifeTimeEnded", InteractionID);
                    delete this.InteractionRegistry[Owner][InteractionID];
                    delete this.MetaRegistry[Meta];
    
                    if(Object.keys(this.InteractionRegistry[Owner]).length === 0) {
                        delete this.InteractionRegistry[Owner];
                    }
                }, LoadEnv.EMBED_EXPIRY_DURATION * 1000)
            };
            return InteractionID;
        }

        if(Meta) {
            const MetaID: string = GenerateUniqueUUID(UUID => !!this.MetaRegistry[UUID]);
                this.InteractionRegistry[Owner][InteractionID] = {
                CommandName,
                ActionName,
                MetaID,
                Timeout: setTimeout((): void => {
                    this.emit("LifeTimeEnded", InteractionID);
                    delete this.InteractionRegistry[Owner][InteractionID];
                    delete this.MetaRegistry[MetaID];

                    if(Object.keys(this.InteractionRegistry[Owner]).length === 0) {
                        delete this.InteractionRegistry[Owner];
                    }
                }, LoadEnv.EMBED_EXPIRY_DURATION * 1000)
            };
            this.MetaRegistry[MetaID] = Meta;
            return [InteractionID, MetaID];
        }

        this.InteractionRegistry[Owner][InteractionID] = {
            CommandName,
            ActionName,
            Timeout: setTimeout((): void => {
                this.emit("LifeTimeEnded", InteractionID);
                delete this.InteractionRegistry[Owner][InteractionID];

                if(Object.keys(this.InteractionRegistry[Owner]).length === 0) {
                    delete this.InteractionRegistry[Owner];
                }
            }, LoadEnv.EMBED_EXPIRY_DURATION * 1000)
        };

        return InteractionID;
    }

    public RemoveInteraction(Owner: string, InteractionID: string): void {
        if(!this.InteractionRegistry[Owner])
            return;

        if(!this.InteractionRegistry[Owner][InteractionID])
            return;

        clearTimeout(this.InteractionRegistry[Owner][InteractionID]?.Timeout);
        delete this.InteractionRegistry[Owner][InteractionID];
        if(Object.keys(this.InteractionRegistry[Owner]).length === 0) {
            delete this.InteractionRegistry[Owner];
        }
    }

    public RefreshInteraction(Owner: string, InteractionID: string): void {
        if(!this.InteractionRegistry[Owner])
            return;

        if(!this.InteractionRegistry[Owner][InteractionID])
            return;

        clearTimeout(this.InteractionRegistry[Owner][InteractionID].Timeout);
        this.InteractionRegistry[Owner][InteractionID].Timeout = setTimeout((): void => {
            this.emit("LifeTimeEnded", InteractionID);
            delete this.InteractionRegistry[Owner][InteractionID];

            if(Object.keys(this.InteractionRegistry[Owner]).length === 0) {
                delete this.InteractionRegistry[Owner];
            }
        }, LoadEnv.EMBED_EXPIRY_DURATION * 1000);
    }
}();