import { isNullish } from 'remeda';

import { I18N } from '@/utils/i18n.ts';
import { Ui } from '@/utils/ui.ts';

import type { BaseGimmick, GimmickEffect, GimmickEffectType, GimmickTarget } from '@/types/gimmicks.ts';
import type { Nullable } from '@/types/utils.ts';
import type { Class, Position, Slot, Tag, Type } from '@/types/enums.ts';

/*-------
  Exports
  -------*/

export const GimmickRegistry: GimmickRegistry = {

    attackDown: {

        label: 'Attack down',
        details: g => [ percentage(g.reduction) ],

        fields: {
            reduction: { type: 'percentage', label: 'Reduction %' }
        }

    },

    attackDownAboveChain: {

        label: 'Attack down above chain',
        details: g => [ g.chain ? multiplier(g.chain) + ' or more' : null, percentage(g.reduction) ],

        fields: {
            chain: { type: 'multiplier', label: 'Chain', required: true },
            reduction: { type: 'percentage', label: 'Reduction %' }
        }

    },

    attackDownBelowChain: {

        label: 'Attack down below chain',
        details: g => [ g.chain ? multiplier(g.chain) + ' or less' : null, percentage(g.reduction) ],

        fields: {
            chain: { type: 'multiplier', label: 'Chain', required: true },
            reduction: { type: 'percentage', label: 'Reduction %' }
        }

    },

    attackUp: {

        label: 'Attack up',
        details: g => [ multiplier(g.multiplier) ],

        fields: {
            multiplier: { type: 'multiplier', label: 'Multiplier', required: true }
        }

    },

    beneficialEffectRemoval: {

        icon: 'haki',
        label: 'Beneficial effect removal',
        details: g => [ g.only ? 'only ' + I18N.removableEffect(g.only) : null ],

        turns: false,
        fields: {
            only: { type: 'removableEffect', label: 'Only' }
        }

    },

    bind: {

        label: 'Bind',
        details: g => {
            const targets = [ ];
            for (let t of g.targets ?? [ ])
                targets.push(target(t));
            return [ join(targets, '+') ];
        },

        fields: {
            targets: { type: 'targets', label: 'Targets' }
        }

    },

    bleed: {

        label: 'Bleed',
        details: g => [
            g.fixed ? `${ numberFormatter.format(g.fixed) } per hit` : null,
            g.percentage ? `${ numberFormatter.format(g.percentage) }% HP per hit` : null
        ],

        fields: {
            fixed: { type: 'integer', label: 'Fixed damage', disabled: g => !isNullish(g.percentage) },
            percentage: { type: 'percentage', label: '% damage', disabled: g => !isNullish(g.fixed) }
        }

    },

    blindness: {
        label: 'Remove SFX (blindness)'
    },

    blowAway: {

        label: 'Blow away',
        details: g => [ join(g.targets?.map(target), '/') ],

        fields: {
            targets: { type: 'targets', label: 'Targets' }
        }

    },

    burn: {

        icon: g => (g.immediate ? 'burnImmediate' : 'burn'),
        label: 'Burn',
        details: g => [ g.value ? numberFormatter.format(g.value) + ' per hit' : null, g.immediate ? 'immediate' : null ],

        fields: {
            value: { type: 'integer', label: 'Damage per hit' },
            immediate: { type: 'boolean', label: 'Immediate?' }
        }

    },

    chainGrowthDown: {

        label: 'Chain growth down',
        details: g => [ multiplier(g.multiplier) ],

        fields: {
            multiplier: { type: 'multiplier', label: 'Multiplier' }
        }

    },

    chainLock: {

        label: 'Chain lock',
        details: g => [
            multiplier(g.multiplier),
            g.min ? `min ${ multiplier(g.min) }` : null,
            g.max ? `max ${ multiplier(g.min) }` : null
        ],

        fields: {
            multiplier: { type: 'multiplier', label: 'Multiplier', disabled: g => !isNullish(g.min) || !isNullish(g.max) },
            min: { type: 'multiplier', label: 'Min', disabled: g => !isNullish(g.multiplier) },
            max: { type: 'multiplier', label: 'Max', disabled: g => !isNullish(g.multiplier) }
        },
        validate: g => (g.multiplier ?? 0) > 0 || ((g.min ?? 0) > 0 && (g.max ?? 0) > 0)

    },

    cdReduction: {

        icon: 'special',
        label: 'CD reduction',
        details: g => [ join(g.targets?.map(target), '/') ],

        fields: {
            targets: { type: 'targets', label: 'Targets', required: true }
        }

    },

    damage: {

        label: 'Damage',
        details: g => [ g.amount ? numberFormatter.format(g.amount) : null, percentage(g.percentage) ],

        turns: false,
        fields: {
            amount: { type: 'integer', label: 'Amount', disabled: g => !isNullish(g.percentage) },
            percentage: { type: 'percentage', label: 'Percentage', disabled: g => !isNullish(g.amount) }
        },
        validate: g => (g.amount ?? 0) > 0 || (g.percentage ?? 0) > 0

    },

    damageLimit: {

        label: 'Damage limit',
        details: g => [ g.amount ? numberFormatter.format(g.amount) : null ],

        fields: {
            amount: { type: 'integer', label: 'Damage per turn', required: true }
        }

    },

    damageReduction: {

        label: 'Damage reduction',
        details: g => [ percentage(g.reduction) ],

        fields: {
            reduction: { type: 'percentage', label: 'Reduction %' }
        }

    },

    damageNullification: {
        label: 'Damage nullification'
    },

    damageThreshold: {

        label: 'Damage threshold',
        details: g => {

            const tokens = [ ];
            if (g.reduction)
                tokens.push(percentage(g.reduction));
            if (g.threshold)
                tokens.push(`above ${ g.threshold }`);

            return [ join(tokens, ' ') ];

        },

        fields: {
            reduction: { type: 'percentage', label: 'Reduction %' },
            threshold: { type: 'integer', label: 'Above Health' }
        }

    },

    defenseUp: {

        label: 'Defense up',
        details: g => {
            const tokens = [ ];
            if (g.amount)
                tokens.push(`by ${ g.amount }`);
            return [ join(tokens, ' ') ];
        },

        fields: {
            amount: { type: 'integer', label: 'By' }
        }

    },

    despair: {

        label: 'Despair',
        details: g => [ join(g.targets?.map(target), ', ') ],

        fields: {
            targets: { type: 'targets', label: 'Targets' }
        }

    },

    endOfTurnDamage: {

        label: 'End-of-turn damage',
        details: g => [ g.amount ? `${ numberFormatter.format(g.amount) } per hit` : null ],

        usuallyPermanent: true,
        fields: {
            amount: { type: 'integer', label: 'Damage' }
        }

    },

    healDamage: {
        label: 'Heal to damage'
    },

    healthCutResistance: {

        label: 'Percentage damage resistance',

        usuallyPermanent: true

    },

    hitBarrier: {

        icon: 'barrier',
        label: 'Hit barrier',
        details: g => {
            const tokens = [ ];
            if (g.hits)
                tokens.push(`${ g.hits } hit${ g.hits === 1 ? '' : 's' }`);
            return [ join(tokens, ' ') ];
        },

        fields: {
            hits: { type: 'integer', label: 'Hits', required: true }
        }

    },

    hunger: {

        label: 'Hunger',
        details: g => [ percentage(g.reduction) ],

        fields: {
            reduction: { type: 'percentage', label: 'ATK reduction' }
        }

    },

    immunity: {

        icon: g => {
            switch (g.from) {
                case 'death': return 'immunityDeath';
                case 'delay': return 'immunityDelay';
                case 'poison': return 'immunityPoison';
            }
            if (g.from || g.except) return 'immunityExcept';
            else return 'immunity';
        },
        label: g => {
            switch (g.from) {
                case 'death': return 'Instant death immunity';
                case 'defenseDown': return 'Defense down immunity';
                case 'delay': return 'Delay immunity';
                case 'poison': return 'Poison immunity';
            }
            if (g.except) return 'Partial immunity';
            else return 'Immunity';
        },
        details: g => {
            const tokens = [ ];
            if (g.except === 'death') tokens.push('except instant death');
            else if (g.except === 'defenseDown') tokens.push('except defense down');
            else if (g.except === 'delay') tokens.push('except delay');
            else if (g.except === 'poison') tokens.push('except poison');
            return [ join(tokens, ' ') ]
        },

        usuallyPermanent: true,
        fields: {
            from: { type: 'immunity', label: 'From', disabled: g => !isNullish(g.except) },
            except: { type: 'immunity', label: 'Except', disabled: g => !isNullish(g.from) }
        }

    },

    increasedDamage: {

        label: 'Increased damaged taken',
        details: g => [ multiplier(g.multiplier) ],

        fields: {
            multiplier: { type: 'multiplier', label: 'Multiplier' }
        }

    },

    intimidation: {

        label: 'Intimidation',
        details: g => [
            g.effects?.map(e => I18N.intimidation(e))?.join('/'),
            g.reduction ? g.reduction + (g.reduction === 1 ? ' turn' : ' turns') : null
        ],

        fields: {
            effects: { type: 'intimidation', label: 'Effect', required: true },
            reduction: { type: 'integer', label: 'Reduction', required: true }
        }

    },

    lockSlots: {

        label: 'Lock slots',
        details: g => [ join(g.targets?.map(target), ', ') ],

        fields: {
            targets: { type: 'targets', label: 'Targets' }
        }

    },

    nao: {

        label: 'NAO',

        usuallyPermanent: true

    },

    noPotentialAbilities: {
        label: 'No potential abilities'
    },

    noRcv: {
        label: 'No RCV'
    },

    pain: {

        label: 'Pain',
        details: g => [
            g.fixed ? `${ numberFormatter.format(g.fixed) } per hit` : null,
            g.percentage ? `${ numberFormatter.format(g.percentage) }% HP per hit` : null
        ],

        fields: {
            fixed: { type: 'integer', label: 'Fixed damage', disabled: g => !isNullish(g.percentage) },
            percentage: { type: 'percentage', label: '% damage', disabled: g => !isNullish(g.fixed) }
        }

    },

    paralysis: {

        label: 'Paralysis',
        details: g => [ join(g.targets?.map(target), ', ') ],

        fields: {
            targets: { type: 'targets', label: 'Targets' }
        }

    },

    poison: {
        label: 'Poison'
    },

    provoked: {
        label: 'Provoked'
    },

    rcvDamage: {
        label: 'RCV to damage'
    },

    resilience: {
        label: 'Resilience'
    },

    silence: {

        label: 'Silence',
        details: g => [ join(g.targets?.map(target), ', ') ],

        fields: {
            targets: { type: 'targets', label: 'Targets' }
        }

    },

    slotBarrier: {

        label: g => (g.slot ? `${ g.slot } slot barrier` : 'Slot barrier'),
        details: g => {
            const tokens = [ ];
            if (g.hits)
                tokens.push(`${ g.hits } hit${ g.hits === 1 ? '' : 's' }`);
            return [ join(tokens, ' ') ];
        },

        fields: {
            slot: { type: 'slot', label: 'Slot', required: true },
            hits: { type: 'integer', label: 'Hits', required: true }
        }

    },

    slotBind: {

        label: 'Slot bind',
        details: g => [ join(g.targets?.map(target), ', ') ],

        fields: {
            targets: { type: 'targets', label: 'Targets' }
        }

    },

    slotChange: {

        label: 'Slot change',
        lines: g => {
            const result = [ ];
            if (g.from) {
                const from = slotIcons(g.from);
                if (from) result.push('From: ' + from);
            }
            if (g.to) {
                const to = slotIcons(g.to);
                if (to) result.push('To: ' + to);
            }
            return result;
        },

        turns: false,
        fields: {
            from: { type: 'slots', label: 'From', required: true },
            to: { type: 'slots', label: 'To', required: true }
        }

    },

    slotDamageReduction: {

        label: 'Slot damage reduction',
        details: g => [ percentage(g.reduction) ],
        lines: g => {
            const result = [ ];
            if (g.slots) {
                const from = slotIcons(g.slots);
                if (from) result.push('Slots: ' + from);
            }
            return result;
        },

        fields: {
            slots: { type: 'slots', label: 'Slots', required: true },
            reduction: { type: 'percentage', label: 'Reduction %' }
        }

    },

    slotMultiplierChange: {

        icon: g => g.multiplier > 2 ? 'slotMultiplierUp' : 'slotMultiplierDown',
        label: 'Slot multiplier change',
        details: g => [ multiplier(g.multiplier) ],
        lines: g => [ 'Slots: ' + slotIcons(g.slots) ],

        fields: {
            slots: { type: 'slots', label: 'Slots', required: true },
            multiplier: { type: 'multiplier', label: 'Multiplier', required: true }
        }

    },

    slotUp: {

        label: 'Slot up',
        details: g => [ multiplier(g.multiplier) ],

        fields: {
            multiplier: { type: 'multiplier', label: 'Multiplier', required: true }
        }

    },

    specialBind: {

        label: 'Special bind',
        details: g => [ join(g.targets?.map(target), '/') ],

        fields: {
            targets: { type: 'targets', label: 'Targets' }
        }

    },

    specialLimit: {

        label: 'Special use limit',
        details: g => [ g.limit ? g.limit + (g.limit === 1 ? ' time' : ' times') : null ],

        fields: {
            limit: { type: 'integer', label: 'Limit', required: true }
        }

    },

    specialLock: {

        label: 'Special turn lock',
        details: g => [ g.timing ],

        fields: {
            timing: { type: 'timing', label: 'Timing', required: true }
        }

    },

    specialReverse: {

        label: 'Special reverse',
        details: g => [ join(g.targets?.map(target), '/') ],

        fields: {
            targets: { type: 'targets', label: 'Targets' }
        }

    },

    stun: {

        label: 'Stun',
        details: g => [ join(g.targets?.map(target), '/') ],

        turns: false,
        fields: {
            targets: { type: 'targets', label: 'Targets' }
        }

    },

    superSwitchReduction: {

        icon: 'superSwitch',
        label: 'Super switch reduction',
        details: g => [ join(g.targets?.map(target), '/') ],

        fields: {
            targets: { type: 'targets', label: 'Targets' }
        }

    },

    superTyping: {

        label: 'Supertyping',

        turns: false

    },

    swap: {

        label: 'Swap',
        details: g => [
            g.from ? `from ${ target(g.from) }` : null,
            g.to ? `to ${ target(g.to) }` : null
        ],

        fields: {
            from: { type: 'position', label: 'Position' },
            to: { type: 'position', label: 'Position' }
        }

    },

    tapLimit: {

        label: 'Tap limit',
        details: g => [ g.limit ? g.limit + (g.limit === 1 ? ' time' : ' times') : null ],

        fields: {
            limit: { type: 'integer', label: 'Limit', required: true }
        }

    },

    tapTiming: {

        icon: g => {
            if (g.easier) return 'tapTimingEasier';
            else return 'tapTimingHarder';
        },
        label: g => {
            if (g.harder) return 'Tap timing becomes harder';
            else if (g.easier) return 'Tap timing becomes easier';
            else return 'Tap timing becomes...';
        },

        fields: {
            harder: { type: 'boolean', label: 'Harder?', disabled: g => !!g.easier },
            easier: { type: 'boolean', label: 'Easier?', disabled: g => !!g.harder }
        },
        validate: g => (g.harder || g.easier)

    },

    targetLock: {
        label: 'Target lock',
    },

    territory: {
        label: 'Territory'
    },

    timingBarrier: {

        icon: g => {
            switch (g.timing) {
                case 'GOOD': return 'timingBarrierGood';
                case 'GREAT': return 'timingBarrierGreat';
                case 'PERFECT': return 'timingBarrierPerfect';
                default: return 'timingBarrierGreat';
            }
        },
        label: g => {
            switch (g.timing) {
                case 'GOOD': return 'GOOD barrier';
                case 'GREAT': return 'GREAT barrier';
                case 'PERFECT': return 'PERFECT barrier';
                default: return 'Timing barrier';
            }
        },
        details: g => {
            const tokens = [ ];
            if (g.hits)
                tokens.push(`${ g.hits } hit${ g.hits === 1 ? '' : 's' }`);
            return [ join(tokens, ' ') ];
        },

        fields: {
            timing: { type: 'timing', label: 'Timing', required: true },
            hits: { type: 'integer', label: 'Hits', required: true }
        }

    },

    typeUp: {

        label: 'Type up',
        details: g => [ multiplier(g.multiplier) ],

        fields: {
            multiplier: { type: 'multiplier', label: 'Multiplier', required: true }
        }

    },

    unfavorableSlots: {

        label: 'Unfavorable slots',
        lines: g => {
            const result = [ ];
            if (g.slots) {
                const from = slotIcons(g.slots);
                if (from) result.push('Slots: ' + from);
            }
            return result;
        },

        fields: {
            slots: { type: 'slots', label: 'Slots', required: true }
        }

    },

    vsReduction: {

        icon: 'vs',
        label: 'VS reduction',
        details: g => [ join(g.targets?.map(target), '/') ],

        fields: {
            targets: { type: 'targets', label: 'Targets' }
        }

    },

    weakness: {

        icon: g => {
            switch (g.to) {
                case 'Fighter': return 'weaknessFighter';
                case 'Slasher': return 'weaknessSlasher';
                case 'Striker': return 'weaknessStriker';
                case 'Shooter': return 'weaknessShooter';
                case 'Free Spirit': return 'weaknessFreeSpirit';
                case 'Driven': return 'weaknessDriven';
                case 'Cerebral': return 'weaknessCerebral';
                case 'Powerhouse': return 'weaknessPowerhouse';
                default: return 'weaknessDriven';
            }
        },
        label: g => (g.to ? 'Weakness to ' + g.to : 'Weakness'),

        turns: false,
        fields: {
            to: { type: 'class', label: 'To', required: true }
        }

    }

}

