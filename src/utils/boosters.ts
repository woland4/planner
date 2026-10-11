import { isNullish } from 'remeda';

import type { Booster } from '@/types/battles.ts';
import type { Nullable } from '@/types/utils.ts';
import { Numbers } from '@/utils/numbers.ts';
import type { BoosterIssues } from '@/types/validation.ts';

export const Boosters = {

    sanitizeBooster(booster: Nullable<Booster>): Booster {

        if (isNullish(booster))
            return { ids: [ ] };

        booster.ids = booster.ids.filter(Numbers.isPositiveInteger);

        if (!Numbers.isPositive(booster.additiveMultiplier))
            delete booster.additiveMultiplier;
        if (!Numbers.isPositive(booster.pureMultiplier))
            delete booster.pureMultiplier;

        return booster;

    },

    validateBooster(booster: Nullable<Booster>): BoosterIssues {

        if (isNullish(booster))
            return [ 'Null or undefined booster group' ];

        const result = [ ];

        if (Numbers.isPositive(booster.pureMultiplier) && Numbers.isPositive(booster.additiveMultiplier))
            result.push('Can\'t have multiple types of multipliers');

        if (!booster.ids?.length)
            result.push('Empty booster group');

        return result;

    }

}
