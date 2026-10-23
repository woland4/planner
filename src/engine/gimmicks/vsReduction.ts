import { Criteria } from '@/utils/criteria.ts';

import { Html } from '@/utils/html.ts';

import type { GimmickChecker, GimmickCheckResult } from '@/types/engine.ts';
import type { Nullable } from '@/types/utils.ts';

export default {

    type: 'vsReduction',

    check(context): Nullable<GimmickCheckResult> {

        const criteriaText = context.gimmick
            .targets
            .map(t => t.replace(/^(STR|QCK|DEX|PSY|INT)$/, '[$1]'))
            .join(', ');

        const criteria = Criteria.parseCriteria(criteriaText);

        const result = [ ];
        for (const i of [ 5, 0, 4, 1, 3, 2 ]) {
            const unit = context.team.units?.[i];
            if (unit?.id && !criteria(unit.id, unit.variant))
                result.push(`${ Html.decorateUnit(unit.id, unit.variant) } is not affected`);
        }

        return {
            gimmick: context.gimmick,
            details: result
        };

    }

} satisfies GimmickChecker<'vsReduction'>;
