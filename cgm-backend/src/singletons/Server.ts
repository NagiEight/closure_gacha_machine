import Env, { VariableTypes } from "#Env";

Env.RegisterVariable("PORT", { Type: VariableTypes.Number, Default: 3000 })
    .RegisterVariable("RATE_LIMIT", { Type: VariableTypes.Number, Default: 50 })
    .RegisterVariable("PAGE_SIZE", { Type: VariableTypes.Number, Default: 10 })
    .RegisterVariable("DATABASE_MANAGER_FILENAME")
    .RegisterVariable("BASE_MEDIA_URL")
;

export default (await import("express")).default();