/*-------
  Helpers
  -------*/

const numberFormatter = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });

function multiplier(number: Nullable<number>): Nullable<string> {
    if (isNullish(number)) return null;
    return `${ numberFormatter.format(number) }x`;
}

function percentage(number: Nullable<number>): Nullable<string> {
    if (isNullish(number)) return null;
    return `${ numberFormatter.format(number) }%`;
}

function target(target: GimmickTarget | Type | Class | Tag): string {
    return I18N.position(target as Position) ?? target;
}

function join(values: Nullable<Nullable<any>[]>, separator: string = ', '): Nullable<string> {
    const sanitized = values?.filter(v => !isNullish(v));
    if (!sanitized?.length) return null;
    else return sanitized.join(separator);
}

function slotIcons(values: Nullable<Slot[]>): Nullable<string> {
    const sanitized = values?.filter(s => /^[a-z]+$/i.test(s));
    if (!sanitized?.length)
        return null;
    else {
        return sanitized.map(s => {
            if (s === 'MATCHING' || s === 'UNFAVORABLE') return `[${ s }]`;
            else return `<span class="optc-icon ${ Ui.getSlotIcon(s) } w-4 h-4" title="${ s }"></span>`;
        }).join('');
    }
}

/*-----
  Types
  -----*/

export type GimmickSpecs<K extends GimmickEffectType> = BaseGimmick & Extract<GimmickEffect, { type: K }>;

