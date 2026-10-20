import type { GimmickType, Timing } from '@/types/enums.ts';
import type { Nullable } from '@/types/utils.ts';
import { isEmptyish, omit } from 'remeda';

/*-------------
  Configuration
  -------------*/

const IGNORABLE_SUPPORT_EFFECTS = [
    /reduces damage received from [^.]+ by [\d.]%\./i,
    /adds [\d.]+% of this character's base [a-z\s,]+ to the supported character's base [a-z\s,]+\./i,
];

const SEGMENT_REGEXES = {
    oncePerAdventure: /once per adventure,? /i,
    whenSpecialUsed: /when the supported character uses (.+)/i,
    whenPlayerDebuffed: /when (?:an|the) enemy inflicts you with (.+)/i,
    whenEnemyBuffed: /when (?:an|the) enemy gains (.+)/i,
    whenStageReached: /when you reach (.+)/i,
    whenTimingHit: /when the supported character hits (.+)/i
}

const INFLICTABLE_DEBUFFS: { text: string, gimmick: GimmickType }[] = [
    { text: 'atk down', gimmick: 'attackDown' },
    { text: 'bind', gimmick: 'bind' },
    { text: 'burn', gimmick: 'burn' },
    { text: 'blindness', gimmick: 'blindness' },
    { text: 'chain coefficient reduction', gimmick: 'chainGrowthDown' },
    { text: 'chain multiplier limit', gimmick: 'chainLock' },
    { text: 'despair', gimmick: 'despair' },
    { text: 'increase damage taken', gimmick: 'increasedDamage' },
    { text: 'orb manipulation', gimmick: 'slotChange' },
    { text: 'orb randomization', gimmick: 'slotChange' },
    { text: 'pain', gimmick: 'pain' },
    { text: 'paralysis', gimmick: 'paralysis' },
    { text: 'poison', gimmick: 'poison' },
    { text: 'special bind', gimmick: 'specialBind' },
    { text: 'special rewind', gimmick: 'specialReverse' },
    { text: 'strong poison', gimmick: 'poison' },
    { text: 'toxic', gimmick: 'poison' }
];

const INFLICTABLE_BUFFS: { text: string, gimmick: GimmickType }[] = [
    { text: 'atk up', gimmick: 'attackUp' }, // TODO enemy attack up
    { text: 'enrage', gimmick: 'provoked' },
    { text: 'increased defense', gimmick: 'defenseUp' },
    { text: 'percent damage reduction', gimmick: 'damageReduction' },
    { text: 'resilience', gimmick: 'resilience' },
    { text: 'threshold damage reduction', gimmick: 'damageThreshold' }
];

const IGNORABLE_TOKENS = [
    'and',
    'or',
    'a',
    'an',
    ',',
    'buff' // when the enemy gains X buff
];

/*-----
  Types
  -----*/

export type ParsedSupport = {

    trigger:
        | 'special' // When the supported character uses...
        | 'gimmick' // When an enemy inflicts you with... or When the enemy gains...
        | 'stage' // When you reach...
        | 'timing' // When the supported character hits...;

    once?: boolean; // Once per adventure...

    stage?: // Only meaningful for stage triggers
        | 1
        | 2
        | 3
        | 4
        | 5
        | 'last';

    gimmicks?: GimmickType[]; // Only meaningful for gimmick triggers

    timing?: Timing; // Only meaningful for timing triggers

    effect: string;

}

/*-------
  Exports
  -------*/

export const Supports = {

    removeUselessShit(support: Nullable<string>): Nullable<string> {

        if (!support?.length) return null;

        let result = support;
        for (let regex of IGNORABLE_SUPPORT_EFFECTS)
            support = support.replace(regex, '');
        result = result.trim();

        return result.length ? result : null;

    },

    parseSupport(support: string): Nullable<ParsedSupport> {

        if (!support) return null;

        let remaining = sanitizeSupport(support);
        if (!remaining?.length) return null;

        const result: Partial<ParsedSupport> = { };

        const oncePerAdventure = remaining.match(SEGMENT_REGEXES.oncePerAdventure);
        if (oncePerAdventure) {
            result.once = true;
            remaining = remaining.replace(SEGMENT_REGEXES.oncePerAdventure, '').trim();
        }

        if (SEGMENT_REGEXES.whenSpecialUsed.test(remaining))
            parseSpecialSupport(remaining, result);
        else if (SEGMENT_REGEXES.whenPlayerDebuffed.test(remaining))
            parseDebuffSupport(remaining, result);
        else if (SEGMENT_REGEXES.whenEnemyBuffed.test(remaining))
            parseBuffSupport(remaining, result);
        else if (SEGMENT_REGEXES.whenStageReached.test(remaining))
            parseStageSupport(remaining, result);
        else if (SEGMENT_REGEXES.whenTimingHit.test(remaining))
            parseTimingSupport(remaining, result);

        return isEmptyish(omit(result, [ 'once' ])) ? null : result as ParsedSupport;

    }

}

/*---------
  Internals
  ---------*/

