import type { GimmickChecker, GimmickCheckResult } from '@/types/engine.ts';
import { Html } from '@/utils/html.ts';
import { Units } from '@/utils/units.ts';
import { isNullish } from 'remeda';

const HUNGER_REGEX = /reduces hunger stack by (\d+) stack/i;

export default {

    type: 'hunger',

    check(gimmick, team): GimmickCheckResult {

        let covered = 0;
        const details = [ ];

        for (let index of [ 5, 0, 4, 1, 3, 2 ]) {

            const unit = team?.units?.[index];
            if (!unit) continue;

            const potentials = Units.getPotentials(unit?.id);
            if (!potentials.length) continue;

            const reduction = potentials
                .map(p => p.match(HUNGER_REGEX)?.[1])
                .filter(m => !isNullish(m))
                .map(p => parseInt(p, 10))
                .reduce((p,n) => p + n, 0);
            if (reduction <= 0) continue;

            covered += reduction;
            details.push(`${ reduction } turn${ reduction === 1 ? '' : 's' } reduced by ${ Html.decorateUnit(unit.id, unit.variant) }`);

        }

        return {
            gimmick,
            status: covered >= (gimmick.turns ?? 0) ? 'handled' : 'unhandled',
            details
        };

    }

} satisfies GimmickChecker<'hunger'>;
