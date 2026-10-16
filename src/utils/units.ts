import { isArray, isNullish, isNumber, isPlainObject, isString, unique } from 'remeda';

import { Criteria } from '@/utils/criteria.ts';
import { Database } from '@/utils/database.ts';

import type { Nullable } from '@/types/utils.ts';
import type { Class, Type } from '@/types/enums.ts';

/*---------
  Constants
  ---------*/

const IGNORED_SUPPORT_REGEXES = [
    /reduces damage received from [^.]+ by [\d.]%\./i,
    /adds [\d.]+% of this character's base [a-z\s,]+ to the supported character's base [a-z\s,]+\./i,
];

/*-----
  Types
  -----*/

export type Unit = {

    id: number;
    variant: Nullable<number>;
    llbLevel: number;

    name: string;
    cost: number;
    rarity: string;
    isDual: boolean;
    isVS: boolean;

    types: Type[]; // Could be more than one for dual units
    classes: Class[];
    families: string[];
    tags: string[];
    llbLevels: number[];

    captain: Nullable<string>;

    special: Nullable<{ description: string; turns: Nullable<number> }[]>;

    superSpecial: Nullable<{ description: string, condition: string }>;

    swap: Nullable<{
        description: string;
        super?: Nullable<string>;
        superTurns?: Nullable<number>;
    }>;

    support: Nullable<{ description: string, condition: string }>;

}

/*-------
  Exports
  -------*/

export const Units = {

    /*----------
      Whole Data
      ----------*/

    getUnit(unitID: Nullable<number>,
            variant: Nullable<number> = null,
            llbLevel: number = 0): Nullable<Unit> {
        return reconstructUnit(unitID, variant, llbLevel);
    },

    /*--------------
      Single Aspects
      --------------*/

    getCaptain(unitID: Nullable<number>,
               variant: Nullable<number> = null,
               llbLevel: number = 0): Nullable<string> {
        return reconstructCaptain(unitID, variant, llbLevel);
    },

    getCost(unitID: Nullable<number>): Nullable<number> {
        return reconstructCost(unitID);
    },

    getClasses(unitID: Nullable<number>,
               variant: Nullable<number> = null): Class[] {
        return reconstructClasses(unitID, variant);
    },

    getFamilies(unitID: Nullable<number>,
                variant: Nullable<number> = null): string[] {
        return reconstructFamilies(unitID, variant);
    },

    getLlbLevels(unitID: Nullable<number>): number[] {
        return reconstructLlbLevels(unitID);
    },

    getName(unitID: Nullable<number>,
            variant: Nullable<number> = null): Nullable<string> {
        return reconstructName(unitID, variant);
    },

    getRarity(unitID: Nullable<number>): Nullable<string> {
        return reconstructRarity(unitID);
    },

    getSuperSpecial(unitID: Nullable<number>,
                    variant: Nullable<number> = null): Nullable<{ description: string, condition: string }> {
        return reconstructSuperSpecial(unitID, variant);
    },

    getSupport(unitID: Nullable<number>): Nullable<{ description: string, condition: string }> {
        return reconstructSupport(unitID);
    },

    getSpecial(unitID: Nullable<number>,
               variant: Nullable<number> = null,
               llbLevel = 0): { description: string, turns: number }[] {
        return reconstructSpecial(unitID, variant, llbLevel);
    },

    getSwap(unitID: Nullable<number>): Nullable<{ description: string, super?: string, superTurns?: number }> {
        return reconstructSwap(unitID);
    },

    getTags(unitID: Nullable<number>,
            variant: Nullable<number> = null): string[] {
        return reconstructTags(unitID, variant);
    },

    getTypes(unitID: Nullable<number>,
             variant: Nullable<number> = null): Type[] {
        return reconstructTypes(unitID, variant);
    },

    /*---------
      Utilities
      ---------*/

    getSupporters(unitID: Nullable<number>,
                  variant: Nullable<number> = null): number[] {

        if (!unitID) return [ ];

        return getSupporterIDs().filter(supporterUnitID => {

            const support = reconstructSupport(supporterUnitID);
            if (!support?.description) return false;

            const supportedFamilies = reconstructFamilies(unitID, variant).map(normalizeString);
            const supportingFamilies = reconstructFamilies(supporterUnitID).map(normalizeString);
            if (supportingFamilies.some(f => supportedFamilies.includes(f)))
                return false;

            return Criteria.parseCriteria(support.condition)(unitID, variant);

        });

    },

    getThumbnailURL(unitID: Nullable<number>,
                    variant: Nullable<number> = null,
                    useFallback: boolean = false): string {

        if (!unitID)
            return `${ Database.IMAGE_BASE }/common/noimage.png`;

        const numericID = (isNumber(unitID) ? unitID : parseInt(unitID, 10));
        const prefix = (useFallback ? 'jap' : 'glo');
        const directory = Math.floor(numericID / 1000);
        const subDirectory = ('000' + (Math.floor((numericID % 1000) / 100) * 100)).slice(-3);
        const baseName = ('0000' + numericID).slice(-4);
        const qualifier = (variant ? `-${ variant }` : '');
        return `${ Database.IMAGE_BASE }/thumbnail/${ prefix }/${ directory }/${ subDirectory }/${ baseName }${ qualifier }.png`;

    },

    hasVariants(unitID: Nullable<number>): boolean {
        return Units.isDual(unitID) || Units.isVS(unitID);
    },

    isKnownFamily(value: string): boolean {
        if (!knownFamilies)
            knownFamilies = unique(Object.values(window.families ?? { }).flat().map(normalizeString));
        return knownFamilies.includes(normalizeString(value));
    },

    isDual(unitID: Nullable<number>): boolean {
        if (!unitID) return false;
        return !!window.details[unitID]?.swap;
    },

    isVS(unitID: Nullable<number>): boolean {
        if (!unitID) return false;
        return !!window.details[unitID]?.VSCondition;
    }

}

