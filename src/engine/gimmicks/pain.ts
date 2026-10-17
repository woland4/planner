import { Html } from '@/utils/html.ts';
import { Engine } from '@/utils/engine.ts';

import type { GimmickChecker, GimmickCheckResult } from '@/types/engine.ts';

const EXTRACTION_REGEX = /reduces ([^.]+) duration by (\d+) turn|removes ([^.]+) duration completely/i;
const TARGETED_REGEX = /\bpain\b/i;

// TODO Sailors?

/*-------
  Exports
  -------*/

export default {

    type: 'pain',

    check({ gimmick, team }): GimmickCheckResult {

        const result: { index: number, source: string, turns: number }[] = [ ];

        const specials = Engine.extractSpecials(team, EXTRACTION_REGEX);
        specials.forEach((value, index) => {
            const turns = extractTurns(value);
            if (turns > 0) result.push({ index: index, source: 'special', turns });
        });

        const superSpecials = Engine.extractSuperSpecials(team, EXTRACTION_REGEX);
        superSpecials.forEach((value, index) => {
            const turns = extractTurns(value);
            if (turns > 0) result.push({ index: index, source: 'super special', turns });
        });

        const swaps = Engine.extractSwaps(team, EXTRACTION_REGEX);
        swaps.forEach((value, index) => {
            const turns = extractTurns(value);
            if (turns > 0) result.push({ index: index, source: 'swap', turns });
        });

        return {
            gimmick,
            turnsHandled: result.reduce((p,n) => p + n.turns, 0),
            details: result.map(({ index, source, turns }) => {
                const unit = team?.units[index]!!;
                return `${ turns } turn${ turns === 1 ? '' : 's' } reduced by ${ Html.decorateUnit(unit.id, unit.variant) }'s ${ source }`;
            })
        };

    }

} satisfies GimmickChecker<'pain'>;

/*---------
  Internals
  ---------*/

function extractTurns(value: string): number {
    const matches = value.match(EXTRACTION_REGEX);
    if (!matches) return 0;
    if (!TARGETED_REGEX.test(matches[1]) && !TARGETED_REGEX.test(matches[3])) return 0;
    return matches[2] ? parseInt(matches[2], 10) : 99;
}
