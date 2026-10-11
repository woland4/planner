import { Enums } from '@/utils/enums.ts';

export type Activation = typeof Enums.activations[number];

export type Class = typeof Enums.classes[number];

export type GimmickType = typeof Enums.gimmickTypes[number];

export type Immunity = typeof Enums.immunities[number];

export type Interruption = typeof Enums.interruptions[number];

export type Intimidation = typeof Enums.intimidations[number];

export type Position = typeof Enums.positions[number];

export type RemovableEffect = typeof Enums.removableEffects[number];

export type Slot = typeof Enums.slots[number];

export type Tag =
    | typeof Enums.tags.crews[number]
    | typeof Enums.tags.titles[number]
    | typeof Enums.tags.fruits[number]
    | typeof Enums.tags.arcs[number];

export type Timing = typeof Enums.timings[number];

export type Type = typeof Enums.types[number];
