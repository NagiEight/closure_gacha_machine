import type { Banner } from "@Banner";
import RateUp from "@RateUp";
import RandomItem from "@RandomItem";

export default (Banner: Banner, RU: RateUp): string => RU === RateUp.Primary
    ? RandomItem(Banner.FiveStarsPool.Primary)
    : RandomItem(Banner.FiveStarsPool.Standard)
;