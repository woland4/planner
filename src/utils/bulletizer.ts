import { capitalize } from 'remeda';

/*-------------
  Configuration
  -------------*/

const VERBS = [
    'activates',
    'adds',
    'advances',
    'allows',
    'applies',
    'becomes',
    'binds',
    'boosts',
    'carries',
    'clears',
    'converts',
    'deals',
    'debuffs',
    'decreases',
    'defeats',
    'enables',
    'ignores',
    'increases',
    'inflicts',
    'launches',
    'limits',
    'makes',
    'marks',
    'orbs',
    'prevents',
    'protects',
    'randomizes',
    'recovers',
    'reduces',
    'removes',
    'sets',
    'taps',
    'transforms',
    'uses'
];

const CONDITIONS = [
    'if',
    'when'
];

const STARTERS = [
    /^Up to \d+ times?\b/i,
    /^Once per adventure\b/i,
    /^This character must be captain\b/i,
    /^Can be launched as( a)? crewmate\b/i,
    /^Your crew must consist\b/i,
    /^When character becomes.*during Captain Shift\b/i,
    /\[AUTO\+]/i
];

const TITLES = [
    'D',
    'Dr',
    'Mr',
    'Mrs',
    'Ms',
    'St'
];

/*-------
  Exports
  -------*/

/* eslint-disable @stylistic/brace-style */
export const Bulletizer = {

    bulletize(input: string): string {
        const bullets = Bulletizer.split(input);
        return `<ul class="list-disc pl-4">${ bullets.map(b => `<li>${ b.replace(/(?<!>)$/, '.') }</li>`).join('') }</ul>`;
    },

    split(input: string): string[] {

        const sanitizedInput = input
            .replace(/(This character must be captain) and/, '$1.')
            .replace(/(Can be launched as(?: a)? crewmate) and/, '$1.');

        // Floating points (eg. "1.5x") fuck up the whole end-of-phrase
        // detection so we escape them here and unescape them at the end
        let escapedInput = sanitizedInput
            .trim()
            .replace(/(\d)\.(\d)/g, '$1@@@$2');

        // Same as above for titles (eg. "Dr. Hiluluk")
        for (const title of TITLES) {
            const regex = new RegExp('\\b' + title + '\\.', 'g');
            escapedInput = escapedInput.replace(regex, title + '@@@');
        }

        const tokens = escapedInput.split(/(?<=[,.])\s+/);

        const result: string[][] = [ ];
        let currentBullet: string[] = [ ];
        let isInClause = false;
        for (const token of tokens) {

            // Remove conjunctions so we can still process prefixed clauses by their leading word
            const cleanedToken = token.replace(/^(and|or)\s+/i, '');

            // Extract the leading word from the cleaned token if there's any
            // Stuff like [STR] or [Straw Hat Pirates] is intentionally ignored
            const leadingWord = cleanedToken.match(/^\w+/)?.[0].toLowerCase() ?? '';

            // Check if we have a colon phrase (eg "Launches the following: XYZ")
            // and extract the leading word from the second statement (after the colon) if we do
            const colonTokens = token.match(/^([^:]+:)\s*(.*)$/);
            const colonLeadingWord = colonTokens ? colonTokens[1].match(/^\w+/)?.[0].toLowerCase() ?? '' : '';

            // Check if we have a starter on our hand so we don't roll it into the previous clause
            const isStarter = STARTERS.some(r => r.test(cleanedToken));

            // If we're *not* in a clause and the next token qualifies as a clause starter, start a new bullet
            if (!isInClause &&
                (isStarter || CONDITIONS.includes(leadingWord) || VERBS.includes(colonLeadingWord))) {
                if (currentBullet.length) result.push(currentBullet);
                currentBullet = [ token ];
                if (!token.trim().endsWith('.'))
                    isInClause = true;
                else {
                    result.push(currentBullet);
                    currentBullet = [ ];
                }
            }

            // If we *are* in a clause, keep constructing the previous bullet but stop the
            // clause as soon as we find a word ending with a dot (assuming it's the end of a statement)
            else if (isInClause) {
                currentBullet.push(token);
                if (token.trim().endsWith('.'))
                    isInClause = false;
            }

            // If we're here, we're not in a clause and the token is neither a condition nor a starter (nor a lead-in from a colon)
            // We check if it's a verb (eg phrases like "Boosts ATK of...") and start a new bullet if it is
            else if (VERBS.includes(leadingWord)) {
                if (currentBullet.length) result.push(currentBullet);
                currentBullet = [ token ];
            }

            // If we're here, the token is assumed to be part of the current bullet
            else
                currentBullet.push(token);

        }

        // Finalize pending bullet
        if (currentBullet.length)
            result.push(currentBullet);

        return result.map(r => {

            const unescaped = r
                .join(' ')
                .replace(/@@@/g, '.')
                .replace(/[.,]\s*$/, '')
                .replace(/^and /i, '')
                .trim();

            if (unescaped.endsWith('</ul>'))
                return capitalize(unescaped.replace(/<ul>/g, '<ul class="list-disc pl-4">'));
            else
                return capitalize(unescaped);

        });

    }

};
/* eslint-enable @stylistic/brace-style */
