import { isArray, isNullish, isNumber, isPlainObject, isString, unique } from 'remeda';

import { Criteria } from '@/utils/criteria.ts';
import { IS_DEV } from '@/utils/debug.ts';

import type { Nullable } from '@/types/utils.ts';
import type { Class, Type } from '@/types/enums.ts';

/*---------
  Constants
  ---------*/

const IMAGE_BASE = (IS_DEV ? 'http://localhost/optc' : 'https://2Shankz.github.io/optc-db.github.io');

const IGNORED_SUPPORT_REGEXES = [
    /reduces damage received from [^.]+ by [\d.]%\./i,
    /adds [\d.]+% of this character's base [a-z\s,]+ to the supported character's base [a-z\s,]+\./i,
];

/*-----
  Types
  -----*/

export type Captain = {
    base: string;
    combined?: string;
};

export type Special = {
    base: BaseSpecial | BaseSpecial[]; // Array is for multi-stage specials
    combined?: BaseSpecial | BaseSpecial[];  // Array is for multi-stage specials
};

export type BaseSpecial = {
    cooldown?: Nullable<number>;
    description: string;
};

export type Swap = {
    base: string;
    super?: Nullable<string>;
    superTurns?: Nullable<number>;
};

export type SuperSpecialOrSupport = {
    base: string;
    criteria: string;
};

type DbSpecial = {
    cooldown: number[];
    description: string;
};

/*-------
  Exports
  -------*/

