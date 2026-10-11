import { intersection, isNullish, keys, values } from 'remeda';

import { type GimmickDetails, GimmickRegistry } from '@/utils/registry.ts';
import { Numbers } from '@/utils/numbers.ts';
import { Enums } from '@/utils/enums.ts';

import type { Gimmick, GimmickEffectType } from '@/types/gimmicks.ts';
import type { Nullable } from '@/types/utils.ts';
import type { GimmickIssues } from '@/types/validation.ts';

const allTargets = [
    ...Enums.types,
    ...Enums.classes,
    ...Enums.positions,
    ...values(Enums.tags).flat()
];

/*-------
  Exports
  -------*/

export const Gimmicks = {

    getGimmickDetails(type: Nullable<GimmickEffectType>) {
        return type ? GimmickRegistry[type] as unknown as GimmickDetails<any> : null;
    },

    sanitizeGimmick(gimmick: Nullable<Gimmick>): Nullable<Gimmick> {

        if (isNullish(gimmick))
            return null;

        const draft = gimmick as Record<string, any>;
        const details = Gimmicks.getGimmickDetails(gimmick.type);

        // Remove unnecessary keys
        if (gimmick.activation !== 'interruption') {
            delete gimmick.triggers;
            delete gimmick.times;
        }
        if (details?.turns === false)
            delete gimmick.turns;

        // Add sensible defaults
        if (details && details.turns !== false && details.usuallyPermanent && isNullish(gimmick.turns))
            gimmick.turns = 99;

        // Make sure array fields are initialized
        if (details && details?.fields) {
            if (gimmick.activation === 'interruption' && !gimmick.triggers?.length)
                gimmick.triggers = [ ];
            for (const key in details.fields) {
                if ((key === 'slots' || key === 'targets' || key === 'intimidation') && !draft[key])
                    draft[key] = [ ];
            }
        }

        // Remove extraneous fields
        if (details) {
            const supportedKeys = keys(details.fields ?? { }) as string[];
            for (const key in draft) {
                if (key === 'type' || key === 'activation' || key === 'interruption' || key === 'turns')
                    continue;
                if (!supportedKeys.includes(key))
                    delete draft[key];
            }
        }

        return gimmick;

    },

    validateGimmick(gimmick: Nullable<Gimmick>): GimmickIssues {

        if (isNullish(gimmick))
            return [ 'Null or undefined gimmick' ];

        const details = Gimmicks.getGimmickDetails(gimmick.type);
        if (!details)
            return [ 'Invalid gimmick type' ];

        const draft = gimmick as Record<string, any>;
        const result = [ ];
        if (!gimmick.activation || !Enums.activations.includes(gimmick.activation))
            result.push('Invalid activation');
        if (details.turns !== false && !Numbers.isPositiveInteger(gimmick.turns))
            result.push('Invalid number turns');
        if (gimmick.activation === 'interruption' && (!gimmick.triggers?.length || intersection(Enums.interruptions, gimmick.triggers).length !== gimmick.triggers?.length))
            result.push('Invalid interruption trigger');
        if (gimmick.activation === 'interruption' && !Numbers.isPositiveInteger(gimmick.times))
            result.push('Invalid interruption times');
        if (details.fields) {
            for (const key in details.fields) {
                const value = draft[key];
                const field = details.fields[key] as any;
                if (field.required && (isNullish(value) || value === ''))
                    result.push(`Missing field "${ key }"`);
                else if (value) {
                    if ((field.type === 'class' && !Enums.classes.includes(value)) ||
                        (field.type === 'integer' && !Numbers.isPositiveInteger(value)) ||
                        (field.type === 'intimidation' && intersection(Enums.intimidations, value).length !== value.length) ||
                        (field.type === 'multiplier' && !Numbers.isPositive(value)) ||
                        (field.type === 'percentage' && !Numbers.isPositive(value)) ||
                        (field.type === 'position' && !Enums.positions.includes(value)) ||
                        (field.type === 'slot' && !Enums.slots.includes(value)) ||
                        (field.type === 'slots' && intersection(value, Enums.slots).length !== value.length) ||
                        (field.type === 'targets' && intersection(value, allTargets).length !== value.length) ||
                        (field.type === 'timing' && !Enums.timings.includes(value))) {
                        result.push(`Invalid value "${ value?.join?.(', ') ?? value }" for field "${ key }"`);
                    }
                }
            }
        }
        if (details.validate && !details.validate(gimmick))
            result.push('Gimmick does not pass validation');

        return result;

    }

}
