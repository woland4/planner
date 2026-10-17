import { Units } from '@/utils/units.ts';

import type { Battle, Team } from '@/types/battles.ts';
import type { Nullable } from '@/types/utils.ts';
import type { GimmickType } from '@/types/enums.ts';

export const Engine = {

    extractExhaustibleSailors(team: Nullable<Team>,
                              regex: RegExp,
                              battle: Battle,
                              untilStageIndexIncluded: number,
                              exhaustedWhen: GimmickType): Map<number, string> {

        let result = Engine.extractSailors(team, regex);
        if (!result.size) return new Map();

        for (let i=0; i<=untilStageIndexIncluded; ++i) {
            if (battle.stages?.[i]?.gimmicks?.some(g => g.type === exhaustedWhen))
                result = new Map([ ...result ].filter(v => /once per adventure/i.test(v[1])));
        }

        return result;

    },

    extractPotentials(team: Nullable<Team>,
                      regex?: RegExp): Map<number, string[]> {

        if (!team?.units?.length)
            return new Map();

        const result = new Map();
        for (let i=0; i<6; ++i) {
            let potentials = Units.getPotentials(team.units[i]?.id);
            if (regex)
                potentials = potentials.filter(p => regex.test(p));
            if (potentials.length)
                result.set(i, potentials);
        }
        return result;

    },

    extractSailors(team: Nullable<Team>,
                   regex?: RegExp): Map<number, string> {

        if (!team?.units?.length)
            return new Map();

        const result = new Map<number, string>();
        for (let i=0; i<6; ++i) {
            const unit = team.units[i];
            let sailors = Units.getSailors(unit?.id, unit?.variant);
            if (regex)
                sailors = sailors.filter(s => regex.test(s));
            if (sailors.length)
                result.set(i, sailors[sailors.length - 1]);
        }
        return result;

    },

    extractSpecials(team: Nullable<Team>,
                    regex?: RegExp): Map<number, string> {

        if (!team?.units?.length)
            return new Map();

        const result = new Map<number, string>();
        for (let i=0; i<6; ++i) {
            const unit = team.units[i];
            let specials = Units.getSpecial(unit?.id, unit?.variant, unit?.llbLevel ?? 0).map(s => s.description);
            if (regex)
                specials = specials.filter(s => regex.test(s));
            if (specials.length)
                result.set(i, specials[specials.length - 1]);
        }
        return result;

    },

    extractSuperSpecials(team: Nullable<Team>,
                         regex?: RegExp): Map<number, string> {

        if (!team?.units?.length)
            return new Map();

        const result = new Map<number, string>();
        for (let i=0; i<6; ++i) {
            const unit = team.units[i];
            const description = Units.getSuperSpecial(unit?.id, unit?.variant)?.description;
            if (description && (!regex || regex.test(description)))
                result.set(i, description);
        }
        return result;

    },

    extractSwaps(team: Nullable<Team>,
                 regex?: RegExp): Map<number, string> {

        if (!team?.units?.length)
            return new Map();

        const result = new Map<number, string>();
        for (let i=0; i<6; ++i) {
            const unit = team.units[i];
            const description = Units.getSwap(unit?.id)?.description;
            if (description && (!regex || regex.test(description)))
                result.set(i, description);
        }
        return result;

    }

};
