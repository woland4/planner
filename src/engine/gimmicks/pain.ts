import { EngineNew } from '@/utils/engine.new.ts';
import { Numbers } from '@/utils/numbers.ts';
import { Html } from '@/utils/html.ts';

import type { GimmickChecker, GimmickCheckResult } from '@/types/engine.ts';
import type { Nullable } from '@/types/utils.ts';

/**
 * Sources of resolution:
 * - Specials (reduces pain duration by N turns / removes pain duration completely)
 * - Super specials (same as above)
 * - Swaps? (same as above)
 * - Captain abilities? TODO? There are none so far
 */

const EXTRACTION_REGEX = new RegExp([
    EngineNew.Regexes.reducesDuration('pain'),
    EngineNew.Regexes.removesDuration('pain'),
].join('|'), 'i');

const SUPPORT_REGEX = new RegExp([
    `${ EngineNew.Regexes.whenInflictedWith('pain') }.*?${ EngineNew.Regexes.reducesDuration('pain') }`,
    `${ EngineNew.Regexes.whenInflictedWith('pain') }.*?${ EngineNew.Regexes.removesDuration('pain') }`
].join('|'), 'i');

/*-------
  Exports
  -------*/

export default {

    type: 'pain',

    check(context): Nullable<GimmickCheckResult> {

        const matches = EngineNew.search(context, {

            special: EXTRACTION_REGEX,
            superSpecial: EXTRACTION_REGEX,
            swap: EXTRACTION_REGEX,

            exhaustibleSupport: {
                searchFor: SUPPORT_REGEX,
                exhaustedBy: 'pain'
            }

        });

        const result: { index: number, source: string, turns: number }[] = [ ];
        matches.forEach(match => {
            result.push({
                index: match.index,
                source: match.source,
                turns: Numbers.parseIntOr(match.groups.turns, 99)
            });
        });

        return {
            gimmick: context.gimmick,
            turnsHandled: result.reduce((p,n) => p + n.turns, 0),
            details: !result.length ? [ 'Not handled' ] : result.map(({ index, source, turns }) => {
                const unit = context.team.units[index]!!;
                return `${ turns } turn${ turns === 1 ? '' : 's' } reduced by ${ Html.decorateUnit(unit.id, unit.variant) }'s ${ source }`;
            })
        };

    }

} satisfies GimmickChecker<'pain'>;
