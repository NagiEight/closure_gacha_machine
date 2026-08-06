export default function ActionCustomIDParser(CustomID: string): { CommandName: string; Meta: string[]; Owner: string; };
export default function ActionCustomIDParser<T extends Record<string, unknown>>(
    CustomID: string,
    Container: T
): { CommandName: string; Meta: T; Owner: string; };
export default function ActionCustomIDParser<T extends Record<string, string>>(
    CustomID: string,
    Container?: T
): { CommandName: string; Meta: T; Owner: string; } | { CommandName: string; Meta: string[]; Owner: string; } {
    const [CommandName, MetaString, Owner] = CustomID.split(":");
    const MetaArr: string[] = MetaString.split("/");
    
    if(Container) {
        const Meta: T = {} as T;

        Object.keys(Container).forEach((key, i) => {
            (Meta as any)[key] = MetaArr[i];
        });
        return { CommandName, Meta, Owner };
    }

    return { CommandName, Meta: MetaArr, Owner }
}