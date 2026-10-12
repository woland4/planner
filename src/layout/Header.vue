<script setup lang="ts">
    import { nextTick, ref, useTemplateRef, watch } from 'vue';
    import { isNullish } from 'remeda';

    import { useStore } from '@/store.ts';
    import { useResponsiveness } from '@/utils/responsiveness.ts';
    import type { DropdownMenuItem } from '@nuxt/ui';

    /*----
      Refs
      ----*/

    const tabsRef = useTemplateRef('tabsRef');

    /*-----------
      Injectables
      -----------*/

    const store = useStore();
    const responsiveness = useResponsiveness();

    /*-----
      State
      -----*/

    const tabDragStartIndex = ref<number | null>(null);

    /*--------
      Watchers
      --------*/

    watch(() => store.currentTabIndex, async () => {
        await nextTick();
        tabsRef.value?.children[store.currentTabIndex]?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
    });

    /*-------
      Methods
      -------*/

    function onEditTabName(index: number) {
        if (!store.tabs[index]) return;
        const oldName = store.tabs[index].name;
        const newName = prompt('New tab name:', oldName);
        if (!isNullish(newName))
            store.tabs[index].name = newName?.trim() || oldName;
    }

    function onCloseTab(index: number) {
        if (confirm('Close tab?'))
            store.closeTab(index);
    }

    function onTabDropped(index: number) {

        const from = tabDragStartIndex.value;
        tabDragStartIndex.value = null;
        if (from === null || from === index) return;

        const current = store.tabs[store.currentTabIndex];
        const [ moved ] = store.tabs.splice(from, 1);
        store.tabs.splice(index, 0, moved);
        store.reindexTabs(current);

    }

    function getContextMenuItems(index: number): DropdownMenuItem[][] {
        return [
            [
                { icon: 'i-lucide-copy', label: 'Clone tab', onSelect: () => store.cloneTab(index) }
            ],
            [
                { icon: 'i-lucide-panel-left-right-dashed', label: 'Close other tabs', onSelect: () => store.closeExcept(index) },
                { icon: 'i-lucide-panel-left-close', label: 'Close tabs to the left', onSelect: () => store.closeTabs(0, index - 1) },
                { icon: 'i-lucide-panel-right-close', label: 'Close tabs to the right', onSelect: () => store.closeTabs(index + 1, store.tabs.length) }
            ]
        ];
    }
</script>

<template>

    <UHeader :header="false"
             :ui="{
                 root: 'bg-black/30 shrink-0 z-10 [--ui-header-height:var(--header-height-mobile)] md:[--ui-header-height:var(--header-height-desktop)]',
                 container: 'py-5! md:py-0! md:px-5! md:mx-0! max-w-none!',
                 left: 'md:font-bold md:relative md:bottom-0.75'
             }"
             :style="{
                 '--ui-header-height': responsiveness.isDesktop.value ? 'var(--header-height-desktop)' : 'var(--header-height-mobile)'
             }">

        <template #left>

            <UButton icon="i-lucide-panel-left"
                     color="neutral"
                     variant="ghost"
                     class="mr-2 cursor-pointer"
                     @click="store.leftSidebarVisible = !store.leftSidebarVisible" />

            OPTC Planner

        </template>


        <template #right>
            <UButton icon="i-lucide-panel-right"
                     color="neutral"
                     variant="ghost"
                     class="cursor-pointer"
                     @click="store.rightSidebarVisible = !store.rightSidebarVisible" />
        </template>

        <template #toggle>
            &nbsp;
        </template>

    </UHeader>

    <!-- Tab bar -->
    <!-- UTabs sucks donkey balls, so it's a custom re-implementation with copy-pasted classes -->

    <div ref="tabsRef"
         class="tab-bar relative flex p-1 group w-full border-b -mb-px border-default shrink-0 z-10 overflow-x-auto overscroll-x-contain scroll-smooth">

        <UContextMenu v-for="(tab, n) in store.tabs"
                      :key="tab.index"
                      :items="getContextMenuItems(n)">
            <button :data-state="n === store.currentTabIndex ? 'active' : 'inactive'"
                    class="group relative inline-flex items-center basis-36 grow-0 shrink min-w-20 px-3 py-1.5 text-sm gap-1.5 font-medium rounded-md cursor-pointer transition-colors data-[state=inactive]:text-muted hover:data-[state=inactive]:text-default data-[state=active]:text-primary data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:inset-x-0 data-[state=active]:after:-bottom-px data-[state=active]:after:h-px data-[state=active]:after:bg-primary"
                    draggable="true"
                    @click="store.currentTabIndex = n"
                    @dragstart="tabDragStartIndex = n"
                    @dragover.prevent
                    @drop.prevent="onTabDropped(n)">

                <span class="min-w-0 overflow-hidden grow text-left">
                    <span class="block truncate"
                          @dblclick="onEditTabName(n)">
                        {{ tab.name ?? `Untitled Tab #${ n + 1 }` }}
                    </span>
                </span>

                <UIcon v-if="store.tabs.length > 1"
                       name="i-lucide-x"
                       class="w-2.5 h-2.5 shrink-0 ml-0.5 hover:text-red-500"
                       @click.stop="onCloseTab(n)" />

            </button>
        </UContextMenu>

        <button class="inline-flex items-center shrink-0 px-3 py-1.5 text-sm text-muted hover:text-default cursor-pointer"
                @click="store.newTab()">
            <UIcon name="i-lucide-plus" />
        </button>

    </div>

</template>

<style lang="scss">
    .tab-bar {

        scrollbar-width: none;

        &::-webkit-scrollbar {
            display: none;
        }

    }
</style>
