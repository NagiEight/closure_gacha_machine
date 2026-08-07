import { EventEmitter } from "stream";
import GenerateUniqueUUID from "../helpers/GenerateUniqueUUID.js";
import LoadEnv from "./LoadEnv.js";

export interface Action {
    CommandName: string;
    ActionName: string;
    Data: any;
    Timeout: NodeJS.Timeout;
};

interface Registry {
    [UserID: string]: {
        // assert type before usage
        [InteractionUUID: string]: Action;
    };
}
export default new class extends EventEmitter {
    public readonly Registry: Registry = {};

    public GetInteraction<T>(UserID: string, InteractionID: string): T | undefined {
        return this.Registry[UserID][InteractionID]?.Data;
    }

    public AddInteraction(UserID: string, CommandName: string, ActionName: string, Data: any): string {
        this.Registry[UserID] ??= {};

        const InteractionID: string = GenerateUniqueUUID(UUID => !!this.Registry[UserID][UUID]);
        this.Registry[UserID][InteractionID] = {
            CommandName,
            ActionName,
            Data,
            Timeout: setTimeout((): void => {
                this.emit("LifeTimeEnded", InteractionID);
                delete this.Registry[UserID][InteractionID];

                if(Object.keys(this.Registry[UserID]).length === 0)
                    delete this.Registry[UserID];
                
            }, LoadEnv.EMBED_EXPIRY_DURATION * 1000)
        };

        return InteractionID;
    }
}();