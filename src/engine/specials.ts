import { isArray, isNullish, isString, unique } from 'remeda';

import { Units } from '@/utils/units.ts';
import { Bulletizer } from '@/utils/bulletizer.ts';
import { Criteria } from '@/utils/criteria.ts';
import { Html } from '@/utils/html.ts';

import type { Team } from '@/types/battles.ts';
import type { Nullable } from '@/types/utils.ts';

/**
 *
 * Possible grammar:
 *
 * buff :=
 *     | atk
 *     | orb effects
 *     | color affinity
 *     | base atk
 *
 * type :=
 *     | [STR]
 *     | [QCK]
 *     | [DEX]
 *     | [PSY]
 *     | [INT]
 *
 * class :=
 *     | Fighter
 *     | Slasher
 *     | Striker
 *     | Shooter
 *     | Free Spirit
 *     | Driven
 *     | Cerebral
 *     | Powerhouse
 *
 * tag :=
 *     | [<any string>]
 *
 * typeOrClassOrTag :=
 *     | <type>
 *     | <class>
 *     | <tag>
 *
 * targets :=
 *     | <typeOrClassOrTag>
 *     | <typeOrClassOrTag>{, <typeOrClassOrTag>},? and <typeOrClassOrTag>
 *
 * searchFor :=
 *     | boosts <buff> of all characters by
 *     | boosts <buff> of <targets> by
 *     | boosts <buff> of this character by
 *
 */

/*---------
  Constants
  ---------*/

const BOOST_REGEX = /boosts\s+(atk|orb effects|color affinity|base atk)(?:\s+and\s+[a-z ]+?)?\s+of\s+(.+?)\s+by\s+/gi;

const UNIVERSAL_CAPTAIN_REGEX = /makes all specials that apply class or type restricted buffs/i;

const OTHER_PREFIX_REGEX = /^(?:all\s+)?other\s+/i;

const LIST_FORMATTER = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });

/*-------
  Exports
  -------*/

export function checkSpecialIssues(team: Nullable<Team>): string[] {
    if (!team?.units?.length) return [ ];
    return unique(team.units
        .map((_,n) => checkSpecial(team, n))
        .flat()
        .filter(i => !isNullish(i)));
}

/*---------
  Internals
  ---------*/

// TODO LLB support?
// TODO Dual special support
// TODO Multi-stage support?
function checkSpecial(team: Team,
                      unitIndex: number): string[] {

    const launcher = team.units[unitIndex];
    if (!launcher?.id) return [ ];

    const special = Units.getSpecial(launcher.id, launcher.variant);
    const ability = isArray(special?.base) ? special.base[special.base.length - 1] : special?.base;
    const description = ability?.description;
    if (!isString(description)) return [ ];

    // A buff can be applied to different tagets by different bullets and
    // a bullet can also contain different targets for the same buff (see #3956)
    // We gather every target of a given buff before looking for unboosted units
    const groupedBuffs = new Map<string, string[]>();
    for (const bullet of Bulletizer.split(description)) {
        for (const [ , buff, targets ] of bullet.matchAll(BOOST_REGEX)) {
            const existing = groupedBuffs.get(buff.toLowerCase());
            if (!existing) groupedBuffs.set(buff.toLowerCase(), [ targets ]);
            else existing.push(targets);
        }
    }

    const hasUniversalCaptain = (
        UNIVERSAL_CAPTAIN_REGEX.test(Units.getCaptain(team.units[0]?.id)?.base ?? '') ||
        UNIVERSAL_CAPTAIN_REGEX.test(Units.getCaptain(team.units[5]?.id)?.base ?? '')
    );

    const result: string[] = [ ];
    for (const [ buff, targets ] of groupedBuffs) {
        const unboostedUnits = calculateUnboostedUnits(team, unitIndex, targets);
        if (unboostedUnits.length > 0)
            result.push(`${ Html.decorateUnit(launcher.id, launcher.variant) } ${ hasUniversalCaptain ? '*may*' : 'does' } not boost ${ formatBuff(buff) } for ${ LIST_FORMATTER.format(unboostedUnits) }`);
    }

    return postProcessResults(result);

}

function calculateUnboostedUnits(team: Team,
                                 launcherIndex: number,
                                 targets: string[]): string[] {
    return [ 5, 0, 4, 1, 3, 2]
        .map(unitIndex => {
            const unit = team.units[unitIndex];
            if (!!unit?.id && !isBoosted(team, unitIndex, launcherIndex, targets))
                return Html.decorateUnit(unit.id, unit.variant);
            return null
        })
        .filter(u => !isNullish(u));
}

function isBoosted(team: Team,
                   unitIndex: number,
                   launcherIndex: number,
                   targets: string[]): boolean {
    const unit = team.units[unitIndex]!;
    return targets.some(target => {
        if (/^this characters?$/i.test(target))
            return launcherIndex === unitIndex;
        if (OTHER_PREFIX_REGEX.test(target) && launcherIndex === unitIndex)
            return false;
        else
            return Criteria.parseCriteria(target.replace(OTHER_PREFIX_REGEX, ''))(unit.id, unit.variant);
    });
}

function formatBuff(buff: string): string {
    switch (buff.toLowerCase()) {
        case 'atk': return 'ATK';
        case 'orb effects': return 'slot effects';
        case 'color affinity': return 'type effects';
        case 'base atk': return 'base ATK';
        default: return buff;
    }
}

// TODO Merge into main processing somehow
function postProcessResults(results: string[]): string[] {

    const mappedAccumulator: Record<string, string[]> = { };
    const unmappedAccumulator: string[] = [ ];

    for (let result of results) {

        const match = result.match(/^(.+) (does|\*may\*) not boost (.+) for (.+)$/i);
        if (!match) {
            unmappedAccumulator.push(result);
            continue;
        }

        const [ _, source, gravity, effect, target ] = match;
        const key = `${ source }@@@${ gravity }@@@${ target }`;

        if (!mappedAccumulator[key]) mappedAccumulator[key] = [ effect ];
        else mappedAccumulator[key].push(effect);

    }

    return [

        ...Object.entries(mappedAccumulator).map(([ key, value ]) => {
            const [ source, gravity, target ] = key.split('@@@');
            return `${ source } ${ gravity } not boost ${ LIST_FORMATTER.format(value) } for ${ target }`;
        }),

        ...unmappedAccumulator

    ];

}
