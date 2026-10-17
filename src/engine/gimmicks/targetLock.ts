import { Html } from '@/utils/html.ts';
import { Engine } from '@/utils/engine.ts';

import type { GimmickChecker, GimmickCheckResult } from '@/types/engine.ts';

const TARGET_LOCK_REGEX = /removes target lock duration completely/i;

export default {

    type: 'targetLock',

    check({ gimmick, team }): GimmickCheckResult {
        const specials = Engine.extractSpecials(team, TARGET_LOCK_REGEX);
        return {
            gimmick,
            turnsHandled: specials.size > 0 ? 99 : 0,
            details: [ ...specials.keys() ].map(unitID => {
                const unit = team?.units[unitID]!!;
                return `Removed by ${ Html.decorateUnit(unit.id, unit.variant) }'s special`;
            })
        };
    }

} satisfies GimmickChecker<'targetLock'>;
