import type { Gimmick, GimmickEffectType } from '@/types/gimmicks.ts';
import type { GimmickType } from '@/types/enums.ts';
import type { Team } from '@/types/battles.ts';
import type { Nullable } from '@/types/utils.ts';

export type TeamCompositionIssue = {
    index: number;
    issue: string;
};

export type GimmickChecker<T extends GimmickEffectType = GimmickEffectType> = {
    type: GimmickType;
    check: (gimmick: GimmickOf<T>, team: Nullable<Team>) => GimmickCheckResult
};

export type GimmickCheckResult = {
    gimmick: Gimmick;
    status: GimmickCheckStatus;
    details?: string[];
};

export type GimmickCheckStatus =
    | 'handled'
    | 'unhandled'
    | 'ignored'
    | 'advisory';

type GimmickOf<T extends GimmickEffectType> = Extract<Gimmick, { type: T }>;
