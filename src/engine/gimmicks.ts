import { indexBy, isNullish } from 'remeda';

import type { Battle, Team } from '@/types/battles.ts';
import type { Nullable } from '@/types/utils.ts';
import type { GimmickChecker, GimmickCheckResult } from '@/types/engine.ts';

/*-------
  Exports
  -------*/

export function checkGimmicks(battle: Nullable<Battle>,
                              stageIndex: number,
                              team: Nullable<Team>): GimmickCheckResult[] {

    const stage = battle?.stages?.[stageIndex];
    if (!stage?.gimmicks?.length)
        return [ ];

    const result: Nullable<GimmickCheckResult>[] = [ ];
    for (let gimmick of stage.gimmicks) {
        const checker = indexedCheckers[gimmick.type];
        if (checker?.check) {
            result.push(checker.check({
                gimmick,
                battle: battle!!,
                stageIndex,
                team: team ?? { units: [ null, null, null, null, null, null ] }
            }));
        }
    }

    return result
        .filter(r => !isNullish(r))
        .filter(r => r?.details?.length || !isNullish(r?.turnsHandled));

}

/*---------
  Internals
  ---------*/

const modules = import.meta.glob<{ default: GimmickChecker }>('@/engine/gimmicks/*.ts', { eager: true });

const checkers = Object.values(modules).map(m => m.default);
const indexedCheckers = indexBy(checkers, c => c.type);
