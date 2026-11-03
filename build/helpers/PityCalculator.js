/**
 * Calculate the gacha pity and proportionally decrease the chance of other items.
 */
export default (Rates, Target, Increase) => {
    const TargetItem = Rates.find(Item => Item.Value === Target);
    const OldTargetChance = TargetItem.Chance;
    const RemainingBefore = 100 - OldTargetChance;
    const RemainingAfter = 100 - (OldTargetChance + Increase);
    const Scale = RemainingAfter / RemainingBefore;
    return Rates.map(Rate => Rate.Value === Target
        ? { ...Rate, Chance: Rate.Chance + Increase }
        : { ...Rate, Chance: Rate.Chance * Scale });
};
