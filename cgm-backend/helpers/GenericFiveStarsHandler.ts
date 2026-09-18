import type { Banner } from "#types/Banner";
import { RateUp } from "#types/RateUp";
import RandomItem from "#helpers/RandomItem";

export default (Banner: Banner, RU: RateUp): string => RU === RateUp.Primary
    ? RandomItem(Banner.FiveStarsPool.Primary)
    : RandomItem(Banner.FiveStarsPool.Standard)
;