import { Units } from '@/utils/units.ts';

import type { Battle, Team } from '@/types/battles.ts';
import type { Nullable } from '@/types/utils.ts';
import type { GimmickType } from '@/types/enums.ts';
import { isPlainObject } from 'remeda';

/*-----
  Types
  -----*/

export type SearchParams = {
    captain?: RegExpOrExhaustible;
    potential?: RegExp;
    sailor?: RegExpOrExhaustible;
    special?: RegExp;
    superSpecial?: RegExp;
    support?: RegExpOrExhaustible;
    swap?: RegExp;
};

export type RegExpOrExhaustible =
    | RegExp
    | { regex: RegExp; exhaustedBy: GimmickType; };

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

    index: number;
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

    search({ team, battle, stageIndex }: { team: Team, battle: Battle, stageIndex: number },
           params: SearchParams): SearchResult[] {

        const result: SearchResult[] = [ ];

        if (params.captain)
            result.push(...extractCaptains(team, battle, stageIndex, params.captain));
        if (params.potential)
            result.push(...extractPotentials(team, params.potential));
        if (params.sailor)
            result.push(...extractSailors(team, battle, stageIndex, params.sailor));
        if (params.special)
            result.push(...extractSpecials(team, params.special));
        if (params.superSpecial)
            result.push(...extractSuperSpecials(team, params.superSpecial));
        if (params.support)
            result.push(...extractSupports(team, battle, stageIndex, params.support));
        if (params.swap)
            result.push(...extractSwaps(team, params.swap));

        return result;

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

function extractCaptains(team: Team,
                         battle: Battle,
                         stageIndex: number,
                         params: RegExpOrExhaustible): SearchResult[] {

    if (isPlainObject(params)) {
        for (let i=0; i<stageIndex; ++i) {
            if (battle.stages?.[i]?.gimmicks?.some(g => g.type === params.exhaustedBy))
                return [ ];
        }
    }

    if (!team?.units?.length)
        return [ ];

    const regex = isPlainObject(params) ? params.regex : params as RegExp;
    const result: SearchResult[] = [ ];
    for (let i of [ 5, 0 ]) {

        const unit = team.units[i];
        const captain = Units.getCaptain(unit?.id, unit?.variant, unit?.llbLevel ?? 0);
        if (!captain) continue;

        const matches = captain.match(regex);
        if (matches)
            result.push({ source: 'captain', index: i, text: captain, matches: matches ?? [ ], groups: matches?.groups ?? { } });

    }
    return result;

}

function extractPotentials(team: Team,
                           regex: RegExp): SearchResult[] {

    if (!team?.units?.length)
        return [ ];

    const result: SearchResult[] = [ ];
    for (let i of [ 5, 0, 4, 1, 3, 2 ]) {

        const potentials = Units.getPotentials(team.units[i]?.id);
        if (!potentials?.length) continue;

        for (let potential of potentials) {
            const matches = potential.match(regex);
            if (matches)
                result.push({ source: 'potential', index: i, text: potential, matches: matches ?? [ ], groups: matches?.groups ?? { } });
        }

    }
    return result;

}

function extractSailors(team: Team,
                        battle: Battle,
                        stageIndex: number,
                        params: RegExpOrExhaustible): SearchResult[] {

    if (!team?.units?.length)
        return [ ];

    const regex = isPlainObject(params) ? params.regex : params as RegExp;
    const result: SearchResult[] = [ ];
    for (let i of [ 5, 0, 4, 1, 3, 2 ]) {

        const unit = team.units[i];
        const sailors = Units.getSailors(unit?.id, unit?.variant);
        if (!sailors?.length) continue;

        for (let sailor of sailors) {
            const matches = sailor.match(regex);
            if (matches)
                result.push({ source: 'sailor', index: i, text: sailor, matches: matches ?? [ ], groups: matches?.groups ?? { } });
        }

    }

    if (isPlainObject(params)) {
        for (let i=0; i<stageIndex; ++i) {
            if (battle.stages?.[i]?.gimmicks?.some(g => g.type === params.exhaustedBy))
                return result.filter(s => !/once per adventure/i.test(s.text));
        }
    }

    return result;

}

function extractSpecials(team: Team,
                         regex: RegExp): SearchResult[] {

    if (!team?.units?.length)
        return [ ];

    const result: SearchResult[] = [ ];
    for (let i of [ 5, 0, 4, 1, 3, 2 ]) {

        const unit = team.units[i];
        const specials = Units.getSpecial(unit?.id, unit?.variant, unit?.llbLevel ?? 0);
        const special = specials?.length ? specials[specials.length - 1] : null;
        if (!special?.description) continue;

        const matches = special.description.match(regex);
        if (matches)
            result.push({ source: 'special', index: i, text: special.description, matches: matches ?? [ ], groups: matches?.groups ?? { } });

    }
    return result;

}

function extractSuperSpecials(team: Team,
                              regex: RegExp): SearchResult[] {

    if (!team?.units?.length)
        return [ ];

    const result: SearchResult[] = [ ];
    for (let i of [ 5, 0, 4, 1, 3, 2 ]) {

        const unit = team.units[i];
        const special = Units.getSuperSpecial(unit?.id, unit?.variant);
        if (!special?.description) continue;

        const matches = special.description.match(regex);
        if (matches)
            result.push({ source: 'super special', index: i, text: special.description, matches: matches ?? [ ], groups: matches?.groups ?? { } });

    }
    return result;

}

function extractSupports(team: Team,
                         battle: Battle,
                         stageIndex: number,
                         params: RegExpOrExhaustible): SearchResult[] {

    if (!team.units?.length)
        return [ ];

    if (isPlainObject(params)) {
        for (let i=0; i<stageIndex; ++i) {
            if (battle.stages?.[i]?.gimmicks?.some(g => g.type === params.exhaustedBy))
                return [ ];
        }
    }

    const result: SearchResult[] = [ ];
    for (let i of [ 0, 4, 1, 3, 2 ]) {

        const unit = team.units[i];
        const support = Units.getSupport(unit?.support);
        if (!support?.description) continue;

        const regex = isPlainObject(params) ? params.regex : params as RegExp;
        const matches = support.description.match(regex);
        if (matches)
            result.push({ source: 'support', index: i, text: support.description, matches: matches ?? [ ], groups: matches?.groups ?? { } });

    }
    return result;

}

function extractSwaps(team: Team,
                      regex: RegExp): SearchResult[] {

    if (!team?.units?.length)
        return [ ];

    const result: SearchResult[] = [ ];
    for (let i of [ 5, 0, 4, 1, 3, 2 ]) {

        const unit = team.units[i];
        const swap = Units.getSwap(unit?.id);
        if (!swap) continue

        let matches = swap.description.match(regex);
        if (matches)
            result.push({ source: 'switch', index: i, text: swap.description, matches: matches ?? [ ], groups: matches?.groups ?? { } });

        if (swap.super) {
            matches = swap.super.match(regex);
            if (matches)
                result.push({ source: 'super switch', index: i, text: swap.super, matches: matches ?? [ ], groups: matches?.groups ?? { } });
        }

    }
    return result;

}
