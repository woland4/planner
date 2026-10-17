import { isNullish } from 'remeda';

import { Units } from '@/utils/units.ts';

import type { Nullable } from '@/types/utils.ts';

/*---------
  Constants
  ---------*/

const ALL_CHARACTERS_REGEX = /^All (?:other )?characters?\.?/i;
const TRAILING_CHARACTERS_REGEX = / characters?\.?$/i;
const ALIASES_REGEX = /\s+\(.*?\)/g;
const TYPE_REGEX = /\[(STR|DEX|QCK|PSY|INT)]/gi;
const CLASS_REGEX = /(?:Fighter|Slasher|Striker|Shooter|Free Spirit|Powerhouse|Cerebral|Driven)/gi;
const TAG_REGEX = /\[((?!STR]|DEX]|QCK]|PSY]|INT])[^\]]+)]/gi;
const SEPARATOR_REGEX = /(?:\s*,\s*|\s+)(?:and|or)\s+|\s*,\s*|:\s*/g;
const LEFTOVERS_REGEX = /[\/\[\]]/g;

const OF_THE_FOLLOWING_REGEX = /(?:^|[.:]\s*)([^.:]*?)\s*\bof the following\b[^:]*:?\s*/i;
const COST_FIX_REGEX = /\bcharacters?\s+with\s+(?:a\s+)?cost(?:\s+of)?\b/gi;

const COST_PATTERNS: CostPattern[] = [
    {
        regex: /cost (\d+) or less/i, // Cost N or less
        ranges: m => [{ max: parseInt(m[1], 10) }]
    },
    {
        regex: /cost (\d+) or (?:more|higher)/i, // Cost N or more/higher
        ranges: m => [{ min: parseInt(m[1], 10) }]
    },
    {
        regex: /cost (\d+) or (\d+) or less/i, // Cost N or M or less
        ranges: m => [
            { min: parseInt(m[1], 10), max: parseInt(m[1], 10) },
            { max: parseInt(m[2], 10) }
        ]
    },
    {
        regex: /cost (\d+) or (\d+) or (?:more|higher)/i, // Cost N or M or more/higher
        ranges: m => [
            { min: parseInt(m[1], 10), max: parseInt(m[1], 10) },
            { min: parseInt(m[2], 10) }
        ]
    },
    {
        regex: /cost (\d+)\s*-\s*(\d+)/i, // Cost N-M
        ranges: m => [{ min: parseInt(m[1], 10), max: parseInt(m[2], 10) }]
    },
    { // Keep this last
        regex: /cost (\d+)/i, // Cost N
        ranges: m => [{ min: parseInt(m[1], 10), max: parseInt(m[1], 10) }]
    }
];

/*-----
  Types
  -----*/

export type CriteriaCheck = (unitID: number, variant: Nullable<number>) => boolean;

type CostPattern = {
    regex: RegExp;
    ranges: (m: RegExpMatchArray) => { min?: number, max?: number }[];
};

type ExtractedTerm = {
    values: string[];
    remainder: string;
};

/*-------
  Exports
  -------*/

export const Criteria = {

    parseCriteria(criteria: string): CriteriaCheck {

        const cached = criteriaCache.get(criteria);
        if (cached) return cached;

        if (ALL_CHARACTERS_REGEX.test(criteria)) {
            const result = () => true;
            criteriaCache.set(criteria, result);
            return result;
        }

        const sanitized = criteria.replace(ALIASES_REGEX, '').replace(COST_FIX_REGEX, 'cost');
        const cost = parseCostCriteria(sanitized);

        if (ALL_CHARACTERS_REGEX.test(sanitized)) {
            const result = cost?.check ?? (() => true);
            criteriaCache.set(criteria, result);
            return result;
        }

        let remaining = (cost?.matched ? sanitized.replace(cost.matched, '') : sanitized);

        const followingMatch = remaining.match(OF_THE_FOLLOWING_REGEX);
        const followingCriteria = followingMatch ? parseCriteriaTerm(followingMatch[1]) : null;

        if (followingMatch)
            remaining = remaining.slice(followingMatch[0].length);

        const terms = remaining
            .split(SEPARATOR_REGEX)
            .map(parseCriteriaTerm)
            .filter(t => !isNullish(t));

        const parts: CriteriaCheck[] = [];
        if (cost?.check) parts.push(cost.check);
        if (followingCriteria) parts.push(followingCriteria);
        if (terms.length) parts.push((unitID, variant) => terms.some(t => t(unitID, variant)));

        let result: CriteriaCheck;
        if (!parts.length) result = () => true;
        else if (parts.length === 1) result = parts[0];
        else result = (unitID, variant) => parts.every(p => p(unitID, variant));

        criteriaCache.set(criteria, result);
        return result;

    }

}

