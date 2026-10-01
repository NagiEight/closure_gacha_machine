import Env from "#Env";

Env.RegisterVariable("PORT", "number", 3000)
    .RegisterVariable("RATE_LIMIT", "number", 50)
    .RegisterVariable("PAGE_SIZE", "number", 10)
    .RegisterVariable("DATABASE_MANAGER_FILENAME")
    .RegisterVariable("BASE_MEDIA_URL")
;

export default (await import("express")).default();