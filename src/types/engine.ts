import type { Gimmick, GimmickEffectType } from '@/types/gimmicks.ts';
import type { GimmickType } from '@/types/enums.ts';
import type { Battle, Team } from '@/types/battles.ts';
import type { Nullable } from '@/types/utils.ts';

export type TeamCompositionIssue = {
    index: number;
    issue: string;
};

export type GimmickChecker<T extends GimmickEffectType = GimmickEffectType> = {
    type: GimmickType;
    check?: (data: { gimmick: GimmickOf<T>, battle: Battle, stageIndex: number, team: Nullable<Team> }) => GimmickCheckResult
};

export type GimmickCheckResult = {
    gimmick: Gimmick;
    turnsHandled?: number;
    details?: string[];
};

type GimmickOf<T extends GimmickEffectType> = Extract<Gimmick, { type: T }>;
