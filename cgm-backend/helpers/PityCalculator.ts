import type { GachaItems } from "./Gacha.js";

const PityCalculator = <T>(Rates: GachaItems<T>[], Target: T, Increase: number): GachaItems<T>[] => {
    const TargetItem: GachaItems<T> = Rates.find(Item => Item.Value === Target)!;
    const OldTargetChance: number = TargetItem.Chance;
    const RemainingBefore: number = 100 - OldTargetChance;
    const RemainingAfter: number = 100 - (OldTargetChance + Increase);
    const Scale: number = RemainingAfter / RemainingBefore;

    return Rates.map(Rate => Rate.Value === Target
        ? { ...Rate, Chance: Rate.Chance + Increase }
        : { ...Rate, Chance: Rate.Chance * Scale }
    );
};

export default PityCalculator;