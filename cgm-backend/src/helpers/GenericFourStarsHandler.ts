import type { Banner } from "#types/Banner";
import { RateUp } from "#types/RateUp";
import RandomItem from "./RandomItem.js";

export default (Banner: Banner, RU: RateUp): string => RU === RateUp.Primary && Banner.FourStarsPool.Primary.length
    ? RandomItem(Banner.FourStarsPool.Primary)
    : RandomItem(Banner.FourStarsPool.Standard)
;