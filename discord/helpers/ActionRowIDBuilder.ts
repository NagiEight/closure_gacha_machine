export default (CommandName: string, ActionMeta: string[], Owner: string): `${string}:${string}:${string}` => 
    `${CommandName}:${ActionMeta.join("/")}:${Owner}`
;