import RateUp from "#types/RateUp";
import RandomItem from "#helpers/RandomItem";
export default (Banner, RU) => RU === RateUp.Primary
    ? RandomItem(Banner.FiveStarsPool.Primary)
    : RandomItem(Banner.FiveStarsPool.Standard);
