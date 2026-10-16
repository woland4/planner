import { isNullish } from 'remeda';

import { Units } from '@/utils/units.ts';

import type { Team, TeamUnit } from '@/types/battles.ts';
import type { TeamCompositionIssue } from '@/types/engine.ts';
import type { Nullable } from '@/types/utils.ts';

/**
 *
 * Possible grammar:
 *
 * position :=
 *    | middle-left
 *    | middle-right
 *    | bottom-left
 *    | bottom-right
 *
 * clauses :=
 *    | if <any string> is your <position> unit and switches
 *
 */

/*-------
  Exports
  -------*/

export function checkCaptainShiftIssues(team: Nullable<Team>): TeamCompositionIssue[] {
    if (!team?.units?.length) return [ ];
    return team.units
        .map((u, n) => checkCaptainShift(u, n))
        .filter(i => !isNullish(i));
}

/*---------
  Internals
  ---------*/

function checkCaptainShift(unit: Nullable<TeamUnit>,
                           unitIndex: number): Nullable<TeamCompositionIssue> {

    if (!unit?.id) return null;

    const condition = Units.getSwap(unit.id)?.description;
    if (!condition) return null;

    const matches = condition.match(/is your (middle|bottom).(left|right)/);
    if (!matches) return null;

    const [ _, row, column ] = matches;
    let requiredIndex;
    if (row === 'middle') requiredIndex = column === 'left' ? 4 : 1;
    else requiredIndex = column === 'left' ? 3 : 2;

    if (requiredIndex === unitIndex)
        return null;
    else
        return { index: unitIndex, issue: 'Not in the correct position for captain shift' };

}
