import type { Banner } from "#types/Banner";
import { RateUp } from "#types/RateUp";
import crypto from "crypto";

export default (Banner: Banner, RU: RateUp): string => RU === RateUp.Primary
    ? Banner.FiveStarsPool.Primary[crypto.randomInt(Banner.FiveStarsPool.Primary.length)]
    : Banner.FiveStarsPool.Standard[crypto.randomInt(Banner.FiveStarsPool.Standard.length)]
;