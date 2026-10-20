import { Html } from '@/utils/html.ts';
import { EngineNew } from '@/utils/engine.new.ts';

import { Numbers } from '@/utils/numbers.ts';

import type { GimmickChecker, GimmickCheckResult } from '@/types/engine.ts';
import type { Nullable } from '@/types/utils.ts';

/**
 * Sources of resolution:
 * - Damage-reducing captain (reduces any damage received above / reduces damage received by 100%)
 * - Damage-reducing special/supers/swaps (reduces any damage received above / reduces damage received by)
 * - Healing captains TODO
 * - Healing specials/supers/swaps TODO
 */

const CAPTAIN_REGEX = /reduces any damage received|reduces damage received by (?<nullification>100%) for \d+ attack/i;
const OTHER_REGEX = /reduces(?: any)? damage received.*?by (?<reduction>[\d.?%]+)/i;

/*-------
  Exports
  -------*/

export default {

    type: 'damage',

    check(context): Nullable<GimmickCheckResult> {

        if (context.gimmick.activation === 'preemptive') {
            return {
                gimmick: context.gimmick,
                details: [ 'Not supported' ]
            };
        }

        const matches = EngineNew.search(context, {
            captain: CAPTAIN_REGEX,
            special: OTHER_REGEX,
            superSpecial: OTHER_REGEX,
            swap: OTHER_REGEX
        });

        const requiresNullification = Numbers.isPositive(context.gimmick.percentage);

        const result: { index: number, source: string, reduction?: boolean, amount: Nullable<string> }[] = [ ];
        matches.forEach(match => {
            const amount = match.groups.nullification ? '100%' : (match.groups.reduction ?? null);
            if (requiresNullification && amount !== '100%') return;
            result.push({
                index: match.index,
                source: match.source,
                amount
            });
        });

        return {
            gimmick: context.gimmick,
            details: !result.length ? [ 'Not handled' ] : result.map(({ index, source, amount }) => {
                const unit = context.team.units[index]!;
                return `Reduced${ amount ? ' by ' + amount : '' } by ${ Html.decorateUnit(unit.id, unit.variant) }'s ${ source }`;
            })
        };

    }

} satisfies GimmickChecker<'damage'>;
