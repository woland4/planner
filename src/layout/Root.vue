<script setup lang="ts">
    import { ref } from 'vue';
    import { useEventListener } from '@vueuse/core';

    import Header from '@/layout/Header.vue';
    import LeftSidebar from '@/layout/LeftSidebar.vue';
    import Center from '@/layout/Center.vue';

    import UnitPopover from '@/components/UnitPopover.vue';
    import RightSidebar from '@/layout/RightSidebar.vue';

    import { Database } from '@/utils/database.ts';
    import { UnitPopovers } from '@/utils/unitPopovers.ts';

    import loadingIcon from '@/assets/mmh.webp';

    /*-----
      State
      -----*/

    const isReady = ref(false);

    /*---------
      Lifecycle
      ---------*/

    Database.loadScripts().then(() => isReady.value = true);

    useEventListener(document, 'scroll', () => UnitPopovers.hidePopover(null), true);
</script>

<template>
    <UApp>
        <div class="h-full flex flex-col">

            <template v-if="isReady">
                <Header />
                <Center />
                <LeftSidebar />
                <RightSidebar />
            </template>

            <div v-else
                 class="fixed text-[12px] inset-0 flex flex-col items-center justify-center gap-1">

                <img :src="loadingIcon"
                     class="w-12 h-12" />

                Loading database data...

            </div>

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
                                 :llb-level="UnitPopovers.currentUnit.value.llbLevel"
                                 :index="UnitPopovers.currentUnit.value.data?.index"
                                 :support="UnitPopovers.currentUnit.value.data?.support"
                                 :hide-captain="UnitPopovers.currentUnit.value.data?.hideCaptain"
                                 :inside-modal="UnitPopovers.currentUnit.value.data?.insideModal" />
                </template>

            </UPopover>

        </div>
    </UApp>
</template>