/*---------
  Internals
  ---------*/

// Criteria parse cache so we don't have to redo the parsing each time
const criteriaCache = new Map<string, CriteriaCheck>();

function parseCostCriteria(criteria: string): Nullable<{ check: CriteriaCheck, matched: string }> {

    for (const pattern of COST_PATTERNS) {

        const match = criteria.match(pattern.regex);
        if (!match) continue;

        const ranges = pattern.ranges(match);
        const check: CriteriaCheck = (unitID) => {
            const cost = Units.getCost(unitID);
            if (isNullish(cost)) return false;
            return ranges.some(r => cost >= (r.min ?? Number.MIN_SAFE_INTEGER) && cost <= (r.max ?? Number.MAX_SAFE_INTEGER));
        };

        return { check, matched: match[0] };

    }

    return null;

}

function parseCriteriaTerm(term: string): Nullable<CriteriaCheck> {

    if (!term?.trim()) return null;

    const familyCandidates = [
        term,
        term.replace(/\.$/, ''),
        term.replace(/\.$/, '').replace(TRAILING_CHARACTERS_REGEX, '')
    ];
    for (const candidate of familyCandidates) {
        if (Units.isKnownFamily(candidate)) {
            const family = normalizeString(candidate);
            return (unitID, variant) => intersects([ family ], Units.getFamilies(unitID, variant));
        }
    }

    const checks: CriteriaCheck[] = [ ];
    let remaining = term.replace(TRAILING_CHARACTERS_REGEX, '');

    const types = extractCriteriaTerm(remaining, TYPE_REGEX, m => m[1]);
    if (types.values.length) {
        checks.push((unitID, variant) => intersects(types.values, Units.getTypes(unitID, variant)));
        remaining = types.remainder;
    }

    // *BEFORE* classes
    const tags = extractCriteriaTerm(remaining, TAG_REGEX, m => m[1]);
    if (tags.values.length) {
        checks.push((unitID, variant) => intersects(tags.values, Units.getTags(unitID, variant)));
        remaining = tags.remainder;
    }

    const classes = extractCriteriaTerm(remaining, CLASS_REGEX, m => m[0]);
    if (classes.values.length) {
        checks.push((unitID, variant) => {
            const targetClasses = Units.getClasses(unitID, variant).map(normalizeString);
            return classes.values.every(c => targetClasses.includes(c));
        });
        remaining = classes.remainder;
    }

    const family = normalizeString(remaining.replace(LEFTOVERS_REGEX, ' '));
    if (family && Units.isKnownFamily(family))
        checks.push((unitID, variant) => intersects([ family ], Units.getFamilies(unitID, variant)));

    if (!checks.length) return null;
    if (checks.length === 1) return checks[0];
    return (unitID, variant) => checks.every(c => c(unitID, variant));

}

function extractCriteriaTerm(term: string,
                             regex: RegExp,
                             select: (match: RegExpMatchArray) => string): ExtractedTerm {

    const values: string[] = [ ];
    let remainder = term;

    for (const match of term.matchAll(regex)) {
        values.push(normalizeString(select(match)));
        remainder = remainder.replace(match[0], '');
    }

    return { values, remainder };

}

function intersects(values: string[],
                    targets: string[]): boolean {
    const normalizedTargets = targets.map(normalizeString);
    return values.some(v => normalizedTargets.includes(v));
}

function normalizeString(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
}
