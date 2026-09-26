import type { RateLimitRequestHandler } from "express-rate-limit";
import Server from "#Server";
import LoadEnv from "#LoadEnv";
import LoadPath from "#helpers/LoadPath";
import rateLimit from "express-rate-limit";
import express from "express";

const Limiter: RateLimitRequestHandler = rateLimit({
    windowMs: 1000,
    limit: LoadEnv.RATE_LIMIT,
    message: {
        error: "Too many requests, please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false
});

Server.use(Limiter, express.json());

await LoadPath();

Server.listen(LoadEnv.PORT, "0.0.0.0", (): void => console.log(`Server is running on port ${LoadEnv.PORT}.`));