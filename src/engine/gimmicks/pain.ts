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

    check({ gimmick, team, battle, stageIndex }): Nullable<GimmickCheckResult> {

        const matches = EngineNew.search(team, battle, stageIndex, {

            special: EXTRACTION_REGEX,
            superSpecial: EXTRACTION_REGEX,
            swap: EXTRACTION_REGEX,

            exhaustibleSupport: {
                searchFor: SUPPORT_REGEX,
                exhaustedBy: 'pain'
            }

        });

        const result: { index: number, source: string, turns: number }[] = [ ];
        matches.special?.forEach((match, index) =>
            result.push({ index, source: 'special', turns: Numbers.parseIntOr(match.groups.turns, 99) }));
        matches.superSpecial?.forEach((match, index) =>
            result.push({ index, source: 'super special', turns: Numbers.parseIntOr(match.groups.turns, 99) }));
        matches.swap?.forEach((matches, index) => matches.forEach(match =>
            result.push({ index, source: 'swap', turns: Numbers.parseIntOr(match.groups.turns, 99) })))
        matches.exhaustibleSupport?.forEach((match, index) =>
            result.push({ index, source: 'support', turns: Numbers.parseIntOr(match.groups.turns, 99) }));

        return {
            gimmick,
            turnsHandled: result.reduce((p,n) => p + n.turns, 0),
            details: !result.length ? [ 'Not handled' ] : result.map(({ index, source, turns }) => {
                const unit = team?.units[index]!!;
                return `${ turns } turn${ turns === 1 ? '' : 's' } reduced by ${ Html.decorateUnit(unit.id, unit.variant) }'s ${ source }`;
            })
        };

    }

} satisfies GimmickChecker<'pain'>;
