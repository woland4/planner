import type { Activation, Class, Immunity, Interruption, Intimidation, Position, RemovableEffect, Slot, Tag, Timing, Type } from '@/types/enums.ts';

export type BaseGimmick = {

    activation: Activation;
    turns?: number;

    // only for interruption activations
    triggers?: Interruption[];
    times?: number;

}

export type GimmickEffect =
    // Crew
    | { type: 'attackDown', reduction?: number }
    | { type: 'attackDownAboveChain', chain: number, reduction?: number }
    | { type: 'attackDownBelowChain', chain: number, reduction?: number }
    | { type: 'attackUp', multiplier?: number }
    | { type: 'bind', targets: GimmickTarget[] }
    | { type: 'bleed', fixed?: number, percentage?: number }
    | { type: 'blindness' }
    | { type: 'blowAway', targets: GimmickTarget[] }
    | { type: 'burn', immediate?: boolean, value?: number }
    | { type: 'cdReduction', targets: GimmickTarget[] }
    | { type: 'chainGrowthDown', multiplier?: number }
    | { type: 'chainLock', multiplier?: number, min?: number, max?: number }
    | { type: 'despair', targets?: GimmickTarget[] }
    | { type: 'healDamage' }
    | { type: 'beneficialEffectRemoval', only?: RemovableEffect }
    | { type: 'hunger', reduction?: number }
    | { type: 'increasedDamage', multiplier?: number }
    | { type: 'lockSlots', targets?: GimmickTarget[] }
    | { type: 'nao' }
    | { type: 'noPotentialAbilities' }
    | { type: 'noRcv' }
    | { type: 'pain', fixed?: number, percentage?: number }
    | { type: 'paralysis', targets: GimmickTarget[] }
    | { type: 'poison' }
    | { type: 'rcvDamage' }
    | { type: 'silence', targets: GimmickTarget[] }
    | { type: 'slotBind', targets: GimmickTarget[] }
    | { type: 'slotChange', from: Slot[], to: Slot[] }
    | { type: 'slotMultiplierChange', slots: Slot[], multiplier: number }
    | { type: 'slotUp', multiplier?: number }
    | { type: 'specialBind', targets?: GimmickTarget[] }
    | { type: 'specialLimit', limit: number }
    | { type: 'specialLock', timing: Timing }
    | { type: 'specialReverse', targets?: GimmickTarget[] }
    | { type: 'stun', targets?: GimmickTarget[] }
    | { type: 'superSwitchReduction', targets: GimmickTarget[] }
    | { type: 'swap', from?: Position, to?: Position }
    | { type: 'tapLimit', limit: number }
    | { type: 'tapTiming', harder?: boolean, easier?: boolean }
    | { type: 'targetLock' }
    | { type: 'typeUp', multiplier?: number }
    | { type: 'unfavorableSlots', slots: Slot[] }
    | { type: 'vsReduction', targets: GimmickTarget[] }
    // Enemy
    | { type: 'damage', amount?: number, percentage?: number }
    | { type: 'damageLimit', amount?: number }
    | { type: 'damageNullification' }
    | { type: 'damageReduction', reduction?: number }
    | { type: 'damageThreshold', threshold?: number, reduction?: number }
    | { type: 'defenseUp', amount?: number }
    | { type: 'endOfTurnDamage', amount?: number }
    | { type: 'healthCutResistance' }
    | { type: 'hitBarrier', hits: number }
    | { type: 'immunity', from?: Immunity, except?: Immunity }
    | { type: 'intimidation', effects: Intimidation[], reduction?: number }
    | { type: 'provoked' }
    | { type: 'resilience' }
    | { type: 'slotBarrier', slot: Slot, hits: number }
    | { type: 'slotDamageReduction', reduction?: number, slots: Slot[] }
    | { type: 'superTyping' }
    | { type: 'territory' }
    | { type: 'timingBarrier', timing: Timing, hits: number }
    | { type: 'weakness', to: Class };

export type Gimmick = BaseGimmick & GimmickEffect;

export type GimmickEffectType = GimmickEffect['type'];

export type GimmickTarget = Type | Class | Tag | Position;