function sanitizeSupport(support: string): string {

    let result = support
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/if inflicted with (.+?) status from the enemy/gi, 'when an enemy inflicts you with $1')
        .replace(/a special to inflict ([^,]+)/gi, `a $1 special`) // Can't handle multiple effects
        .replace(/a special to poison enemies/gi, `a poison special`);


    for (let regex of IGNORABLE_SUPPORT_EFFECTS)
        result = result.replace(regex, '');

    return result.trim();

}

function parseSpecialSupport(support: string,
                             result: Partial<ParsedSupport>) {

    const stripped = support.match(SEGMENT_REGEXES.whenSpecialUsed)![1].trim();

    result.trigger = 'special';
    result.effect = stripped.replace(/^.+?,\s*/i, '').trim();

}

function parseDebuffSupport(support: string,
                            result: Partial<ParsedSupport>) {
    const stripped = support.match(SEGMENT_REGEXES.whenPlayerDebuffed)![1].trim();
    const parsed = parseBuffOrDebuffSupport(stripped, INFLICTABLE_DEBUFFS);
    if (parsed) {
        result.trigger = 'gimmick';
        result.gimmicks = parsed.types;
        result.effect = parsed.effect;
    }
}

function parseBuffSupport(support: string,
                          result: Partial<ParsedSupport>) {
    const stripped = support.match(SEGMENT_REGEXES.whenEnemyBuffed)![1].trim();
    const parsed = parseBuffOrDebuffSupport(stripped, INFLICTABLE_BUFFS);
    if (parsed) {
        result.trigger = 'gimmick';
        result.gimmicks = parsed.types;
        result.effect = parsed.effect;
    }
}

function parseStageSupport(support: string,
                           result: Partial<ParsedSupport>) {

    let remaining = support
        .match(SEGMENT_REGEXES.whenStageReached)![1].trim()
        .replace(/^the\s*/i, '')
        .trim();

    if (remaining.startsWith('1st stage'))
        result.stage = 1;
    else if (remaining.startsWith('2nd stage'))
        result.stage = 2;
    else if (remaining.startsWith('3rd stage'))
        result.stage = 3;
    else if (remaining.startsWith('4th stage'))
        result.stage = 4;
    else if (remaining.startsWith('5th stage'))
        result.stage = 5;
    else if (remaining.startsWith('final stage') || remaining.startsWith('last stage'))
        result.stage = 'last';

    if (result.stage) {
        result.trigger = 'stage';
        result.effect = remaining.replace(/^.+? stage,?\s*/, '').trim();
    }

}

function parseTimingSupport(support: string,
                            result: Partial<ParsedSupport>) {

    let remaining = support
        .match(SEGMENT_REGEXES.whenTimingHit)![1].trim()
        .replace(/^a\s*/i, '')
        .trim();

    if (remaining.startsWith('perfect'))
        result.timing = 'PERFECT';
    else if (remaining.startsWith('great'))
        result.timing = 'GREAT';
    else if (remaining.startsWith('good'))
        result.timing = 'GOOD';
    else if (remaining.startsWith('miss'))
        result.timing = 'MISS';

    if (result.timing) {
        result.trigger = 'timing';
        result.effect = remaining.replace(/^\S+,?\s*/, '').trim();
    }

}

// The list of buffs or debuffs (based on the configuration) are extracted via what
// is essentially a top-down parser with up to 2 tokens (for now) of lookahead
// "and", "or", "a", "an" and commas are considered valid tokens (and they are ignored)
// The first non-recognized token determines the beginning of the effect
function parseBuffOrDebuffSupport(data: string,
                                  configuration: { text: string, gimmick: GimmickType }[]): Nullable<{ types: GimmickType[], effect: string }> {

    const types: GimmickType[] = [ ];

    let remaining = data;
    while (remaining.length > 0) {

        const next = remaining.match(/^[a-z]+/i)?.[0] ?? remaining.match(/^,/)?.[0];
        if (!next) break;

        // Ignored tokens
        if (IGNORABLE_TOKENS.includes(next)) {
            remaining = remaining.slice(next.length).trim();
            continue;
        }

        // Collect all matches starting with the extracted word
        let matches = configuration
            .filter(d => d.text === next || d.text.startsWith(next + ' '));

        // No match -> we've hit an unrecognized token -> abort
        if (!matches.length)
            break;

        // Match the text to the beginning of the buffer (this is basically a lookahead)
        matches = matches.filter(d => remaining.startsWith(d.text));

        // If the lookahead failed (eg. we've matched "orb" but the next token was "explosion")
        // we consider it a parse failure and abort
        if (!matches.length)
            break;

        // Pick the first match (there shouldn't be more than one match
        // unless we've fucked up the configuration)
        const match = matches[0];
        types.push(match.gimmick);
        remaining = remaining.slice(match.text.length).trim();

    }

    // No types recognized -> no trigger -> abort
    // Nothing left in the buffer -> no effect -> abort
    if (!types.length || !remaining.length)
        return null;

    return { types, effect: remaining };

}
