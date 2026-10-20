import { isNullish, isString } from 'remeda';

import { Units } from '@/utils/units.ts';

import type { Nullable } from '@/types/utils.ts';
import type { GimmickType } from '@/types/enums.ts';
import type { GimmickCheckContext } from '@/types/engine.ts';
import { type ParsedSupport, Supports } from '@/utils/supports.ts';

/*-----
  Types
  -----*/

export type SearchParams = {
    captain?: RegExp;
    potential?: RegExp;
    sailor?: RegExp;
    special?: RegExp;
    superSpecial?: RegExp;
    support?: RegExp;
    swap?: RegExp;
};

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

type SearchResultCandidate = {
    source: SearchResult['source'];
    index: number;
    text: string;
    trigger?: Nullable<ParsedSupport>; // only meaningful for supports
};

type SearchResultConfidence =
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

    /*---------------
      Regex Utilities
      ---------------*/

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
            result.push({ source: 'support', index: i, text: support.description, trigger: Supports.parseSupport(support.description) });
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

function matchCandidate(context: GimmickCheckContext<any>,
                        effect: RegExp,
                        candidate: SearchResultCandidate): Nullable<SearchResult> {

    const matches = (candidate.trigger?.effect ?? candidate.text).match(effect);
    if (!matches) return null;

    const availability = candidate.trigger ? resolveAvailability(context, candidate.trigger) : 'certain';
    if (availability === 'none') return null;

    return {
        ...candidate,
        matches: [ ...matches ],
        groups: matches.groups ?? { },
        conditional: availability === 'conditional'
    };

}

function resolveAvailability(context: GimmickCheckContext<any>,
                             trigger: ParsedSupport): SearchResultConfidence {

    switch (trigger.trigger) {

        case 'gimmick':
            if (trigger.once && trigger.gimmicks!.some(g => gimmickProcsBefore(context, g))) return 'none';
            return trigger.gimmicks!.some(g => gimmickProcsOn(context, g)) ? 'certain' : 'none';

        case 'stage':
            return procsOnStage(context, trigger.stage!) ? 'certain' : 'none';

        case 'special':
        case 'timing':
            return 'conditional';

    }

}

function gimmickProcsOn(context: GimmickCheckContext<any>,
                        gimmickType: GimmickType): boolean {
    return context.battle.stages[context.stageIndex]
        ?.gimmicks
        ?.some(g => g.type === gimmickType)
        ?? false;
}

function gimmickProcsBefore(context: GimmickCheckContext<any>,
                            gimmickType: GimmickType): boolean {
    return context.battle.stages
        .slice(0, context.stageIndex)
        .some(s => s.gimmicks?.some(g => g.type === gimmickType));
}

function procsOnStage(context: GimmickCheckContext<any>,
                      targetStage: 1 | 2 | 3 | 4 | 5 | 'last') {
    if (!isString(targetStage))
        return context.stageIndex + 1 === targetStage;
    else
        return context.stageIndex === context.battle.stages.length - 1;
}