/*---------
  Internals
  ---------*/

// Caches the ID of the units that have a support at all
let supporterIDs: Nullable<number[]> = null;

// Caches known families so we don't have to reprocess them each time
let knownFamilies: Nullable<string[]> = null;

function reconstructUnit(unitID: Nullable<number>,
                         variant?: Nullable<number>,
                         llbLevel: number = 0): Nullable<Unit> {

    if (!unitID) return null;

    const fullID = variant ? `${ unitID }-${ variant}` : unitID;
    const unit = window.units[fullID] ?? window.units[unitID];
    const details = window.details[fullID] ?? window.details[unitID];
    if (!unit || !details) return null;

    const isVS = Units.isVS(unitID);
    if (isVS && !variant) return null; // VS's have no combined form

    return {

        id: unitID,
        variant,
        llbLevel,

        name: reconstructName(unitID, variant)!!,
        cost: reconstructCost(unitID)!!,
        rarity: reconstructRarity(unitID)!!,
        isDual: Units.isDual(unitID),
        isVS: isVS,

        types: reconstructTypes(unitID, variant),
        classes: reconstructClasses(unitID, variant),
        families: reconstructFamilies(unitID, variant),
        tags: reconstructTags(unitID, variant),
        llbLevels: reconstructLlbLevels(unitID),

        captain: reconstructCaptain(unitID, variant, llbLevel),

        special: reconstructSpecial(unitID, variant, llbLevel),

        superSpecial: reconstructSuperSpecial(unitID, variant),

        swap: reconstructSwap(unitID),

        support: reconstructSupport(unitID)

    };

}

function reconstructName(unitID: Nullable<number>,
                         variant: Nullable<number> = null): Nullable<string> {
    if (!unitID) return null;
    const fullID = (variant ? `${ unitID }-${ variant }` : unitID);
    return (window.units[fullID] ?? window.units[unitID])?.name ?? null;
}

function reconstructCost(unitID: Nullable<number>,
                         variant: Nullable<number> = null): Nullable<number> {
    if (!unitID) return null;
    const fullID = (variant ? `${ unitID }-${ variant }` : unitID);
    const data = window.units[fullID] ?? window.units[unitID];
    return data?.cost ?? null;
}

function reconstructRarity(unitID: Nullable<number>): Nullable<string> {
    if (!unitID) return null;
    return window.units[unitID]?.stars ?? null;
}

function reconstructTypes(unitID: Nullable<number>,
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
}

function reconstructClasses(unitID: Nullable<number>,
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
}

// DB doesn't support to support variants for this, so the variant parameter is effectively useless
function reconstructFamilies(unitID: Nullable<number>,
                             variant: Nullable<number> = null): string[] {
    if (!unitID) return [ ];
    const fullID = (variant ? `${ unitID }-${ variant }` : unitID);
    return (window.families[fullID] ?? window.families[unitID]) ?? [ ];
}

function reconstructTags(unitID: Nullable<number>,
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

}