export type GimmickRegistry = { [K in GimmickEffectType]: GimmickDetails<GimmickSpecs<K>> };

export type GimmickDetails<G> = GimmickReadDetails<G> & GimmickWriteDetails<G>;

export type GimmickReadDetails<G> = {
    icon?: string | ((gimmick: G) => string);
    label: string | ((gimmick: G) => string);
    details?: ((gimmick: G) => Nullable<string>[]);
    lines?: ((gimmick: G) => Nullable<string>[]);
}

export type GimmickWriteDetails<G> = {
    turns?: boolean;
    usuallyPermanent?: boolean;
    fields?: { [K in GimmickWriteDetailsSpecName<G>]: GimmickWriteDetailsField<G> };
    validate?: ((gimmick: G) => Nullable<boolean>);
}

export type GimmickWriteDetailsField<G> = {
    type: GimmickWriteDetailsSpecType;
    label: string;
    required?: Nullable<boolean>;
    disabled?: ((gimmick: G) => Nullable<boolean>);
    visible?: ((gimmick: G) => Nullable<boolean>);
};

export type GimmickWriteDetailsSpecName<G> = Exclude<Extract<keyof G, string>, keyof BaseGimmick | 'type'>;

export type GimmickWriteDetailsSpecType =
    | 'boolean'
    | 'class'
    | 'immunity'
    | 'integer'
    | 'intimidation'
    | 'multiplier'
    | 'percentage'
    | 'position'
    | 'removableEffect'
    | 'slot'
    | 'slots'
    | 'targets'
    | 'timing';
