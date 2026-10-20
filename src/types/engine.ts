import type { Gimmick } from '@/types/gimmicks.ts';
import type { GimmickType } from '@/types/enums.ts';
import type { Battle, Team } from '@/types/battles.ts';
import type { Nullable } from '@/types/utils.ts';

export type TeamCompositionIssue = {
    index: number;
    issue: string;
};

export type GimmickChecker<T extends GimmickType = GimmickType> = {
    type: GimmickType;
    check?: (data: GimmickCheckContext<T>) => Nullable<GimmickCheckResult>
};

export type GimmickCheckContext<T extends GimmickType> = {
    gimmick: GimmickOf<T>;
    battle: Battle;
    stageIndex: number;
    team: Team;
};

export type GimmickCheckResult = {
    gimmick: Gimmick;
    turnsHandled?: number;
    details?: string[];
};

type GimmickOf<T extends GimmickType> = Extract<Gimmick, { type: T }>;
