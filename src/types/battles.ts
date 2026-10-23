import type { Type } from '@/types/enums.ts';
import type { Gimmick } from '@/types/gimmicks.ts';
import type { Nullable } from '@/types/utils.ts';

/*-------
  Battles
  -------*/

export type Battle = {
    boosters?: Booster[];
    stages: Stage[];
};

export type Booster = {
    ids: number[];
    pureMultiplier?: number;
    additiveMultiplier?: number;
};

export type Stage = {
    enemies?: Enemy[];
    gimmicks?: Gimmick[];
};

export type Enemy = {
    types: Type[];
    count?: number;
};

/*-----
  Teams
  -----*/

export type Team = {

    units: [
        Nullable<TeamUnit>,
        Nullable<TeamUnit>,
        Nullable<TeamUnit>,
        Nullable<TeamUnit>,
        Nullable<TeamUnit>,
        Nullable<TeamUnit>
    ];

};

export type TeamUnit = {
    id: number;
    variant?: Nullable<number>;
    support?: Nullable<number>;
    llbLevel?: Nullable<number>;
};

export type SavedTeam = { name: string } & Team;
