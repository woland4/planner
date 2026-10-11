<script setup lang="ts">
    import { computed } from 'vue';
    import { useStorage } from '@vueuse/core';

    import TeamLoadingModal from '@/modals/TeamLoadingModal.vue';
    import TeamPicker from '@/components/TeamPicker.vue';

    import { Battles } from '@/utils/battles.ts';
    import { Export } from '@/utils/export.js';
    import { useStore } from '@/store.ts';

    import type { SavedTeam } from '@/types/battles';
    import type { Nullable } from '@/types/utils.ts';

    /*-----------
      Injectables
      -----------*/

    const store = useStore();

    /*--------
      Overlays
      --------*/

    const overlay = useOverlay();
    const toast = useToast();

    const teamLoadingModal = overlay.create(TeamLoadingModal);

    /*--------
      Computed
      --------*/

    const totalBoost = computed<Nullable<number>>(() => Battles.getOverallBoost(store.currentTab.team?.units, store.currentTab.battle?.boosters));

    /*-------
      Methods
      -------*/

    function onClear() {
        store.currentTab.team = {
            //ship: { id: 1, level: 10, stars: 0 },
            units: [ null, null, null, null, null, null ]
        };
    }

    function onSave() {

        const saved = useStorage<SavedTeam[]>('savedTeams', [ ]);
        saved.value.unshift({
            name: `Team #${ (saved.value?.length ?? 0) + 1 }`,
            ...store.currentTab.team
        });

        toast.add({
            icon: 'i-ri-save-2-line',
            title: 'Team saved.',
            color: 'success',
            duration: 2000
        });

    }

    async function onLoad() {
        const modal = teamLoadingModal.open({ boosters: store.currentTab.battle?.boosters });
        const result = await modal.result;
        if (result)
            store.currentTab.team = result;
    }

    async function onExport(e: MouseEvent) {

        const blob = Export.teamScreenshot(
            store.currentTab.battle,
            store.currentTab.team,
            e.shiftKey ? store.currentTab?.name : null
        );
        await navigator.clipboard.write([ new ClipboardItem({ 'image/png': blob }) ]);

        toast.add({
            icon: 'i-ri-save-2-line',
            title: 'Copied to clipboard.',
            color: 'success',
            duration: 2000
        });

    }
</script>

<template>
    <div v-if="store.currentTab"
         class="h-full flex flex-col justify-center items-center gap-2.5 p-5">

        <TeamPicker v-model="store.currentTab.team"
                    :boosters="store.currentTab.battle?.boosters"
                    class="mb-1.25" />

        <div class="flex flex-row gap-1.25">

            <UTooltip :content="{ side: 'top' }"
                      :delay-duration="0"
                      text="Clear">
                <UButton icon="i-ri-eraser-fill"
                         color="neutral"
                         variant="subtle"
                         class="cursor-pointer"
                         @click="onClear" />
            </UTooltip>

            <UTooltip :content="{ side: 'top' }"
                      :delay-duration="0"
                      text="Save">
                <UButton icon="i-ri-save-2-line"
                         color="neutral"
                         variant="subtle"
                         class="cursor-pointer"
                         @click="onSave" />
            </UTooltip>

            <UTooltip :content="{ side: 'top' }"
                      :delay-duration="0"
                      text="Load">
                <UButton icon="i-ri-upload-2-line"
                         color="neutral"
                         variant="subtle"
                         class="cursor-pointer"
                         @click="onLoad" />
            </UTooltip>

            <UTooltip :content="{ side: 'top' }"
                      :delay-duration="0"
                      text="Screenshot">
                <UButton icon="i-ri-screenshot-2-line"
                         color="neutral"
                         variant="subtle"
                         class="cursor-pointer"
                         @click="onExport" />

            </UTooltip>

        </div>

        <UAlert v-if="totalBoost"
                color="success"
                variant="subtle"
                class="w-fit text-center p-2">
            <template #title>
                Overall Boost:
                <strong>{{ totalBoost.toFixed(2) }}x</strong>
            </template>
        </UAlert>

    </div>
</template>
