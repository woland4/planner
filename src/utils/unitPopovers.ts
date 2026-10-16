import { shallowRef } from 'vue';

import type { Nullable } from '@/types/utils.ts';

/*-----
  Types
  -----*/

export type UnitPopoverTarget = {

    key: number;
    anchor: HTMLElement;

    unitID: number;
    variant: Nullable<number>;
    llbLevel: Nullable<number>;

    side: 'left' | 'right' | 'top' | 'bottom';
    data: Nullable<UnitPopoverData>;

};

export type UnitPopoverData = {
    index?: number;
    support?: boolean;
    hideCaptain?: boolean;
    insideModal?: boolean;
};

/*-------
  Exports
  -------*/

export const UnitPopovers = {

    currentUnit: shallowRef<Nullable<UnitPopoverTarget>>(null),

    showPopover(target: Omit<UnitPopoverTarget, 'key'>) {
        if (UnitPopovers.currentUnit.value?.anchor !== target.anchor)
            UnitPopovers.currentUnit.value = { ...target, key: ++nextKey };
    },

    updatePopover(anchor: Nullable<HTMLElement>,
                  delta: Partial<Omit<UnitPopoverTarget, 'key' | 'anchor'>>) {
        const current = UnitPopovers.currentUnit.value;
        if (anchor && current?.anchor === anchor)
            UnitPopovers.currentUnit.value = { ...current, ...delta };
    },

    hidePopover(anchor: Nullable<HTMLElement>) {
        if (!anchor || UnitPopovers.currentUnit.value?.anchor === anchor)
            UnitPopovers.currentUnit.value = null;
    }

};

/*---------
  Internals
  ---------*/

let nextKey = 0;
