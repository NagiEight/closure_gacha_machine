import RateUp from "#types/RateUp";
import RandomItem from "#helpers/RandomItem";
export default (Banner, RU) => RU === RateUp.Primary && Banner.FourStarsPool.Primary.length
    ? RandomItem(Banner.FourStarsPool.Primary)
    : RandomItem(Banner.FourStarsPool.Standard);