export const Units = {

    getCaptain(unitID: Nullable<number | string>,
               variant: Nullable<number> = null,
               assumeLLB: boolean = false): Nullable<Captain> {

        if (!unitID) return null;

        const data = window.details[unitID];
        if (!data?.captain) return null;

        const key = variant === 1 ? 'character1' : variant === 2 ? 'character2' : 'base';
        const llb = (assumeLLB ? getLimitBreak(unitID, 'captain') : null);

        if (isString(data?.captain))
            return { base: llb?.[key] ?? data.captain };
        else if (!isPlainObject(data?.captain))
            return null;

        const result: Partial<Captain> = { };

        const captain = llb?.[key] ?? data.captain[key];
        if (captain) {
            result.base = captain;
            const combined = llb?.combined ?? data.captain.combined;
            if (key !== 'base' && combined) result.combined = combined;
        }

        return (result.base ? result as Captain : null);

    },

    getCost(unitID: Nullable<number | string>,
            variant: Nullable<number> = null): Nullable<number> {
        if (!unitID) return null;
        const fullID = (variant ? `${ unitID }-${ variant }` : unitID);
        const data = window.units[fullID] ?? window.units[unitID];
        return data?.cost ?? null;
    },

    getClasses(unitID: Nullable<number | string>,
               variant: Nullable<number> = null): Class[] {
        if (!unitID) return [ ];
        const fullID = (variant ? `${ unitID }-${ variant }` : unitID);
        const data = window.units[fullID] ?? window.units[unitID];
        if (isString(data?.class))
            return [ data.class ] as Class[];
        else if (isArray(data?.class))
            return data.class as Class[];
        else if (window.units[unitID + '-1']) {
            const class1 = (window.units[unitID + '-1']?.class ?? [ ]);
            const class2 = (window.units[unitID + '-2']?.class ?? [ ]);
            return unique([
                (isArray(class1) ? class1 : [ class1 ]),
                (isArray(class2) ? class2 : [ class2 ])
            ].flat()) as Class[];
        } else
            return [ ];
    },

    // DB doesn't support to support variants for this, so the variant parameter is effectively uselesss
    getFamilies(unitID: Nullable<number | string>,
                variant: Nullable<number> = null): string[] {
        if (!unitID) return [ ];
        const fullID = (variant ? `${ unitID }-${ variant }` : unitID);
        return (window.families[fullID] ?? window.families[unitID]) ?? [ ];
    },

    getName(unitID: Nullable<number | string>,
            variant: Nullable<number> = null): Nullable<string> {
        if (!unitID) return null;
        const fullID = (variant ? `${ unitID }-${ variant }` : unitID);
        return (window.units[fullID] ?? window.units[unitID])?.name ?? null;
    },

    getRarity(unitID: Nullable<number | string>): Nullable<string> {
        if (!unitID) return null;
        return window.units[unitID]?.stars ?? null;
    },

    getSuperSpecial(unitID: Nullable<number | string>,
                    variant: Nullable<number> = null): Nullable<SuperSpecialOrSupport> {

        if (!unitID) return null

        const data = window.details[unitID];
        if (!data) return null;

        if (data.superSpecial)
            return { base: data.superSpecial, criteria: data.superSpecialCriteria };
        else if (data.VSSpecial) {
            if (variant === 1)
                return { base: data.VSSpecial?.character1, criteria: data.VSCondition };
            else if (variant === 2)
                return { base: data.VSSpecial?.character2, criteria: data.VSCondition };
        } else
            return null;

    },

    getSupport(unitID: Nullable<number | string>): Nullable<SuperSpecialOrSupport> {

        if (!unitID) return null

        const data = window.details[unitID];
        if (!data.support?.length) return null;

        const last = data.support[data.support.length - 1];
        if (!last?.description?.length) return null;

        return {
            base: last.description[last.description.length - 1],
            criteria: last.Characters
        };

    },

    getSupporters(supportedUnitID: Nullable<number | string>,
                  supportedUnitVariant: Nullable<number> = null): number[] {

        if (!supportedUnitID) return [ ];

        return getSupporterIDs().filter(supportingUnitID => {

            const support = Units.getSupport(supportingUnitID);
            if (!support?.base) return false;

            const supportedFamilies = Units.getFamilies(supportedUnitID, supportedUnitVariant).map(normalizeString);
            const supportingFamilies = Units.getFamilies(supportingUnitID).map(normalizeString);
            if (supportingFamilies.some(f => supportedFamilies.includes(f)))
                return false;

            return Criteria.parseCriteria(support.criteria)(supportedUnitID, supportedUnitVariant);

        });

    },

    getSpecial(unitID: Nullable<number | string>,
               variant: Nullable<number> = null,
               assumeLLB: boolean = false): Nullable<Special> {

        if (!unitID) return null

        const data = window.details[unitID];
        if (!data?.special) return null;

        const key = variant === 1 ? 'character1' : variant === 2 ? 'character2' : 'base';
        const llb = (assumeLLB ? getLimitBreak(unitID, 'special') : null);

        if (isString(data.special) || isArray(data.special)) {
            const result = toBaseSpecial(unitID, llb?.[key] ?? data.special);
            return result ? { base: result } : null;
        } else if (!isPlainObject(data.special))
            return null;

        const result: Partial<Special> = { };

        const special = toBaseSpecial(unitID, llb?.[key] ?? data.special[key] ?? data.special.base);
        if (special) {
            result.base = special;
            const combined = toBaseSpecial(unitID, llb?.combined ?? data.special.combined);
            if (key !== 'base' && combined) result.combined = combined;
        }

        return (result.base ? result as Special : null);

    },

    getSwap(unitID: Nullable<number | string>): Nullable<Swap> {

        if (!unitID) return null

        const data = window.details[unitID];
        if (!data?.swap) return null;

        if (isString(data.swap))
            return { base: data.swap };
        else if (isPlainObject(data.swap))
            return data.swap;
        else
            return null;

    },

    getTags(unitID: Nullable<number | string>,
            variant: Nullable<number> = null): string[] {

        if (!unitID) return [ ];

        const fullID = (variant ? `${ unitID }-${ variant }` : unitID);
        const data = window.tags[fullID] ?? window.tags[unitID] ?? [ ];

        let result;
        if (!variant)
            result = data.flat().filter((x, n, a) => a.indexOf(x) === n);
        else if (data.some(d => isArray(d)))
            result = (data[variant - 1] as string[]) ?? [ ];
        else
            result = (data as string[]) ?? [ ];

        return result
            .map(t => t.replace(/^Former\s*\/\s*/, ''))
            .map(t => t.endsWith('/ Devil Fruit User') ? t.match(/(.+?)\s*\/\s*(Devil Fruit User)$/)?.slice(1) ?? t : t)
            .flat()
            .map(t => t.trim())
            .filter(t => !isNullish(t))
            .filter((x,n,a) => a.indexOf(x) === n);

    },

    getThumbnailURL(unitID: Nullable<number | string>,
                    variant: Nullable<number> = null,
                    useFallback: boolean = false): string {

        if (!unitID)
            return `${ IMAGE_BASE }/api/images/common/noimage.png`;

        const numericID = (isNumber(unitID) ? unitID : parseInt(unitID, 10));
        const prefix = (useFallback ? 'jap' : 'glo');
        const directory = Math.floor(numericID / 1000);
        const subDirectory = ('000' + (Math.floor((numericID % 1000) / 100) * 100)).slice(-3);
        const baseName = ('0000' + numericID).slice(-4);
        const qualifier = (variant ? `-${ variant }` : '');
        return `${ IMAGE_BASE }/api/images/thumbnail/${ prefix }/${ directory }/${ subDirectory }/${ baseName }${ qualifier }.png`;

    },

    getTypes(unitID: Nullable<number | string>,
             variant: Nullable<number> = null): Type[] {
        if (!unitID) return [ ];
        const fullID = (variant ? `${ unitID }-${ variant }` : unitID);
        const data = window.units[fullID] ?? window.units[unitID];
        if (data?.type)
            return [ data.type ] as Type[];
        else if (window.units[unitID + '-1']) {
            return [
                window.units[unitID + '-1'].type,
                window.units[unitID + '-2']?.type
            ].filter(t => !isNullish(t)) as Type[];
        } else
            return [ ];
    },

    hasVariants(unitID: Nullable<number | string>): boolean {
        if (!unitID) return false;
        return (window.units[unitID]?.type === null);
    },

    isKnownFamily(value: string): boolean {
        if (!knownFamilies)
            knownFamilies = unique(Object.values(window.families ?? { }).flat().map(normalizeString));
        return knownFamilies.includes(normalizeString(value));
    }

}

