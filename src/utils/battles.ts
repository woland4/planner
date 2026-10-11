import { isArray, isNullish } from 'remeda';

import { Boosters } from '@/utils/boosters.ts';
import { Stages } from '@/utils/stages.ts';
import { Numbers } from '@/utils/numbers.ts';

import type { Battle, Booster, TeamUnit } from '@/types/battles.ts';
import type { BattleIssues } from '@/types/validation.ts';
import type { Nullable } from '@/types/utils.ts';

export const Battles = {

    getBoost(unitID: Nullable<number>,
             boosters: Nullable<Booster[]>): Nullable<number> {
        if (!unitID || !boosters?.length) return null;
        const data = boosters.find(b => b.ids.includes(unitID));
        return (data?.pureMultiplier ?? data?.additiveMultiplier ?? null);
    },

    getOverallBoost(units: Nullable<Nullable<TeamUnit>[]>,
                    boosters: Nullable<Booster[]>): Nullable<number> {

        if (!units?.length || !boosters?.length) return null;

        const candidates = units
            .map(u => boosters.find(b => b.ids.includes(u?.id ?? -1)))
            .filter(b => !isNullish(b));
        if (!candidates?.length) return null;

        const hasPure = candidates.some(c => Numbers.isPositive(c.pureMultiplier));
        const hasAdditive = candidates.some(c => Numbers.isPositive(c.additiveMultiplier));
        if (!hasPure && !hasAdditive) return null;

        return candidates.reduce((multiplier, candidate) => {
            if (candidate.pureMultiplier) return multiplier * candidate.pureMultiplier;
            else return multiplier + candidate.additiveMultiplier!!;
        }, hasPure ? 1 : 0);
    },

    sanitizeBattle(battle: Nullable<Battle>): Battle {

        if (isNullish(battle))
            return { stages: [ ], boosters: [ ] };

        if (!isArray(battle.stages)) battle.stages = [ ];
        else battle.stages = battle.stages.map(Stages.sanitizeStage);

        if (!isArray(battle.boosters)) battle.boosters = [ ];
        else battle.boosters = battle.boosters.map(Boosters.sanitizeBooster);

        return battle;

    },

    validateBattle(battle: Nullable<Battle>): BattleIssues {

        if (isNullish(battle))
            return [ 'Null or undefined battle' ];

        return [ ];

    }

}
