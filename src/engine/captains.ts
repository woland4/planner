import { unique } from 'remeda';

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
 * boostedStats :=
 *     | ATK
 *     | ATK and HP
 *     | ATK and RCV
 *     | ATK, HP and RCV
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
 * typeOrClassOrTagTarget :=
 *     | <type>
 *     | <class>
 *     | <tag>
 *
 * costTarget :=
 *     | cost <N> characters
 *     | cost <N>-<M> characters
 *     | cost <N> or less characters
 *     | cost <N> or more characters
 *     | cost <N> or higher characters
 *     | cost <N> or <M> or less characters
 *     | cost <N> or <M> or more characters
 *     | cost <N> or <M> or higher characters
 *
 * boostTarget :=
 *     | <typeOrClassOrTagTarget>
 *     | <typeOrClassOrTagTarget>(, <typeOrClassOrTagTarget>){0,} and <typeOrClassOrTagTarget>
 *     | <typeOrClassOrTagTarget>(, <typeOrClassOrTagTarget>){0,}, and <typeOrClassOrTagTarget>
 *     | <costTarget>
 *
 * searchFor :=
 *     | boosts <boostedStats> of all characters by
 *     | boosts <boostedStats> of all character by
 *     | boosts <boostedStats> of this character by
 *     | boosts <boostedStats> of [other, ]<boostTarget> by
 *     | boosts <boostedStats> of all others by
 *     | boosts <boostedStats> of all other characters by
 *     | boosts <boostedStats> of {...} and all others by
 *     | boosts <boostedStats> of {...} and all other characters by
 *
 * Not covered: boosts ATK or rarity (nah)
 * Not covered: boosts ATK of dominant type characters (fuck that)
 *
 */

/*---------
  Constants
  ---------*/

const OTHER_PREFIX_REGEX = /^(?:all\s+)?other\s+/i;

/*-------
  Exports
  -------*/

export function checkCaptainIssues(team: Nullable<Team>): string[] {
    if (!team?.units?.length) return [ ];
    return unique([
        ...checkCaptain(team, 0),
        ...checkCaptain(team, 5)
    ]);
}

/*---------
  Internals
  ---------*/

// TODO LLB support?
// TODO Dual captain support
function checkCaptain(team: Team,
                      captainIndex: number): string[] {

    const captain = team.units[captainIndex];
    if (!captain?.id) return [ ];

    const ability = Units.getCaptain(captain.id, captain.variant);
    if (!ability?.base) return [ ];

    const sanitizedAbility = ability?.base
        .replace(/boosts (.+?)'s ATK by/gi, 'boosts ATK of $1 by')
        .replace(/and ATK of/gi, 'and boosts ATK of');

    const bullets = Bulletizer.split(sanitizedAbility)
        .filter(bullet => /Boosts.*ATK/i.test(bullet));

    const result: string[] = [ ];
    for (let i of [ 5, 0, 4, 1, 3, 2 ]) {
        const unit = team.units[i];
        if (!!unit?.id && !isBoosted(team, i, captainIndex, bullets))
            result.push(`${ Html.decorateUnit(captain.id, captain.variant) } does not boost ${ Html.decorateUnit(unit.id, unit.variant) }`);
    }
    return result;

}

function isBoosted(team: Team,
                   unitIndex: number,
                   captainIndex: number,
                   captainBullets: string[]): boolean {

    const unit = team.units[unitIndex]!!;

    for (let bullet of captainBullets) {
        const matches = [ ...bullet.matchAll(/Boosts\s+([A-Z,\s]+?)\s+of\s+(.+?)\s+by\s+[\d?]/gi) ];
        for (let match of matches) {

            const [ _, stats, targets ] = match;
            if (!/\bATK\b/i.test(stats)) continue;

            if (/^this characters?$/i.test(targets)) {
                if (captainIndex === unitIndex)
                    return true;
            } else if (/^all others?( characters?)?$/i.test(targets)) {
                if (captainIndex !== unitIndex)
                    return true;
            } else {

                const excludesSelf = OTHER_PREFIX_REGEX.test(targets);
                if (excludesSelf && captainIndex === unitIndex) continue;

                const sanitized = targets.replace(OTHER_PREFIX_REGEX, '');
                if (Criteria.parseCriteria(sanitized)(unit.id, unit.variant))
                    return true;

            }

        }
    }

    return false;

}
