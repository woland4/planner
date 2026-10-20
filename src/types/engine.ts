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



export type SearchParams = {
    captain?: SearchParamsField;
    potential?: SearchParamsField;
    sailor?: SearchParamsField;
    special?: SearchParamsField;
    superSpecial?: SearchParamsField;
    support?: SearchParamsField;
    swap?: SearchParamsField;
};

export type SearchParamsField = {
    effect: RegExp;
    conditions?: SearchParamsCondition[];
};

export type SearchParamsCondition = {
    regex: string;
    resolve?: (context: GimmickCheckContext<any>, match: SearchResult) => SearchResultConfidence;
}

export type SearchResult = {

    source:
        | 'captain'
        | 'potential'
        | 'sailor'
        | 'special'
        | 'super special'
        | 'super switch'
        | 'support'
        | 'switch';
    conditional?: boolean;

    index: number;
    text: string;
    matches: string[];
    groups: Record<string, Nullable<string>>;

};

export type SearchResultCandidate = {
    source: SearchResult['source'];
    index: number;
    text: string;
}

export type SearchResultConfidence =
    | 'certain' // *WILL* trigger
    | 'conditional' // *MAY* trigger depending on the player
    | 'none'; // *WILL NOT* trigger
