import { Units } from '@/utils/units.ts';

import type { Battle, Team } from '@/types/battles.ts';
import type { Nullable } from '@/types/utils.ts';
import type { GimmickType } from '@/types/enums.ts';

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

    exhaustibleCaptain?: SearchParamsExhaustible;
    exhaustibleSailor?: SearchParamsExhaustible;
    exhaustibleSupport?: SearchParamsExhaustible;

};

export type SearchParamsExhaustible = {
    searchFor: RegExp;
    exhaustedBy: GimmickType;
};

export type SearchResults = {

    captain?: SearchResultSingle;
    potential?: SearchResultMultiple;
    sailor?: SearchResultMultiple;
    special?: SearchResultSingle;
    superSpecial?: SearchResultSingle;
    support?: SearchResultSingle;
    swap?: SearchResultMultiple;

    exhaustibleCaptain?: SearchResultSingle;
    exhaustibleSailor?: SearchResultMultiple;
    exhaustibleSupport?: SearchResultSingle;

};

export type SearchResultSingle = Map<number, SearchResultMatch>;
export type SearchResultMultiple = Map<number, SearchResultMatch[]>;

export type SearchResultMatch = {
    text: string;
    matches: string[];
    groups: Record<string, Nullable<string>>;
};

/*-------
  Exports
  -------*/

export const EngineNew = {

    /*--------------
      Search Methods
      --------------*/

    search(team: Team,
           battle: Battle,
           stageIndex: number,
           params: SearchParams): SearchResults {

        const result: Partial<SearchResults> = { };

        if (params.captain)
            result.captain = extractCaptains(team, params.captain);
        if (params.potential)
            result.potential = extractPotentials(team, params.potential);
        if (params.sailor)
            result.sailor = extractSailors(team, params.sailor);
        if (params.special)
            result.special = extractSpecials(team, params.special);
        if (params.superSpecial)
            result.superSpecial = extractSuperSpecials(team, params.superSpecial);
        if (params.support)
            result.support = extractSupports(team, params.support);
        if (params.swap)
            result.swap = extractSwaps(team, params.swap);

        if (params.exhaustibleCaptain)
            result.exhaustibleCaptain = extractExhaustibleCaptains(team, params.exhaustibleCaptain.searchFor, battle, stageIndex - 1, params.exhaustibleCaptain.exhaustedBy);
        if (params.exhaustibleSailor)
            result.exhaustibleSailor = extractExhaustibleSailors(team, params.exhaustibleSailor.searchFor, battle, stageIndex - 1, params.exhaustibleSailor.exhaustedBy);
        if (params.exhaustibleSupport)
            result.exhaustibleSupport = extractExhaustibleSupports(team, params.exhaustibleSupport.searchFor, battle, stageIndex - 1, params.exhaustibleSupport.exhaustedBy);

        return result as SearchResults;

    },

    /*---------------
      Regex Utilities
      ---------------*/

    Regexes: {

        listContaining(string: string,
                       suffix: string): string {
            return `(?=(?:(?!${ suffix })[^.])*\\b${ string }\\b)[^.]+?`;
        },

        reducesDuration(string: string): string {
            return `reduces ${ EngineNew.Regexes.listContaining(string, 'duration') } duration by (?<turns>\\d+) turn`;
        },

        removesDuration(string: string): string {
            return `removes ${ EngineNew.Regexes.listContaining(string, 'duration') } duration completely`;
        },

        whenInflictedWith(string: string): string {
            return `when an enemy inflicts you with.*?\\b${ string }\\b`;
        }

    }

}

/*---------
  Internals
  ---------*/

function extractExhaustibleCaptains(team: Nullable<Team>,
                                    regex: RegExp,
                                    battle: Battle,
                                    untilStageIndexIncluded: number,
                                    exhaustedWhen: GimmickType): SearchResultSingle {

    for (let i=0; i<=untilStageIndexIncluded; ++i) {
        if (battle.stages?.[i]?.gimmicks?.some(g => g.type === exhaustedWhen))
            return new Map();
    }

    return extractCaptains(team, regex);

}

function extractExhaustibleSailors(team: Nullable<Team>,
                                   regex: RegExp,
                                   battle: Battle,
                                   untilStageIndexIncluded: number,
                                   exhaustedWhen: GimmickType): SearchResultMultiple {

    const sailors = extractSailors(team, regex);
    if (!sailors.size) return new Map();

    let isExhausted = false;
    for (let i=0; i<=untilStageIndexIncluded; ++i) {
        if (battle.stages?.[i]?.gimmicks?.some(g => g.type === exhaustedWhen)) {
            isExhausted = true;
            break;
        }
    }

    const result: SearchResultMultiple = new Map<number, SearchResultMatch[]>();
    sailors.forEach((value, key) => {
        let values = value;
        if (isExhausted) values = value.filter(v => !/once per adventure/i.test(v.text));
        if (values.length) result.set(key, values);
    });
    return result;

}

