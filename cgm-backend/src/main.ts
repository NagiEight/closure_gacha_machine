import type { RateLimitRequestHandler } from "express-rate-limit";
import Server from "#Server";
import LoadPath from "#helpers/LoadPath";
import rateLimit from "express-rate-limit";
import express from "express";
import Env from "commaenv";

const Limiter: RateLimitRequestHandler = rateLimit({
    windowMs: 1000,
    limit: Env.GetVariable("RATE_LIMIT"),
    message: {
        error: "Too many requests, please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false
});
Server.use(Limiter, express.json());

await LoadPath();

process.on("SIGINT", () => process.exit());
Server.listen(Env.GetVariable("PORT"), "0.0.0.0", (): void => console.log(`Server is running on port ${Env.GetVariable("PORT")}.`));