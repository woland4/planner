import { isArray, isNullish, isNumber, isPlainObject, isString, unique } from 'remeda';

import type { Nullable } from '@/types/utils.ts';

/*---------
  Constants
  ---------*/

const IMAGE_BASE = 'https://2Shankz.github.io/optc-db.github.io';
//const IMAGE_BASE = 'http://localhost/optc';

const ALL_CHARACTERS_REGEX = /^All characters?/i;
const TRAILING_CHARACTERS_REGEX = / characters?$/i;
const ALIASES_REGEX = /\s+\(.*?\)/g;
const COST_REGEX = /characters? with cost (\d+) or (less|more)/i;
const TYPE_REGEX = /\[(STR|DEX|QCK|PSY|INT)\]/i;
const CLASS_REGEX = /(?:Fighter|Slasher|Striker|Shooter|Free Spirit|Powerhouse|Cerebral|Driven)/i;
const TAG_REGEX = /\[((?!STR\]|DEX\]|QCK\]|PSY\]|INT\])[^\]]+)\]/i;
const SEPARATOR_REGEX = /(?:\s*,\s*|\s+)(?:and|or)\s+|\s*,\s*|\/|:\s*/g;

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
    base: BaseSpecial | BaseSpecial[];
    combined?: BaseSpecial | BaseSpecial[];
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
}

type SupportTarget = {
    cost: Nullable<number>;
    families: string[];
    types: string[];
    classes: string[];
    tags: string[];
}

type SupportCriteria = {
    cost?: { min: number, max: number };
    families: string[];
    types: string[];
    classes: string[];
    tags: string[];
    requiresEveryClass: boolean;
}

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

    getClasses(unitID: Nullable<number | string>,
               variant: Nullable<number> = null): string[] {
        if (!unitID) return [ ];
        const fullID = (variant ? `${ unitID }-${ variant }` : unitID);
        const data = window.units[fullID] ?? window.units[unitID];
        if (isString(data?.class))
            return [ data.class ];
        else if (isArray(data?.class))
            return data.class;
        else if (window.units[unitID + '-1']) {
            const class1 = (window.units[unitID + '-1']?.class ?? [ ]);
            const class2 = (window.units[unitID + '-2']?.class ?? [ ]);
            return unique([
                (isArray(class1) ? class1 : [ class1 ]),
                (isArray(class2) ? class2 : [ class2 ])
            ].flat());
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
                  supportedVariant: Nullable<number> = null): number[] {

        if (!supportedUnitID) return [ ];

        const target = {
            cost: window.units[supportedUnitID]?.cost,
            families: Units.getFamilies(supportedUnitID, supportedVariant).map(normalizeString),
            types: Units.getTypes(supportedUnitID, supportedVariant).map(normalizeString),
            classes: Units.getClasses(supportedUnitID, supportedVariant).map(normalizeString),
            tags: Units.getTags(supportedUnitID, supportedVariant).map(normalizeString)
        };

        return getSupporterIDs()
            .filter(id => canSupport(id, target));

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

    getSwaps(unitID: Nullable<number | string>): Nullable<Swap> {

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

        if (!variant)
            return data.flat().filter((x, n, a) => a.indexOf(x) === n);
        else if (data.some(d => isArray(d)))
            return (data[variant - 1] as string[]) ?? [ ];
        else
            return (data as string[]) ?? [ ];

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
             variant: Nullable<number> = null): string[] {
        if (!unitID) return [ ];
        const fullID = (variant ? `${ unitID }-${ variant }` : unitID);
        const data = window.units[fullID] ?? window.units[unitID];
        if (data?.type)
            return [ data.type ];
        else if (window.units[unitID + '-1']) {
            return [
                window.units[unitID + '-1'].type,
                window.units[unitID + '-2']?.type
            ].filter(t => !isNullish(t));
        } else
            return [ ];
    },

    hasVariants(unitID: Nullable<number | string>): boolean {
        if (!unitID) return false;
        return (window.units[unitID]?.type === null);
    }

}

window.Units = Units;

/*---------
  Internals
  ---------*/

// Caches the ID of the units that have a support at all
let supporterIDs: Nullable<number[]> = null;

// Criteria parse cache so we don't have to redo the parsing each time
const criteriaCache = new Map<string, SupportCriteria>();

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

function parseSupportCriteria(criteria: string): SupportCriteria {
    let result = criteriaCache.get(criteria);
    if (!result) {
        result = generateSupportCriteria(criteria);
        criteriaCache.set(criteria, result);
    }
    return result;
}

function generateSupportCriteria(criteria: string): SupportCriteria {

    const result: SupportCriteria = {
        families: [ ],
        types: [ ],
        classes: [ ],
        tags: [ ],
        requiresEveryClass: false
    };

    const sanitized = criteria
        .replace(TRAILING_CHARACTERS_REGEX, '')
        .replace(ALIASES_REGEX, '');

    const cost = sanitized.match(COST_REGEX);
    if (cost) {
        const value = parseInt(cost[1], 10);
        if (cost[2].toLowerCase() === 'less') result.cost = { min: Number.NEGATIVE_INFINITY, max: value };
        else result.cost = { min: value, max: Number.POSITIVE_INFINITY };
        return result;
    }

    for (const term of sanitized.split(SEPARATOR_REGEX)) {

        if (!term) continue;

        let family = term;

        const type = term.match(TYPE_REGEX);
        if (type) {
            result.types.push(normalizeString(type[1]));
            family = family.replace(type[0], '');
        }

        const clazz = term.match(CLASS_REGEX);
        if (clazz) {
            result.classes.push(normalizeString(clazz[0]));
            family = family.replace(clazz[0], '');
        }

        const tag = term.match(TAG_REGEX);
        if (tag) {
            result.tags.push(normalizeString(tag[1]));
            family = family.replace(tag[0], '');
        }

        family = family.trim();
        if (family) result.families.push(normalizeString(family));

    }

    // "Fighter/Slasher" requires both classes, "Fighter or Slasher" requires either
    const split = sanitized.split(CLASS_REGEX);
    result.requiresEveryClass = (split.length === 3 && split[1].trim() === '/');

    return result;

}

function canSupport(supportingUnitID: number | string,
                    target: SupportTarget): boolean {

    const support = Units.getSupport(supportingUnitID);
    if (!support?.base) return false;

    const supportingFamilies = Units.getFamilies(supportingUnitID).map(normalizeString);
    if (supportingFamilies.some(f => target.families.includes(f)))
        return false;

    if (ALL_CHARACTERS_REGEX.test(support.criteria))
        return true;

    const criteria = parseSupportCriteria(support.criteria);

    // Types
    if (criteria.types.length && !intersects(criteria.types, target.types))
        return false;

    // Classes
    if (criteria.classes.length) {
        const matches = criteria.requiresEveryClass
            ? criteria.classes.every(c => target.classes.includes(c))
            : intersects(criteria.classes, target.classes);
        if (!matches) return false;
    }

    // Families
    if (criteria.families.length && !intersects(criteria.families, target.families))
        return false;

    // Tags
    if (criteria.tags.length && !intersects(criteria.tags, target.tags))
        return false;

    // Cost
    if (criteria.cost && (isNullish(target.cost) || target.cost < criteria.cost.min || target.cost > criteria.cost.max))
        return false;

    return true;

}

function intersects(a: string[], b: string[]): boolean {
    return a.some(v => b.includes(v));
}

function normalizeString(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
}
