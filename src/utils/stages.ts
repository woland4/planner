import { isArray, isNullish } from 'remeda';

import { Enemies } from '@/utils/enemies.ts';
import { Gimmicks } from '@/utils/gimmicks.ts';

import type { Stage } from '@/types/battles.ts';
import type { StageIssues } from '@/types/validation.ts';
import type { Nullable } from '@/types/utils.ts';

export const Stages = {

    sanitizeStage(stage: Nullable<Stage>): Stage {

        if (isNullish(stage))
            return { enemies: [ ], gimmicks: [ ] };

        if (!isArray(stage.enemies)) stage.enemies = [ ];
        else stage.enemies = stage.enemies.map(Enemies.sanitizeEnemy).filter(x => !isNullish(x));

        if (!isArray(stage.gimmicks)) stage.gimmicks = [ ];
        else stage.gimmicks = stage.gimmicks.map(Gimmicks.sanitizeGimmick).filter(x => !isNullish(x));

        return stage;

    },

    validateStage(stage: Nullable<Stage>): StageIssues {

        if (isNullish(stage))
            return [ 'Null or undefined stage' ];

        return [ ];

    }

}
