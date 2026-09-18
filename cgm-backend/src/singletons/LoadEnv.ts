import dotenv from "dotenv";

dotenv.config();

const ParseNumber = (Env?: string, Default: number = -1): number => Number(Env) || Default;

export default {
    PAGE_SIZE: ParseNumber(process.env.PAGE_SIZE, 10),
    PORT: ParseNumber(process.env.PORT, 3000),
    RATE_LIMIT: ParseNumber(process.env.RATE_LIMIT, 50),
    BASE_MEDIA_URL: process.env.BASE_MEDIA_URL ?? ""
};