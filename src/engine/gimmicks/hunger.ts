import { Html } from '@/utils/html.ts';
import { Engine } from '@/utils/engine.ts';

import type { GimmickChecker, GimmickCheckResult } from '@/types/engine.ts';

// TODO Check for specials/supers/swaps that give RCV orbs?

const HUNGER_REGEX = /reduces hunger stack by (\d+) stack/i;

export default {

    type: 'hunger',

    check({ gimmick, team }): GimmickCheckResult {

        let turnsHandled = 0;
        const details: string[] = [ ];

        Engine.extractPotentials(team, HUNGER_REGEX).forEach((potentials, unitID) => {
            const unit = team?.units[unitID]!!;
            const turns = parseInt(potentials[0].match(HUNGER_REGEX)!![1], 10);
            turnsHandled += turns;
            details.push(`${ turns } turn${ turns === 1 ? '' : 's' } reduced by ${ Html.decorateUnit(unit.id, unit.variant) }'s potential ability`);
        });

        return {
            gimmick,
            turnsHandled,
            details
        };

    }

} satisfies GimmickChecker<'hunger'>;
