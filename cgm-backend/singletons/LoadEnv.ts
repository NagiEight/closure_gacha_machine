import dotenv from "dotenv";

dotenv.config();

export default {
    PAGE_SIZE: /^\+?\d+$/.test(process.env.PAGE_SIZE ?? "") ? Number(process.env.PAGE_SIZE) : 10,
    PORT: /^\+?\d+$/.test(process.env.PORT ?? "") ? Number(process.env.PORT) : 3000,
    BASE_MEDIA_URL: process.env.BASE_MEDIA_URL ?? ""
};