import type { Banner } from "../types/Banner.js";
import { RateUp } from "../types/RateUp.js";
import crypto from "crypto";

export default (Banner: Banner, RU: RateUp): string => RU === RateUp.Primary
    ? Banner.FiveStarsPool.Primary[crypto.randomInt(Banner.FiveStarsPool.Primary.length)]
    : Banner.FiveStarsPool.Standard[crypto.randomInt(Banner.FiveStarsPool.Standard.length)]
;