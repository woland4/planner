import type { Nullable } from '@/types/utils.ts';

export const Numbers = {

    isFinite(value: Nullable<any>): boolean {
        return (typeof value === 'number' && Number.isFinite(value));
    },

    isInteger(value: Nullable<any>): boolean {
        return Number.isInteger(value);
    },

    isPositive(value: Nullable<any>): boolean {
        return Numbers.isFinite(value) && value > 0;
    },

    isPositiveInteger(value: Nullable<any>): boolean {
        return Numbers.isInteger(value) && value > 0;
    }

};
