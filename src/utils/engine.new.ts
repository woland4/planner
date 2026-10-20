import { isNullish, isString } from 'remeda';

import { Units } from '@/utils/units.ts';

import type { Nullable } from '@/types/utils.ts';
import type { GimmickType } from '@/types/enums.ts';
import type { GimmickCheckContext } from '@/types/engine.ts';
import type { GimmickEffectType } from '@/types/gimmicks.ts';
import { GimmickRegistry } from '@/utils/registry.ts';

/*-----
  Types
  -----*/

export type SearchParams = {
    captain?: SearchParamsField;
    potential?: SearchParamsField;
    sailor?: SearchParamsField;
    special?: SearchParamsField;
    superSpecial?: SearchParamsField;
    support?: SearchParamsField;
    swap?: SearchParamsField;
};

export type SearchParamsField = {
    effect: RegExp;
    conditions?: SearchParamsCondition[];
};

export type SearchParamsCondition = {
    regex: string;
    resolve?: (context: GimmickCheckContext<any>, match: SearchResult) => SearchResultConfidence;
}

export type SearchResult = {

    source:
        | 'captain'
        | 'potential'
        | 'sailor'
        | 'special'
        | 'super special'
        | 'super switch'
        | 'support'
        | 'switch';
    conditional?: boolean;

    index: number;
    text: string;
    matches: string[];
    groups: Record<string, Nullable<string>>;

};

export type SearchResultCandidate = {
    source: SearchResult['source'];
    index: number;
    text: string;
}

export type SearchResultConfidence =
    | 'certain' // *WILL* trigger
    | 'conditional' // *MAY* trigger depending on the player
    | 'none'; // *WILL NOT* trigger

/*-------
  Exports
  -------*/

export const EngineNew = {

    /*--------------
      Search Methods
      --------------*/

    search(context: GimmickCheckContext<any>,
           params: SearchParams): SearchResult[] {

        window.context = context;

        const result: Nullable<SearchResult>[] = [ ];

        if (params.captain)
            result.push(...extractCaptains(context).map(c => matchCandidate(context, params.captain!, c)));
        if (params.potential)
            result.push(...extractPotentials(context).map(c => matchCandidate(context, params.potential!, c)));
        if (params.sailor)
            result.push(...extractSailors(context).map(c => matchCandidate(context, params.sailor!, c)));
        if (params.special)
            result.push(...extractSpecials(context).map(c => matchCandidate(context, params.special!, c)));
        if (params.superSpecial)
            result.push(...extractSuperSpecials(context).map(c => matchCandidate(context, params.superSpecial!, c)));
        if (params.support)
            result.push(...extractSupports(context).map(c => matchCandidate(context, params.support!, c)));
        if (params.swap)
            result.push(...extractSwaps(context).map(c => matchCandidate(context, params.swap!, c)));

        return result.filter(r => !isNullish(r));

    },

    /*--------------
      Misc Utilities
      --------------*/

    Conditions: {

        always(): SearchParamsCondition {
            return {
                regex: ''
            };
        },

        whenInflictedWith(suffix: string = 'reduces|removes'): SearchParamsCondition {
            return {
                regex: `when an enemy inflicts you with (?<trigger>(?:(?!${ suffix })[^.])+)`,
                resolve(context, match) {
                    const triggers = toGimmickTypes(match.groups.trigger);
                    if (!triggers.length) return isExhausted(context, context.gimmick.type) ? 'none' : 'certain';
                    return triggers.some(t => isExhausted(context, t)) ? 'none' : 'certain';
                }
            };
        },

        whenSpecialUsed(): SearchParamsCondition {
            return {
                regex: 'when the supported character uses',
                resolve: () => 'conditional'
            };
        },

        whenStageReached(): SearchParamsCondition {
            return {
                regex: `when you reach the (?<stage>\\d+|final|last)(?:st|nd|rd|th)? stage`,
                resolve(context, match) {
                    const stage = match.groups.stage!;
                    if (stage === 'final' || stage === 'last')
                        return context.stageIndex === context.battle.stages.length - 1 ? 'certain' : 'none';
                    return context.stageIndex === parseInt(stage, 10) - 1 ? 'certain' : 'none';
                }
            };
        }

    },

    Effects: {

        reducesDuration(string: string): string {
            return `reduces ${ EngineNew.Misc.listContaining(string, 'duration') } duration by (?<turns>\\d+) turn`;
        },

        removesDuration(string: string): string {
            return `removes ${ EngineNew.Misc.listContaining(string, 'duration') } duration completely`;
        }

    },

    Misc: {

        listContaining(string: string,
                       suffix: string): string {
            return `(?=(?:(?!${ suffix })[^.])*\\b${ string }\\b)[^.]+?`;
        }

    }

}

/*---------
  Internals
  ---------*/

function extractCaptains(context: GimmickCheckContext<any>): SearchResultCandidate[] {
    const result: SearchResultCandidate[] = [ ];
    for (let i of [ 5, 0 ]) {
        const unit = context.team.units[i];
        const captain = Units.getCaptain(unit?.id, unit?.variant, unit?.llbLevel ?? 0);
        if (captain)
            result.push({ source: 'captain', index: i, text: captain });
    }
    return result;
}

function extractPotentials(context: GimmickCheckContext<any>): SearchResultCandidate[] {
    const result: SearchResultCandidate[] = [ ];
    for (let i of [ 5, 0, 4, 1, 3, 2 ]) {
        const potentials = Units.getPotentials(context.team.units[i]?.id);
        for (let potential of potentials)
            result.push({ source: 'potential', index: i, text: potential });
    }
    return result;

}

