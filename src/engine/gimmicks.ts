import { indexBy } from 'remeda';

import type { Stage, Team } from '@/types/battles.ts';
import type { Nullable } from '@/types/utils.ts';
import type { GimmickChecker, GimmickCheckResult } from '@/types/engine.ts';

/*-------
  Exports
  -------*/

export function checkGimmicks(stage: Nullable<Stage>,
                              team: Nullable<Team>): GimmickCheckResult[] {

    if (!stage?.gimmicks?.length)
        return [ ];

    const result = [ ];
    for (let gimmick of stage.gimmicks) {
        const checker = indexedCheckers[gimmick.type];
        if (checker)
            result.push(checker.check(gimmick, team));
    }

    return result;

}

/*---------
  Internals
  ---------*/

const modules = import.meta.glob<{ default: GimmickChecker }>('@/engine/gimmicks/*.ts', { eager: true });

const checkers = Object.values(modules).map(m => m.default);
const indexedCheckers = indexBy(checkers, c => c.type);