function reconstructLlbLevels(unitID: Nullable<number>): number[] {
    if (!unitID) return [ ];
    const details = window.details[unitID]?.lLimit ?? [ ];
    return [ 1, 2, 3, 4, 5 ].filter(i => details[i - 1]?.captain || details[i - 1]?.special);
}

function reconstructCaptain(unitID: Nullable<number>,
                            variant: Nullable<number> = null,
                            llbLevel: number = 0): Nullable<string> {

    if (!unitID) return null;

    const fullID = (variant ? `${ unitID }-${ variant }` : unitID);
    const data = window.details[fullID] ?? window.details[unitID];
    if (!isPlainObject(data)) return null;

    let captain: string | Record<string, string> = data.captain;
    if (llbLevel > 0) {
        const lLimit = data?.lLimit ?? [ ];
        for (let i=llbLevel-1; i>=0; --i) {
            if (!isNullish(lLimit[i]?.captain)) {
                captain = lLimit[i].captain!!;
                break;
            }
        }
    }

    if (isNullish(captain))
        return null;
    else if (isString(captain))
        return captain;
    else {
        return (
            captain[variant === 1 ? 'character1' : (variant === 2 ? 'character2' : 'combined')] ??
            captain.level6 ??
            captain.level5 ??
            captain.level4 ??
            captain.level3 ??
            captain.level2 ??
            captain.level1 ??
            captain.base
        );
    }

}

// Returns one element per stage (single element for single-stage specials)
function reconstructSpecial(unitID: Nullable<number>,
                            variant: Nullable<number> = null,
                            llbLevel: number = 0): { description: string, turns: number }[] {

    if (!unitID) return [ ];

    const fullID = (variant ? `${ unitID }-${ variant }` : unitID);
    const data = window.details[fullID] ?? window.details[unitID];
    if (!isPlainObject(data)) return [ ];

    let result = data.special;
    if (llbLevel > 0) {
        const lLimit = data?.lLimit ?? [ ];
        for (let i=llbLevel-1; i>=0; --i) {
            if (!isNullish(lLimit[i]?.special)) {
                result = lLimit[i].special!!;
                break;
            }
        }
    }

    if (isPlainObject(result)) {
        result = (
            result[variant === 1 ? 'character1' : (variant === 2 ? 'character2' : 'combined')] ??
            result.level6 ??
            result.level5 ??
            result.level4 ??
            result.level3 ??
            result.level2 ??
            result.level1 ??
            result.base
        );
    }

    if (isNullish(result))
        return [ ];
    else if (isString(result)) {
        const cooldown = window.cooldowns[fullID] ?? window.cooldowns[unitID] ?? [ ];
        return [{
            description: result,
            turns: cooldown[cooldown.length - 1] ?? null
        }];
    } else if (isArray(result)) {
        return result.map(s => ({
            description: s.description,
            turns: s.cooldown[s.cooldown?.length - 1] ?? null
        }));
    } else
        return [ ];

}

function reconstructSuperSpecial(unitID: Nullable<number>,
                                 variant: Nullable<number> = null): Nullable<{ description: string, condition: string }> {

    if (!unitID) return null

    const data = window.details[unitID];
    if (!data) return null;

    if (data.superSpecial)
        return { description: data.superSpecial, condition: data.superSpecialCriteria };
    else if (data.VSSpecial) {
        if (variant === 1)
            return { description: data.VSSpecial?.character1, condition: data.VSCondition };
        else if (variant === 2)
            return { description: data.VSSpecial?.character2, condition: data.VSCondition };
    } else
        return null;

}

function reconstructSwap(unitID: Nullable<number>): Nullable<{ description: string; super?: string; superTurns?: number; }> {

    if (!unitID) return null

    const data = window.details[unitID];
    if (!data?.swap) return null;

    if (isString(data.swap))
        return { description: data.swap };
    else if (isPlainObject(data.swap))
        return { description: data.swap.base, super: data.swap.super, superTurns: data.swap.superTurns };
    else
        return null;

}

function reconstructSupport(unitID: Nullable<number>): Nullable<{ description: string, condition: string }> {

    if (!unitID) return null

    const data = window.details[unitID];
    if (!data.support?.length) return null;

    const last = data.support[data.support.length - 1];
    if (!last?.description?.length) return null;

    return {
        description: last.description[last.description.length - 1],
        condition: last.Characters
    };

}

function getSupporterIDs(): number[] {
    if (!supporterIDs) {
        supporterIDs = Object.keys(window.details ?? { })
            .filter(id => /^\d+$/.test(id))
            .filter(id => {
                let support = reconstructSupport(parseInt(id, 10))?.description;
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
