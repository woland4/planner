<script setup lang="ts">
    import { useEventListener } from '@vueuse/core';

    import Header from '@/layout/Header.vue';
    import LeftSidebar from '@/layout/LeftSidebar.vue';
    import Center from '@/layout/Center.vue';

    import UnitPopover from '@/components/UnitPopover.vue';

    import { UnitPopovers } from '@/utils/unitPopovers.ts';

    /*---------
      Lifecycle
      ---------*/

    useEventListener(document, 'scroll', () => UnitPopovers.hidePopover(null), true);
</script>

<template>
    <UApp>
        <div class="h-full flex flex-col">

            <Header />

            <Center />

            <LeftSidebar />

            <UPopover :key="UnitPopovers.currentUnit.value?.key"
                      :open="!!UnitPopovers.currentUnit.value"
                      :reference="UnitPopovers.currentUnit.value?.anchor"
                      :content="{ side: UnitPopovers.currentUnit.value?.side ?? 'bottom', onPointerDownOutside: (e: Event) => e.preventDefault() }"
                      :ui="{ content: 'pointer-events-none z-50' }"
                      mode="hover">

                <template #content>
                    <UnitPopover v-if="UnitPopovers.currentUnit.value"
                                 :key="`${ UnitPopovers.currentUnit.value.unitID }-${ UnitPopovers.currentUnit.value.variant }`"
                                 :unit-id="UnitPopovers.currentUnit.value.unitID"
                                 :variant="UnitPopovers.currentUnit.value.variant"
                                 :index="UnitPopovers.currentUnit.value.data?.index"
                                 :assume-llb="UnitPopovers.currentUnit.value.data?.llb"
                                 :support="UnitPopovers.currentUnit.value.data?.support"
                                 :hide-captain="UnitPopovers.currentUnit.value.data?.hideCaptain"
                                 :shift="UnitPopovers.currentUnit.value.data?.shift" />
                </template>

            </UPopover>

        </div>
    </UApp>
</template>
