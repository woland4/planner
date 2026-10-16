import { capitalize, isNullish, isString, unique } from 'remeda';

import { Units } from '@/utils/units.ts';
import { Bulletizer } from '@/utils/bulletizer.ts';
import { Criteria } from '@/utils/criteria.ts';
import { Html } from '@/utils/html.ts';

import type { Team } from '@/types/battles.ts';
import type { Nullable } from '@/types/utils.ts';
import type { TeamCompositionIssue } from '@/types/engine.ts';

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

const POSITION_REGEX = /^(?:the\s+)?(?:top|middle|bottom|left|right)(?:\s+and\s+(?:top|middle|bottom|left|right))?\s+(?:row|column)\s+characters?$/i;

const UNIVERSAL_CAPTAIN_REGEX = /makes all specials that apply class or type restricted buffs/i;

const OTHER_PREFIX_REGEX = /^(?:all\s+)?other\s+/i;

const LIST_FORMATTER = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });

/*-------
  Exports
  -------*/

export function checkSpecialIssues(team: Nullable<Team>): TeamCompositionIssue[] {
    if (!team?.units?.length) return [ ];
    return unique([ 5, 0, 4, 1, 3, 2]
        .map(n => checkSpecial(team, n))
        .flat()
        .filter(i => !isNullish(i)));
}

/*---------
  Internals
  ---------*/

// TODO Dual special support
// TODO Multi-stage support?
function checkSpecial(team: Team,
                      unitIndex: number): TeamCompositionIssue[] {

    const captain1 = Units.getCaptain(team.units[0]?.id, team.units[0]?.variant, team.units[0]?.llbLevel ?? 0);
    const captain2 = Units.getCaptain(team.units[5]?.id, team.units[5]?.variant, team.units[5]?.llbLevel ?? 0);
    const hasUniversalCaptain = (UNIVERSAL_CAPTAIN_REGEX.test(captain1 ?? '') || UNIVERSAL_CAPTAIN_REGEX.test(captain2 ?? ''));
    if (hasUniversalCaptain) return [ ];

    const launcher = team.units[unitIndex];
    if (!launcher?.id) return [ ];

    const special = Units.getSpecial(launcher.id, launcher.variant, launcher.llbLevel ?? 0);
    const description = special[special.length - 1]?.description;
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

    const buffer: Map<number, string[]> = new Map();
    for (const [ buff, targets ] of groupedBuffs) {
        const unboostedUnits = calculateUnboostedUnits(team, unitIndex, targets);
        for (let index of unboostedUnits) {
            if (!buffer.has(index)) buffer.set(index, [ buff ]);
            else buffer.get(index)!!.push(buff);
        }
    }

    const result: TeamCompositionIssue[] = [ ];
    for (let entry of buffer.entries()) {
        const [ index, buffs ] = entry;
        result.push({
            index,
            issue: capitalize(`${ LIST_FORMATTER.format(buffs.map(formatBuff)) } not boosted by ${ Html.decorateUnit(launcher.id, launcher.variant) }`)
        });

    }
    return result;

}

function calculateUnboostedUnits(team: Team,
                                 launcherIndex: number,
                                 targets: string[]): number[] {
    return [ 5, 0, 4, 1, 3, 2]
        .filter(unitIndex => {
            const unit = team.units[unitIndex];
            return !!unit?.id && !isBoosted(team, unitIndex, launcherIndex, targets);
        });
}

function isBoosted(team: Team,
                   unitIndex: number,
                   launcherIndex: number,
                   targets: string[]): boolean {
    const unit = team.units[unitIndex]!;
    return targets.some(target => {
        if (/^this characters?$/i.test(target))
            return launcherIndex === unitIndex;
        else if (POSITION_REGEX.test(target))
              return true;
        else if (OTHER_PREFIX_REGEX.test(target) && launcherIndex === unitIndex)
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
