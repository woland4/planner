import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';
import { clone } from 'remeda';

import { useResponsiveness } from '@/utils/responsiveness.ts';

import type { Store, Tab } from '@/types/store.ts';
import type { Nullable } from '@/types/utils.ts';

const NEW_TAB: Tab = {
    index: -1,
    battle: null,
    team: { units: [ null, null, null, null, null, null ] }
}

export const useStore = defineStore('store', {

    state: () => ({

        tabs: useStorage<Tab[]>('tabs', [{ ...NEW_TAB, index: 0 }]),
        currentTabIndex: useStorage<number>('currentTab', 0),

        leftSidebarVisible: useResponsiveness().isDesktop.value,
        rightSidebarVisible: useResponsiveness().isDesktop.value

    }),

    getters: {
        currentTab: (state: Store) => state.tabs[state.currentTabIndex] ?? null
    },

    actions: {

        reindexTabs(current?: Nullable<Tab>) {
            for (let i=0; i<this.tabs.length; ++i) this.tabs[i].index = i;
            if (current) this.currentTabIndex = this.tabs.indexOf(current);
            else this.currentTabIndex = Math.min(this.currentTabIndex, this.tabs.length - 1);
        },

        newTab() {
            this.tabs.push({
                ...NEW_TAB,
                index: this.tabs.length,
                name: 'Untitled Tab #' + (this.tabs.length + 1)
            });
            this.currentTabIndex = this.tabs.length - 1;
        },

        cloneTab(index: number) {

            if (!this.tabs[index])
                return;

            const clonedTab = clone(this.tabs[this.currentTabIndex]);
            this.tabs.splice(index + 1, 0, clonedTab);

            for (let i=0; i<this.tabs.length; ++i)
                this.tabs[i].index = i;

            this.currentTabIndex = index + 1;

        },

        closeTabs(fromIndexInclusive: number,
                  toIndexInclusive: number) {

            if (fromIndexInclusive > toIndexInclusive)
                return;

            const removingCurrent = this.currentTabIndex >= fromIndexInclusive && this.currentTabIndex <= toIndexInclusive;
            const currentTab = this.tabs[this.currentTabIndex];
            const nextTab = this.tabs[this.currentTabIndex - 1] ?? this.tabs[this.currentTabIndex + 1];

            this.tabs.splice(fromIndexInclusive, toIndexInclusive + 1);

            if (this.tabs.length <= 0) {
                this.currentTabIndex = -1;
                return;
            }

            for (let i=0; i<this.tabs.length; ++i)
                this.tabs[i].index = i;

            if (removingCurrent)
                this.currentTabIndex = nextTab.index;
            else
                this.currentTabIndex = currentTab?.index ?? -1;

        },


        closeTab(index: number) {
            this.closeTabs(index, index);
        },

        closeExcept(index: number) {
            this.closeTabs(index + 1, this.tabs.length);
            this.closeTabs(0, index - 1);
        }

    }


});
