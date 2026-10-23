import { intersection, isArray, isBoolean, isFunction, isNullish, isString, keys, values } from 'remeda';

import {
    GimmickRegistry,
    type GimmickSpecs,
    type GimmickWriteDetailsField,
    type GimmickWriteDetailsSpecType
} from '@/utils/registry.ts';
import { Numbers } from '@/utils/numbers.ts';
import { Enums } from '@/utils/enums.ts';

import type { Gimmick, GimmickEffectType } from '@/types/gimmicks.ts';
import type { GimmickIssues } from '@/types/validation.ts';
import type { Nullable } from '@/types/utils.ts';
import type { GimmickType } from '@/types/enums.ts';

const ALL_TARGETS = [
    ...Enums.types,
    ...Enums.classes,
    ...Enums.positions,
    ...values(Enums.tags).flat()
];

const DYNAMIC_REGISTRY = GimmickRegistry as unknown as Record<GimmickType, { fields?: AnyGimmickFields }>;

/*-----
  Types
  -----*/

type AnyGimmickFields = Record<string, GimmickWriteDetailsField<Partial<Gimmick>>>;

/*-------
  Exports
  -------*/

export const Gimmicks = {

    getGimmickData<T extends GimmickEffectType>(type: T): GimmickRegistry[T] {
        return GimmickRegistry[type];
    },

    getGimmickLabel<T extends GimmickEffectType>(gimmick: Nullable<GimmickSpecs<T>>): Nullable<string> {
        if (!gimmick) return null;
        const data = Gimmicks.getGimmickData(gimmick.type);
        if (isString(data.label)) return data.label;
        if (isFunction(data.label)) return data.label(gimmick);
        return null;
    },

    getGimmickIcon<T extends GimmickEffectType>(gimmick: Nullable<GimmickSpecs<T>>): Nullable<string> {
        if (!gimmick) return null;
        const data = Gimmicks.getGimmickData(gimmick.type);
        if (isString(data.icon)) return data.icon;
        if (isFunction(data.icon)) return data.icon(gimmick);
        return null;
    },

    getGimmickDetails<T extends GimmickEffectType>(gimmick: Nullable<GimmickSpecs<T>>): Nullable<string[]> {
        if (!gimmick) return null;
        const data = Gimmicks.getGimmickData(gimmick.type);
        if (isFunction(data.details)) return data.details(gimmick).filter(s => !isNullish(s));
        return null;
    },

    getGimmickLines<T extends GimmickEffectType>(gimmick: Nullable<GimmickSpecs<T>>): Nullable<string[]> {
        if (!gimmick) return null;
        const data = Gimmicks.getGimmickData(gimmick.type);
        if (isFunction(data.lines)) return data.lines(gimmick).filter(s => !isNullish(s));
        return null;
    },

    getGimmickFields(type: Nullable<GimmickType>): Nullable<AnyGimmickFields> {
        return (type ? DYNAMIC_REGISTRY[type].fields : null) ?? null;
    },

    getGimmickField(type: Nullable<GimmickType>,
                    field: string): Nullable<GimmickWriteDetailsField<Partial<Gimmick>>> {
        return (type ? DYNAMIC_REGISTRY[type].fields?.[field] : null) ?? null;
    },

    getGimmickFieldNames(type: Nullable<GimmickType>): string[] {
        const fields = (type ? DYNAMIC_REGISTRY[type].fields : null);
        return fields ? Object.keys(fields) : [ ];
    },

    sanitizeGimmick(gimmick: Nullable<Gimmick>): Nullable<Gimmick> {

        if (isNullish(gimmick))
            return null;

        const draft = gimmick as Record<string, unknown>;
        const details = Gimmicks.getGimmickData(gimmick.type);

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

    validateGimmick<K extends GimmickEffectType>(gimmick: Nullable<GimmickSpecs<K>>): GimmickIssues {

        if (!gimmick)
            return [ 'Null or undefined gimmick' ];

        const data = Gimmicks.getGimmickData(gimmick.type);
        if (!data)
            return [ 'Invalid gimmick type' ];

        const result = [ ];
        if (!gimmick.activation || !Enums.activations.includes(gimmick.activation))
            result.push('Invalid activation');
        if (data.turns !== false && !Numbers.isPositiveInteger(gimmick.turns))
            result.push('Invalid number turns');
        if (gimmick.activation === 'interruption' && (!gimmick.triggers?.length || intersection(Enums.interruptions, gimmick.triggers).length !== gimmick.triggers?.length))
            result.push('Invalid interruption trigger');
        if (gimmick.activation === 'interruption' && !Numbers.isPositiveInteger(gimmick.times))
            result.push('Invalid interruption times');
        for (const key in Gimmicks.getGimmickFieldNames(gimmick.type)) {
            const draft = gimmick as Record<string, unknown>;
            const value = draft[key];
            const field = Gimmicks.getGimmickField(gimmick.type, key)!;
            if (field.required && (isNullish(value) || value === ''))
                result.push(`Missing field "${ key }"`);
            else if (value && !FIELD_VALIDATION[field.type](value))
                result.push(`Invalid value "${ isArray(value) ? value.join(', ') : value }" for field "${ key }"`);
        }
        if (data.validate && !data.validate(gimmick))
            result.push('Gimmick does not pass validation');

        return result;

    }

};

/*---------
  Internals
  ---------*/

const FIELD_VALIDATION: Record<GimmickWriteDetailsSpecType, (v: unknown) => boolean> = {
    boolean: v => isBoolean(v),
    class: v => includesString(Enums.classes, v),
    immunity: v => includesString(Enums.immunities, v),
    integer: v => Numbers.isPositiveInteger(v),
    intimidation: v => isArray(v) && v.every(v => includesString(Enums.intimidations, v)),
    multiplier: v => Numbers.isPositive(v),
    percentage: v => Numbers.isPositive(v),
    position: v => includesString(Enums.positions, v),
    removableEffect: value => includesString(Enums.removableEffects, value),
    slot: v => includesString(Enums.slots, v),
    slots: v => isArray(v) && v.every(v => includesString(Enums.slots, v)),
    targets: v => isArray(v) && v.every(v => includesString(ALL_TARGETS, v)),
    timing: v => includesString(Enums.timings, v)
};

function includesString(values: readonly string[],
                        value: unknown): boolean {
    return isString(value) && values.includes(value);
}
