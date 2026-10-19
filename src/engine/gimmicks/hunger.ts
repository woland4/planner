import { EngineNew } from '@/utils/engine.new.ts';
import { Numbers } from '@/utils/numbers.ts';
import { Html } from '@/utils/html.ts';

import type { GimmickChecker, GimmickCheckResult } from '@/types/engine.ts';
import type { Nullable } from '@/types/utils.ts';

/**
 * Sources of resolution:
 * - Potential abilities (reduces hunger stack by N stack(s))
 * - Special/supers/swaps that give RCV orbs? TODO
 */

export default {

    type: 'hunger',

    check({ gimmick, team, battle, stageIndex }): Nullable<GimmickCheckResult> {

        const matches = EngineNew.search(team, battle, stageIndex, {
            potential: /reduces hunger stack by (?<stacks>\d+) stack/i
        });

        let turnsHandled = 0;
        const details: string[] = [ ];

        matches.potential?.forEach((matches, index) => matches.forEach(match => {

            const stacks = Numbers.parseIntOr(match.groups.stacks, 99);
            turnsHandled += stacks;

            const unit = team?.units[index]!!;
            details.push(`${ stacks } stack${ stacks === 1 ? '' : 's' } reduced by ${ Html.decorateUnit(unit.id, unit.variant) }'s potential ability`);

        }));

        return {
            gimmick,
            turnsHandled,
            details: !details.length ? [ 'Not handled' ] : details
        };

    }

} satisfies GimmickChecker<'hunger'>;
