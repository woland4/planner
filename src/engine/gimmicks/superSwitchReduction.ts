import { Criteria } from '@/utils/criteria.ts';

import type { GimmickChecker, GimmickCheckResult } from '@/types/engine.ts';
import { Html } from '@/utils/html.ts';

export default {

    type: 'superSwitchReduction',

    check({ gimmick, team }): GimmickCheckResult {

        const criteriaText = gimmick
            .targets
            .map(t => t.replace(/^(STR|QCK|DEX|PSY|INT)$/, '[$1]'))
            .join(', ');

        const criteria = Criteria.parseCriteria(criteriaText);

        const result = [ ];
        for (let i of [ 5, 0, 4, 1, 3, 2 ]) {
            const unit = team?.units?.[i];
            if (unit?.id && !criteria(unit.id, unit.variant))
                result.push(`${ Html.decorateUnit(unit.id, unit.variant) } is not affected`);
        }

        return {
            gimmick,
            details: result
        };

    }

} satisfies GimmickChecker<'superSwitchReduction'>;
