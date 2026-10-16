<script setup lang="ts">
    import { onBeforeUnmount, useTemplateRef, watch } from 'vue';
    import { isNullish } from 'remeda';

    import { useResponsiveness } from '@/utils/responsiveness.ts';
    import { Units } from '@/utils/units.ts';
    import { type UnitPopoverData, UnitPopovers } from '@/utils/unitPopovers.ts';

    import type { Nullable } from '@/types/utils.ts';

    /*-------
      Options
      -------*/

    defineOptions({ inheritAttrs: false });

    /*----
      Refs
      ----*/

    const rootRef = useTemplateRef<HTMLElement>('rootRef');

    /*-----
      Props
      -----*/

    const props = defineProps<{

        unitId: Nullable<number>;
        variant?: Nullable<number>;
        llbLevel?: Nullable<number>;

        boost?: Nullable<number>,
        popoverSide?: 'left' | 'right' | 'top' | 'bottom';
        popoverData?: Nullable<UnitPopoverData>;

    }>();

    /*-----------
      Injectables
      -----------*/

    const responsiveness = useResponsiveness();

    /*--------
      Watchers
      --------*/

    watch(() => props.popoverData, data => UnitPopovers.updatePopover(rootRef.value, { data }));

    watch(() => props.llbLevel, llbLevel => UnitPopovers.updatePopover(rootRef.value, { llbLevel: llbLevel ?? 0 }));

    /*-------
      Methods
      -------*/

    function onPointerEnter() {
        if (!props.popoverSide || !props.unitId || !rootRef.value || !responsiveness.isDesktop.value)
            return;
        UnitPopovers.showPopover({

            anchor: rootRef.value,

            unitID: props.unitId,
            variant: props.variant ?? null,
            llbLevel: props.llbLevel ?? 0,

            side: props.popoverSide,
            data: props.popoverData

        });
    }

    function onPointerLeave() {
        if (responsiveness.isDesktop.value)
            UnitPopovers.hidePopover(rootRef.value);
    }

    /*---------
      Lifecycle
      ---------*/

    onBeforeUnmount(() => UnitPopovers.hidePopover(rootRef.value));
</script>

<template>
    <div ref="rootRef"
         v-bind="$attrs"
         :unit-id="props.unitId"
         :unit-variant="props.variant"
         class="unit-thumbnail inline-block relative"
         @pointerenter="onPointerEnter"
         @pointerleave="onPointerLeave">

        <!-- Main thumb -->

        <img :src="Units.getThumbnailURL(props.unitId, props.variant)"
             class="rounded-[5px]"
             @error.once="($event.target as HTMLImageElement).src = Units.getThumbnailURL(props.unitId, props.variant, true)" />

        <!-- Boost overlay -->

        <template v-if="!isNullish(props.boost)">

            <div class="boost-overlay absolute inset-0 pointer-events-none bg-[#ffc400] rounded-[5px]" />

            <div class="boost absolute left-0 right-0 bottom-[5%] cursor-pointer text-[#ffc400] text-center text-[11px] font-bold">
                {{ props.boost?.toFixed(2) }}x
            </div>

        </template>

    </div>
</template>

<style lang="scss">
    .unit-thumbnail {

        .boost-overlay {
            animation: unit-thumbnail-boost-overlay-animation 2s linear infinite;
        }

        .boost {
            -webkit-text-stroke: 4px black;
            paint-order: stroke fill;
        }

    }

    @keyframes unit-thumbnail-boost-overlay-animation {
        0%, 100% { opacity: 0; }
        50% { opacity: 0.5; }
    }
</style>
