import { isArray, isNullish } from 'remeda';

import { Numbers } from '@/utils/numbers.ts';
import { Enums } from '@/utils/enums.ts';

import type { Enemy } from '@/types/battles.ts';
import type { Nullable } from '@/types/utils.ts';
import type { EnemyIssues } from '@/types/validation.ts';

export const Enemies = {

    sanitizeEnemy(enemy: Nullable<Enemy>): Enemy {

        if (isNullish(enemy))
            return { types: [ ], count: 1 };

        if (!isArray(enemy.types))
            enemy.types = [ ];
        else
            enemy.types = enemy.types.filter(t => Enums.types.includes(t));

        if (!Numbers.isPositiveInteger(enemy.count))
            enemy.count = 1;

        return enemy;

    },

    validateEnemy(enemy: Nullable<Enemy>): EnemyIssues {

        if (isNullish(enemy))
            return [ 'Null or undefined enemy' ];

        const result = [ ];

        if (enemy.types?.length > 2)
            result.push('Invalid enemy types');
        if (!Numbers.isPositiveInteger(enemy.count))
            result.push('Invalid enemy count');

        return result;

    }

};
