import type { Banner } from "@Banner";
import RateUp from "@RateUp";
import RandomItem from "@RandomItem";

export default (Banner: Banner, RU: RateUp): string => RU === RateUp.Primary && Banner.FourStarsPool.Primary.length
    ? RandomItem(Banner.FourStarsPool.Primary)
    : RandomItem(Banner.FourStarsPool.Standard)
;