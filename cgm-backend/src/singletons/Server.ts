import Env from "commaenv";
import "dotenv/config";

Env.RegisterVariable("PORT", Env.number().Integer().Positive().Default(3000))
    .RegisterVariable("RATE_LIMIT", Env.number().Integer().Positive().Default(50))
    .RegisterVariable("PAGE_SIZE", Env.number().Integer().Positive().Default(10))
    .RegisterVariable("HOST_NAME", Env.string().Default("localhost"))
    .RegisterVariable("DATABASE_MANAGER_FILENAME")
    .RegisterVariable("BASE_MEDIA_URL")
;

export default (await import("express")).default();