/*---------
  Internals
  ---------*/

// Caches the ID of the units that have a support at all
let supporterIDs: Nullable<number[]> = null;

// Caches known families
let knownFamilies: Nullable<string[]> = null;

function getLimitBreak(unitID: number | string, section: 'captain'): Nullable<Record<string, string>>;
function getLimitBreak(unitID: number | string, section: 'special'): Nullable<Record<string, string | DbSpecial[]>>;
function getLimitBreak(unitID: number | string, section: 'captain' | 'special') {

    const levels = window.details[unitID]?.lLimit;
    if (!isArray(levels)) return null;

    let result: Nullable<Record<string, any>> = null;

    for (const level of levels) {
        const values = level?.[section];
        if (isPlainObject(values))
            result = { ...(result ?? { }), ...values };
    }

    return result;

}

function toBaseSpecial(unitID: number | string,
                       special: Nullable<string | DbSpecial[]>): Nullable<BaseSpecial | BaseSpecial[]> {
    if (isString(special))
        return { cooldown: window.cooldowns[unitID]?.[1], description: special };
    else if (isArray(special))
        return special.map(s => ({ cooldown: s.cooldown?.[1], description: s.description }));
    else
        return null;
}

function getSupporterIDs(): number[] {
    if (!supporterIDs) {
        supporterIDs = Object.keys(window.details ?? { })
            .filter(id => /^\d+$/.test(id))
            .filter(id => {
                let support = Units.getSupport(id)?.base;
                if (!support) return false;
                for (let regex of IGNORED_SUPPORT_REGEXES)
                    support = support.replace(regex, '');
                return support?.trim()?.length > 0;
            })
            .map(id => parseInt(id, 10));
    }
    return supporterIDs;
}

function normalizeString(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
}
