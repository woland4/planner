import type { Activation, Immunity, Interruption, Intimidation, Position, RemovableEffect } from '@/types/enums.ts';

export const I18N = {

    activation(activation: Activation) {
        switch (activation) {
            case 'preexisting': return 'Starting';
            case 'preemptive': return 'Preemptive';
            case 'death': return 'On death';
            case 'interruption': return 'Interruption';
        }
    },

    immunity(immunity: Immunity): string {
        switch (immunity) {
            case 'death': return 'Instant death';
            case 'delay': return 'Delay';
            case 'defenseDown': return 'Defense down';
            case 'poison': return 'Poison';
        }
    },

    interruption(interruption: Interruption): string {
        switch (interruption) {
            case 'after1Turn': return 'After 1 turn';
            case 'attackUp': return 'Attack up';
            case 'burn': return 'Burn';
            case 'burnRemoval': return 'Burn removal';
            case 'chainUpAdditive': return 'Chain up (add.)';
            case 'chainUpMultiplicative': return 'Chain up (mult.)';
            case 'damageReduction': return 'Damage reduction';
            case 'defenseDown': return 'Defense down';
            case 'endOfTurnDamage': return 'End-of-turn damage';
            case 'naoRemoval': return 'NAO removal';
            case 'slotUp': return 'Slot up';
            case 'territory': return 'Territory';
            case 'typeUp': return 'Type up';
        }
    },

    intimidation(intimidation: Intimidation): string {
        switch (intimidation) {
            case 'attackUp': return 'Attack up';
            case 'slotUp': return 'Slot up';
            case 'typeUp': return 'Type up';
            case 'baseAttackUp': return 'Base attack up';
        }
    },

    position(position: Position): string {
        switch (position) {
            case 'bottomLeft': return 'Bottom left';
            case 'bottomRight': return 'Bottom right';
            case 'bottomRow': return 'Bottom row';
            case 'crewmates': return 'Crewmates';
            case 'leftColumn': return 'Left column';
            case 'leftCrewmates': return 'Left crewmates';
            case 'rightColumn': return 'Right column';
            case 'rightCrewmates': return 'Right crewmates';
            case 'middleLeft': return 'Middle left';
            case 'middleRight': return 'Middle right';
            case 'middleRow': return 'Middle row';
            case 'random': return 'Random';
            case 'randomCrewmate': return 'Random crewmate';
            case 'topLeft': return 'Top left';
            case 'topRight': return 'Top right';
            case 'topRow': return 'Top row';
        }
    },

    removableEffect(effect: RemovableEffect): string {
        switch (effect) {
            case 'eotDamage': return 'End-of-turn damage';
        }
    }

};
