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
    side: 'left' | 'right' | 'top' | 'bottom';
    data: Nullable<UnitPopoverData>;
};

export type UnitPopoverData = {
    index?: number;
    llb?: boolean;
    support?: boolean;
    hideCaptain?: boolean;
};

/*-------
  Exports
  -------*/

export const UnitPopovers = {

    currentUnit: shallowRef<Nullable<UnitPopoverTarget>>(null),

    showPopover(target: Omit<UnitPopoverTarget, 'key'>) {
        if (UnitPopovers.currentUnit.value?.anchor === target.anchor) return;
        UnitPopovers.currentUnit.value = { ...target, key: ++nextKey };
    },

    updatePopover(anchor: Nullable<HTMLElement>,
                  data: Nullable<UnitPopoverData>) {
        const current = UnitPopovers.currentUnit.value;
        if (!anchor || current?.anchor !== anchor) return;
        UnitPopovers.currentUnit.value = { ...current, data };
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
