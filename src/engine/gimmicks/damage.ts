import { Html } from '@/utils/html.ts';
import { Engine } from '@/utils/engine.ts';

import { Numbers } from '@/utils/numbers.ts';

import type { GimmickChecker, GimmickCheckResult } from '@/types/engine.ts';
import type { Nullable } from '@/types/utils.ts';

/**
 * Sources of resolution:
 * - Captain abilities (reduces any damage received above / reduces damage received by 100%)
 * - Special/supers/swaps (reduces any damage received above / reduces damage received by)
 */

const CAPTAIN_REGEX = /reduces any damage received|reduces damage received by 100% for (\d+) attack/i;
const OTHER_REGEX = /reduces(?: any)? damage received.*?by ([\d.?%]+)/i;

/*-------
  Exports
  -------*/

export default {

    type: 'damage',

    check({ gimmick, team, battle, stageIndex }): Nullable<GimmickCheckResult> {

        if (gimmick.activation === 'preemptive' || Numbers.isPositive(gimmick.percentage))
            return null;

        const result: { index: number, source: string, reduction?: string }[] = [ ];

        const captains = Engine.extractExhaustibleCaptains(team, CAPTAIN_REGEX, battle, stageIndex - 1, 'damage');
        captains.forEach((_, index) => {
            result.push({ index: index, source: 'captain' });
        });

        const specials = Engine.extractSpecials(team, OTHER_REGEX);
        specials.forEach((value, index) => {
            result.push({ index: index, source: 'special', reduction: extractReduction(value) });
        });

        const superSpecials = Engine.extractSuperSpecials(team, OTHER_REGEX);
        superSpecials.forEach((value, index) => {
            result.push({ index: index, source: 'super special', reduction: extractReduction(value) });
        });

        const swaps = Engine.extractSwaps(team, OTHER_REGEX);
        swaps.forEach((value, index) => {
            result.push({ index: index, source: 'swap', reduction: extractReduction(value) });
        });

        return {
            gimmick,
            details: !result.length ? [ 'Not handled' ] : result.map(({ index, source, reduction }) => {
                const unit = team.units[index]!;
                return `Reduced${ reduction ? ' by ' + reduction : '' } by ${ Html.decorateUnit(unit.id, unit.variant) }'s ${ source }`;
            })
        };

    }

} satisfies GimmickChecker<'damage'>;

/*---------
  Internals
  ---------*/

function extractReduction(value: string): string {
    return value.match(OTHER_REGEX)?.[1] ?? '???';
}

