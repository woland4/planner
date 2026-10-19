import { EngineNew } from '@/utils/engine.new.ts';
import { Html } from '@/utils/html.ts';

import type { GimmickChecker, GimmickCheckResult } from '@/types/engine.ts';
import type { Nullable } from '@/types/utils.ts';

/**
 * Sources of resolution:
 * - Specials (removes target lock duration completely)
 */

export default {

    type: 'targetLock',

    check(context): Nullable<GimmickCheckResult> {

        const matches = EngineNew.search(context, {
            special: /removes target lock duration completely/i
        });

        return {
            gimmick: context.gimmick,
            turnsHandled: matches.length ? 99 : 0,
            details: !matches.length ? [ 'Not handled' ] : matches.map(match => {
                const unit = context.team.units[match.index]!!;
                return `Removed by ${ Html.decorateUnit(unit.id, unit.variant) }'s special`;
            })
        };
    }

} satisfies GimmickChecker<'targetLock'>;
