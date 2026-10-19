import type { GimmickChecker, GimmickCheckResult } from '@/types/engine.ts';
import type { Nullable } from '@/types/utils.ts';

/**
 * Sources of resolution:
 * - Captains/specials/supers/swaps (reduces ATK down duration by)
 * - Reactive supports (when an enemy inflicts you with ATK down, reduces ATK down duration)
 * - Active supports (when an enemy inflicts you with ATK down ... reduces ATK down duration)
 * - Reactive supports (when the support character uses ... reduces ATK down duration)
 * - Round-based supports (when you reach ... reduces ATK down duration)
 */

/*-------
  Exports
  -------*/

export default {

    type: 'attackDown',

    check(context): Nullable<GimmickCheckResult> {

        return {
            gimmick: context.gimmick,
            details: [ ]
        };

    }

} satisfies GimmickChecker<'attackDown'>;