function extractSailors(context: GimmickCheckContext<any>): SearchResultCandidate[] {
    const result: SearchResultCandidate[] = [ ];
    for (let i of [ 5, 0, 4, 1, 3, 2 ]) {
        const unit = context.team.units[i];
        const sailors = Units.getSailors(unit?.id, unit?.variant);
        for (let sailor of sailors)
            result.push({ source: 'sailor', index: i, text: sailor });
    }
    return result;
}

function extractSpecials(context: GimmickCheckContext<any>): SearchResultCandidate[] {
    const result: SearchResultCandidate[] = [ ];
    for (let i of [ 5, 0, 4, 1, 3, 2 ]) {
        const unit = context.team.units[i];
        const specials = Units.getSpecial(unit?.id, unit?.variant, unit?.llbLevel ?? 0);
        const special = specials?.length ? specials[specials.length - 1] : null;
        if (special?.description)
            result.push({ source: 'special', index: i, text: special.description });
    }
    return result;
}

function extractSuperSpecials(context: GimmickCheckContext<any>): SearchResultCandidate[] {
    const result: SearchResultCandidate[] = [ ];
    for (let i of [ 5, 0, 4, 1, 3, 2 ]) {
        const unit = context.team.units[i];
        const special = Units.getSuperSpecial(unit?.id, unit?.variant);
        if (special?.description)
            result.push({ source: 'super special', index: i, text: special.description });
    }
    return result;
}

function extractSupports(context: GimmickCheckContext<any>): SearchResultCandidate[] {
    const result: SearchResultCandidate[] = [ ];
    for (let i of [ 0, 4, 1, 3, 2 ]) {
        const unit = context.team.units[i];
        const support = Units.getSupport(unit?.support);
        if (support?.description)
            result.push({ source: 'support', index: i, text: support.description });
    }
    return result;
}

function extractSwaps(context: GimmickCheckContext<any>): SearchResultCandidate[] {
    const result: SearchResultCandidate[] = [ ];
    for (let i of [ 5, 0, 4, 1, 3, 2 ]) {
        const unit = context.team.units[i];
        const swap = Units.getSwap(unit?.id);
        if (swap?.description)
            result.push({ source: 'switch', index: i, text: swap.description });
        if (swap?.super)
            result.push({ source: 'super switch', index: i, text: swap.super });
    }
    return result;
}

function isExhausted(context: GimmickCheckContext<any>,
                     type: GimmickType): boolean {
    return context.battle.stages
        .slice(0, context.stageIndex)
        .some(stage => stage?.gimmicks?.some(g => g.type === type));
}

function matchCandidate(context: GimmickCheckContext<any>,
                        field: SearchParamsField,
                        candidate: SearchResultCandidate): Nullable<SearchResult> {

    let best: Nullable<SearchResult> = null;

    for (const condition of field.conditions ?? [ EngineNew.Conditions.always() ]) {

        const matches = candidate.text.match(generateCandidateRegex(condition, field.effect));
        if (!matches) continue;
        console.log(matches);

        const result: SearchResult = { ...candidate, matches: [ ...matches ], groups: matches.groups ?? { } };

        let confidence = condition.resolve?.(context, result) ?? 'certain';
        if (confidence !== 'none' && /once per adventure/i.test(candidate.text) && isExhausted(context, context.gimmick.type))
            confidence = 'none';

        if (confidence === 'certain')
            return { ...result, conditional: false };
        else if (confidence === 'none')
            continue;
        else if (!best)
            best = { ...result, conditional: true };

    }

    return best;

}

function generateCandidateRegex(condition: SearchParamsCondition,
                                effect: RegExp): RegExp {
    if (!condition.regex)
        return effect;
    return new RegExp(`(?:${ condition.regex })[^.]*?(?:${ effect.source })`, effect.flags.replace('g', ''));
}

const TRIGGER_SEPARATOR_REGEX = /\s*,\s*|\s+(?:and|or)\s+/i;
const TRIGGER_NOISE_REGEX = /^(?:a|an|the)\s+|\s+(?:debuffs?|effects?)$/gi;

function toGimmickTypes(trigger: Nullable<string>): GimmickEffectType[] {
    if (!trigger) return [ ];
    return trigger
        .split(TRIGGER_SEPARATOR_REGEX)
        .map(token => normalizeString(token.replace(TRIGGER_NOISE_REGEX, '')))
        .filter(token => token.length > 0)
        .map(token => getTypesByLabel().get(token))
        .filter(type => !isNullish(type));
}

function normalizeString(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

let typesByLabel: Nullable<Map<string, GimmickEffectType>> = null;

function getTypesByLabel(): Map<string, GimmickEffectType> {
    if (!typesByLabel) {
        typesByLabel = new Map();
        for (const [ type, details ] of Object.entries(GimmickRegistry)) {
            if (isString(details.label))
                typesByLabel.set(normalizeString(details.label), type as GimmickEffectType);
            for (const alias of TRIGGER_ALIASES[type as GimmickEffectType] ?? [ ])
                typesByLabel.set(normalizeString(alias), type as GimmickEffectType);
        }
    }
    return typesByLabel;
}

const TRIGGER_ALIASES: Partial<Record<GimmickEffectType, string[]>> = {
    specialBind: [ 'special bind' ]
}
