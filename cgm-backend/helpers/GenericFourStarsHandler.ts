import type { Banner } from "../types/Banner.js";
import { RateUp } from "../types/RateUp.js";
import crypto from "crypto";

export default (Banner: Banner, RU: RateUp): string => RU === RateUp.Primary && Banner.FourStarsPool.Primary.length
    ? Banner.FourStarsPool.Primary[crypto.randomInt(Banner.FourStarsPool.Primary.length)]
    : Banner.FourStarsPool.Standard[crypto.randomInt(Banner.FourStarsPool.Standard.length)]
;