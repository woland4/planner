import { isNullish, isString } from 'remeda';

import { Units } from '@/utils/units.ts';

import type { Team, TeamUnit } from '@/types/battles.ts';
import type { TeamCompositionIssue } from '@/types/engine.ts';
import type { Nullable } from '@/types/utils.ts';

/*---------
  Constants
  ---------*/

const MATCHERS: { support: RegExp; special: RegExp }[] = [

    { support: /when the supported character uses[^.]*base atk boost[^.]*special/i, special: /boosts[^.]*base atk[^.]*of/i },
    { support: /when the supported character uses[^.]*(atk boost|atk amplification|atk up)[^.]*special/i, special: /boosts((?!base atk)[^.])*atk(?! against)[^.]*of/i },
    { support: /when the supported character uses[^.]*(orb boost|orb amplification|orb up)[^.]*special/i, special: /boosts[^.]*orb effects[^.]*of/i },
    { support: /when the supported character uses[^.]*color affinity[^.]*special/i, special: /boosts[^.]*color affinity[^.]*of/i },
    { support: /when the supported character uses[^.]*status atk boost[^.]*special/i, special: /boosts[^.]*atk against/i },
    { support: /when the supported character uses[^.]*territory[^.]*special/i, special: /applies "?territory/i },
    { support: /when the supported character uses[^.]*effect boosting[^.]*special/i, special: /increases[^.]*boost effects/i },

    { support: /when the supported character uses[^.]*(?<!(special|ship) )bind[^.]*reducing special/i, special: /(reduces|removes)[^.]*(?<!(special|ship) )bind[^.]*duration/i },
    { support: /when the supported character uses[^.]*despair[^.]*reducing special/i, special: /(reduces|removes)[^.]*despair[^.]*duration/i },
    { support: /when the supported character uses[^.]*paralysis[^.]*reducing special/i, special: /(reduces|removes)[^.]*(?<!enemies' )paralysis[^.]*duration/i },
    { support: /when the supported character uses[^.]*poison[^.]*reducing special/i, special: /(reduces|removes)[^.]*(?<!enemies' )poison[^.]*duration/i },
    { support: /when the supported character uses[^.]*special bind[^.]*reducing special/i, special: /(reduces|removes)[^.]*special bind[^.]*duration/i },
    { support: /when the supported character uses[^.]*ship bind[^.]*reducing special/i, special: /(reduces|removes)[^.]*ship bind[^.]*duration/i },
    { support: /when the supported character uses[^.]*special cooldown[^.]*reducing special/i, special: /reduces special cooldown/i },

    { support: /when the supported character uses[^.]*chain addition[^.]*special/i, special: /adds \d+(\.\d+)?[^.]*chain multiplier/i },
    { support: /when the supported character uses[^.]*chain multiplication[^.]*special/i, special: /boosts[^.]*chain multiplier growth rate/i },
    { support: /when the supported character uses[^.]*chain lock[^.]*special/i, special: /sets chain boundaries|locks the chain multiplier/i },

    { support: /when the supported character uses[^.]*percent damage reduction[^.]*special/i, special: /reduces[^.]*percent damage reduction[^.]*duration/i },
    { support: /when the supported character uses[^.]*threshold damage reduction[^.]*special/i, special: /reduces[^.]*threshold damage reduction[^.]*duration/i },
    { support: /when the supported character uses[^.]*defense reducing[^.]*special/i, special: /reduces the defense/i },

    { support: /when the supported character uses[^.]*inflict increase damage taken/i, special: /inflicts[^.]*increase damage taken/i },
    { support: /when the supported character uses[^.]*(poison|toxic)((?!reducing)[^.])*special/i, special: /poisons|inflicts( strong)? (toxic|poison)/i },
    { support: /when the supported character uses[^.]*special to poison enemies/i, special: /poisons|inflicts( strong)? (toxic|poison)/i },
    { support: /when the supported character uses[^.]*paralysis((?!reducing)[^.])*special/i, special: /paralyzes|inflicts[^.]*with paralysis/i },

    { support: /when the supported character uses[^.]*(orb converting|orb controlling|orb randomizing|orb randomization|orb manipulation|orb change)[^.]*special/i, special: /changes[^.]*orbs/i },
    { support: /when the supported character uses[^.]*orb locking[^.]*special/i, special: /locks( all)? orbs/i },

    { support: /when the supported character uses[^.]*(damage dealing|health cutting)[^.]*special/i, special: /deals (\d|random|\?)/i },
    { support: /when the supported character uses[^.]*damage reducing[^.]*special/i, special: /reduces damage received/i },

    { support: /when the supported character uses[^.]*delay[^.]*special/i, special: /delays( all)? enemies/i },
    { support: /when the supported character uses[^.]*healing[^.]*special/i, special: /recovers \d/i }

];

/*-------
  Exports
  -------*/

export function checkSupportIssues(team: Nullable<Team>): TeamCompositionIssue[] {
    if (!team?.units?.length) return [ ];
    return team.units
        .map((u, n) => checkSupport(u, n))
        .filter(i => !isNullish(i));
}

/*---------
  Internals
  ---------*/

// TODO Multi-stage support?
function checkSupport(unit: Nullable<TeamUnit>,
                      unitIndex: number): Nullable<TeamCompositionIssue> {

    if (!unit?.id || !unit?.support) return null;

    const supportCondition = Units.getSupport(unit.support)?.description;
    if (!supportCondition) return null;

    const wrongPosition = (
        (/when the supported character is(your )? captain/i.test(supportCondition) && unitIndex !== 0) ||
        (/when the supported character is((your|a) )? crewmate/i.test(supportCondition) && unitIndex === 0)
    );
    if (wrongPosition)
        return { index: unitIndex, issue: 'May not trigger' };

    const regexes = MATCHERS.filter(m => m.support.test(supportCondition)).map(m => m.special);
    if (!regexes.length) return;

    const specialCondition = Units.getSpecial(unit.id, unit.variant, unit.llbLevel ?? 0);
    const specialDescription = specialCondition[specialCondition.length - 1]?.description;
    if (!isString(specialDescription) || !regexes.some(r => r.test(specialDescription)))
        return { index: unitIndex, issue: 'May not trigger' };
    else
        return null;

}
