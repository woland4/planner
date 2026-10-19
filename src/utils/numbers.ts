import type { Nullable } from '@/types/utils.ts';
import { isNullish } from 'remeda';

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
    },

    parseIntOr(value: Nullable<string>, defaultIfNaN: number): number {
        if (isNullish(value) || !/^\d+$/.test(value)) return defaultIfNaN;
        const result = parseInt(value, 10);
        return isNaN(result) ? defaultIfNaN : result;
    }

};
