import type { BattleValidation, StageValidation } from '@/types/validation.ts';
import type { Nullable } from '@/types/utils.ts';

export const Validations = {

    hasBoosterIssues(validation: Nullable<BattleValidation>): boolean {
        return !!validation?.boosters?.some(b => b?.length > 0);
    },

    hasStageIssues(validation: Nullable<StageValidation>): boolean {
        return !!(
            (validation?.issues?.length ?? 0) > 0 ||
            validation?.enemies?.some?.(e => e?.length > 0) ||
            validation?.gimmicks?.some?.(g => g?.length > 0)
        );
    }

};