function extractExhaustibleSupports(team: Nullable<Team>,
                                    regex: RegExp,
                                    battle: Battle,
                                    untilStageIndexIncluded: number,
                                    exhaustedWhen: GimmickType): SearchResultSingle {

    for (let i=0; i<=untilStageIndexIncluded; ++i) {
        if (battle.stages?.[i]?.gimmicks?.some(g => g.type === exhaustedWhen))
            return new Map();
    }

    return extractSupports(team, regex);

}

function extractCaptains(team: Nullable<Team>,
                         regex: RegExp): SearchResultSingle {

    if (!team?.units?.length)
        return new Map();

    const result = new Map<number, SearchResultMatch>();
    for (let i of [ 5, 0 ]) {

        const unit = team.units[i];
        const captain = Units.getCaptain(unit?.id, unit?.variant, unit?.llbLevel ?? 0);
        if (!captain) continue;

        const matches = captain.match(regex);
        if (matches)
            result.set(i, { text: captain, matches: matches ?? [ ], groups: matches?.groups ?? { } });

    }
    return result;

}

function extractPotentials(team: Nullable<Team>,
                           regex: RegExp): SearchResultMultiple {

    if (!team?.units?.length)
        return new Map();

    const result = new Map<number, SearchResultMatch[]>();
    for (let i of [ 5, 0, 4, 1, 3, 2 ]) {

        const potentials = Units.getPotentials(team.units[i]?.id);
        if (!potentials?.length) continue;

        const temp = [ ];
        for (let potential of potentials) {
            const matches = potential.match(regex);
            if (matches)
                temp.push({ text: potential, matches: matches ?? [ ], groups: matches?.groups ?? { } });
        }

        if (temp.length)
            result.set(i, temp);

    }
    return result;

}

function extractSailors(team: Nullable<Team>,
                        regex: RegExp): SearchResultMultiple {

    if (!team?.units?.length)
        return new Map();

    const result = new Map<number, SearchResultMatch[]>();
    for (let i of [ 5, 0, 4, 1, 3, 2 ]) {

        const unit = team.units[i];
        const sailors = Units.getSailors(unit?.id, unit?.variant);
        if (!sailors?.length) continue;

        const temp = [ ];
        for (let sailor of sailors) {
            const matches = sailor.match(regex);
            if (matches)
                temp.push({ text: sailor, matches: matches ?? [ ], groups: matches?.groups ?? { } });
        }

        if (temp.length)
            result.set(i, temp);

    }
    return result;

}

function extractSpecials(team: Nullable<Team>,
                         regex: RegExp): SearchResultSingle {

    if (!team?.units?.length)
        return new Map();

    const result = new Map<number, SearchResultMatch>();
    for (let i of [ 5, 0, 4, 1, 3, 2 ]) {

        const unit = team.units[i];
        const specials = Units.getSpecial(unit?.id, unit?.variant, unit?.llbLevel ?? 0);
        const special = specials?.length ? specials[specials.length - 1] : null;
        if (!special?.description) continue;

        const matches = special.description.match(regex);
        if (matches)
            result.set(i, { text: special.description, matches: matches ?? [ ], groups: matches?.groups ?? { } });

    }
    return result;

}

function extractSuperSpecials(team: Nullable<Team>,
                              regex: RegExp): SearchResultSingle {

    if (!team?.units?.length)
        return new Map();

    const result = new Map<number, SearchResultMatch>();
    for (let i of [ 5, 0, 4, 1, 3, 2 ]) {

        const unit = team.units[i];
        const special = Units.getSuperSpecial(unit?.id, unit?.variant);
        if (!special?.description) continue;

        const matches = special.description.match(regex);
        if (matches)
            result.set(i, { text: special.description, matches: matches ?? [ ], groups: matches?.groups ?? { } });

    }
    return result;

}

function extractSupports(team: Nullable<Team>,
                         regex: RegExp): SearchResultSingle {

    if (!team?.units?.length)
        return new Map();

    const result = new Map<number, SearchResultMatch>();
    for (let i of [ 0, 4, 1, 3, 2 ]) {

        const unit = team.units[i];
        const support = Units.getSupport(unit?.support);
        if (!support?.description) continue;

        const matches = support.description.match(regex);
        if (matches)
            result.set(i, { text: support.description, matches: matches ?? [ ], groups: matches?.groups ?? { } });

    }
    return result;

}

function extractSwaps(team: Nullable<Team>,
                      regex: RegExp): SearchResultMultiple {

    if (!team?.units?.length)
        return new Map();

    const result = new Map<number, SearchResultMatch[]>();
    for (let i of [ 5, 0, 4, 1, 3, 2 ]) {

        const unit = team.units[i];
        const swap = Units.getSwap(unit?.id);
        if (!swap) continue

        const temp = [ ];

        let matches = swap.description.match(regex);
        if (matches)
            temp.push({ text: swap.description, matches: matches ?? [ ], groups: matches?.groups ?? { } });

        if (swap.super) {
            matches = swap.super.match(regex);
            if (matches)
                temp.push({ text: swap.super, matches: matches ?? [ ], groups: matches?.groups ?? { } });
        }

        if (temp.length)
            result.set(i, temp);

    }
    return result;

}
