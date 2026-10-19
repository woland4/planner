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

    check({ gimmick, team, battle, stageIndex }): Nullable<GimmickCheckResult> {

        const matches = EngineNew.search(team, battle, stageIndex, {
            special: /removes target lock duration completely/i
        });

        return {
            gimmick,
            turnsHandled: matches.special?.size ?? 0 > 0 ? 99 : 0,
            details: !matches.special?.size ? [ 'Not handled' ] : [ ...matches.special.keys() ].map(unitID => {
                const unit = team?.units[unitID]!!;
                return `Removed by ${ Html.decorateUnit(unit.id, unit.variant) }'s special`;
            })
        };
    }

} satisfies GimmickChecker<'targetLock'>;
