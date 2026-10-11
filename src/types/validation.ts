export type BattleValidation = {
    issues: BattleIssues;
    boosters: BoosterIssues[];
    stages: StageValidation[];
};

export type StageValidation = {
    issues: StageIssues;
    enemies: EnemyIssues[];
    gimmicks: GimmickIssues[];
};

export type BattleIssues = string[];

export type StageIssues = string[];

export type BoosterIssues = string[];

export type EnemyIssues = string[];

export type GimmickIssues = string[];
