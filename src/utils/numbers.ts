import type { Nullable } from '@/types/utils.ts';
import { isNullish } from 'remeda';

export const Numbers = {

    isFinite(value: unknown): value is number {
        return (typeof value === 'number' && Number.isFinite(value));
    },

    isInteger(value: unknown): value is number {
        return Number.isInteger(value);
    },

    isPositive(value: unknown): value is number {
        return Numbers.isFinite(value) && value > 0;
    },

    isPositiveInteger(value: unknown): value is number {
        return Numbers.isInteger(value) && value > 0;
    },

    parseIntOr(value: Nullable<string>, defaultIfNaN: number): number {
        if (isNullish(value) || !/^\d+$/.test(value)) return defaultIfNaN;
        const result = parseInt(value, 10);
        return isNaN(result) ? defaultIfNaN : result;
    }

};
