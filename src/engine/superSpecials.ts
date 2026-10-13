import { isNullish, unique } from 'remeda';

import { Units } from '@/utils/units.ts';
import { Bulletizer } from '@/utils/bulletizer.ts';
import { Criteria } from '@/utils/criteria.ts';
import { Html } from '@/utils/html.ts';

import type { Team, TeamUnit } from '@/types/battles.ts';
import type { Nullable } from '@/types/utils.ts';

/**
 *
 * Possible grammar:
 *
 * type :=
 *     | [STR]
 *     | [QCK]
 *     | [DEX]
 *     | [PSY]
 *     | [INT]
 *
 * class :=
 *     | Fighter
 *     | Slasher
 *     | Striker
 *     | Shooter
 *     | Free Spirit
 *     | Driven
 *     | Cerebral
 *     | Powerhouse
 *
 * characterOrFamily :=
 *     | <any string>
 *
 * tag :=
 *     | [<any string>]
 *
 * typeOrClassOrTag :=
 *     | <type>
 *     | <class>
 *     | <tag>
 *
 * typesOrClassOrTagList :=
 *     | <typeOrClassOrTag>
 *     | <typeOrClassOrTag>(, <typeOrClassOrTag>){0,} or <typeOrClassOrTag>
 *
 * target :=
 *     | <type>( characters)?
 *     | <class>( characters)?
 *     | <characterOrFamily>
 *     | <tag>( characters)?
 *
 * targets :=
 *     | <target>(, <target>){0,}
 *     | <target>(, <target>){0,} or <target>
 *     | <target>(, <target>){0,}, or <target>
 *
 * clause :=
 *     | your crew must consist of any N of the following, excluding supports and counting only 1 per unit: <targets>
 *     | your crew must consist of any N of the following, excluding supports: <targets>
 *     | your crew must consist of <characterOrFamily>
 *     | your crew must consist of N <typesOrClassOrTagList> characters?
 *     | your crew must consist of N+ <typesOrClassOrTagList> characters?
 *
 * clauses :=
 *     | {clause}( and {clause}){0,}
 *     | {clause}( or {clause}){0,}
 *
 */

/*-----
  Types
  -----*/

type ClauseResult = 'met' | 'unmet' | 'unknown';

/*---------
  Constants
  ---------*/

const KNOWN_BULLETS = [
    /must be captain/i,
    /can be launched/i,
    /crew must consist/i,

];

/*-------
  Exports
  -------*/

export function checkSuperSpecialIssues(team: Nullable<Team>): string[] {
    if (!team?.units?.length) return [ ];
    return unique(team.units
        .map((u, n) => checkSuperSpecial(u, n === 0 || n === 5, team))
        .filter(i => !isNullish(i)));
}

/*---------
  Internals
  ---------*/

// TODO LLB support?
function checkSuperSpecial(unit: Nullable<TeamUnit>,
                           isCaptain: boolean,
                           team: Team): Nullable<string> {

    if (!unit?.id) return null;

    const condition = Units.getSuperSpecial(unit.id, unit.variant)?.criteria;
    if (!condition) return null;

    const sanitizedCondition = condition.replace(/when character becomes.+?during captain shift and/i, '');
    const bullets = Bulletizer.split(sanitizedCondition);
    if (bullets.some(b => /must be captain/i.test(b)) && !isCaptain) return null;

    const targetBullets = bullets.filter(b => /crew must consist/i.test(b));
    if (!targetBullets?.length)
        return `${ Html.decorateUnit(unit.id, unit.variant) } *may* not meet the conditions for its super special, manual checking is required`;

    let result: ClauseResult = 'met';
    for (const targetBullet of targetBullets) {
        const clauses = splitClauses(targetBullet);
        if (!clauses.length)
            result = combineClauseResults(result, 'and', 'unknown');
        else {
            let subResult = checkSingleClause(clauses[0], team);
            for (let i=1; i<clauses.length-1; i+=2) {
                const next = checkSingleClause(clauses[i + 1], team);
                subResult = combineClauseResults(subResult, clauses[i].toLowerCase(), next);
            }
            result = combineClauseResults(result, 'and', subResult);
        }
    }

    const unknownBullets = bullets.filter(b => !KNOWN_BULLETS.some(k => k.test(b)));
    if (unknownBullets.length && result === 'met')
        result = 'unknown';

    if (result === 'met')
        return null;
    else if (result === 'unmet')
        return `${ Html.decorateUnit(unit.id, unit.variant) } does not meet the conditions for its super special`;
    else
        return `${ Html.decorateUnit(unit.id, unit.variant) } *may* not meet the conditions for its super special, manual checking is required`;

}

// For single-clause statements: (hopefully) returns the statement itself (single-element array)
// For N-clause statements: (hopefully) returns the statements interleaved with their logical operator (2N-1 elements)
function splitClauses(input: string): string[] {
    return input
        .trim()
        .split(/(?:^|[,.]?\s+)(and|or)\s+(?=(?:your\s+)?crew must consist\b)/i)
        .map(s => s.trim())
        .filter(s => s.length > 0);
}

function checkSingleClause(clause: string,
                           team: Team): ClauseResult {

    const requirements = (
        clause.match(/(?:unit|supports): (.+)/i)?.[1] ??
        clause.match(/consist of (.+)/i)?.[1]
    )?.replace(/^\d+\+?\s+/, '');
    if (!requirements) return 'unknown';

    const criteria = Criteria.parseCriteria(requirements);
    const unitsMatchingCriteria = team.units.reduce((p,n) => {
        if (!n?.id || !criteria(n.id, n.variant)) return p;
        else return p + 1;
    }, 0);

    const requiredNumber = (
        clause.match(/of any (\d+) of the/i)?.[1] ??
        clause.match(/consist of (\d+)\+?/i)?.[1] ??
        '1'
    );

    if (unitsMatchingCriteria >= parseInt(requiredNumber, 10)) return 'met';
    else return 'unmet';

}

function combineClauseResults(left: ClauseResult,
                              operator: string,
                              right: ClauseResult): ClauseResult {
    if (operator === 'or') {
        if (left === 'met' || right === 'met') return 'met';
        if (left === 'unmet' && right === 'unmet') return 'unmet';
        return 'unknown';
    } else if (operator === 'and') {
        if (left === 'unmet' || right === 'unmet') return 'unmet';
        if (left === 'met' && right === 'met') return 'met';
        return 'unknown';
    } else
        return 'unknown';
}
