<script setup lang="ts">
    import { ref } from 'vue';
    import { isNumber } from 'remeda';
    import { useOverlay } from '@nuxt/ui/composables';
    import { useSessionStorage } from '@vueuse/core';

    import UnitPickingModal from '@/modals/UnitPickingModal.vue';
    import UnitThumbnail from '@/components/UnitThumbnail.vue';

    import { Battles } from '@/utils/battles.ts';
    import { Units } from '@/utils/units.ts';

    import type { Booster, Team } from '@/types/battles.ts';
    import type { Nullable } from '@/types/utils.ts';

    /*-------
      Options
      -------*/

    defineOptions({ inheritAttrs: false });

    /*------
      Modals
      ------*/

    const overlay = useOverlay()
    const unitPickingModal = overlay.create(UnitPickingModal);

    /*-----
      Props
      -----*/

    const props = defineProps<{
        boosters?: Nullable<Booster[]>
    }>();

    /*-----
      State
      -----*/

    const model = defineModel<Team>({ required: true });

    const dragStart = ref<Nullable<number>>(null);
    const dragCurrent = ref<Nullable<number>>(null);

    const popoverData = useSessionStorage<Record<string, { index?: number }>>('picker.popovers', { });
    /*-------
      Methods
      -------*/

    async function onUnitClick(templateIndex: number) {

        const teamIndex = templateIndexToTeamIndex(templateIndex);

        const usedFamilies: string[] = [ ];
        for (let i=0; i<5; ++i) {
            if (i === teamIndex) continue;
            const unit = model.value.units[i];
            if (unit?.id) usedFamilies.push(...Units.getFamilies(unit.id, unit.variant));
            if (unit?.support) usedFamilies.push(...Units.getFamilies(unit.support));
        }

        const modal = unitPickingModal.open({
            storageKey: 'main',
            boosters: props.boosters,
            disabledFamilies: usedFamilies
        });

        const result = (await modal.result) as Nullable<{ id: number, variant?: number }>;
        if (isNumber(result?.id))
            model.value.units[teamIndex] = { id: result.id, variant: result.variant, support: null };
    }

    async function onUnitMiddleClick(templateIndex: number) {
        model.value.units[templateIndexToTeamIndex(templateIndex)] = null;
    }

    function onUnitLlbClick(templateIndex: number) {

        const unit = model.value.units[templateIndexToTeamIndex(templateIndex)];
        if (!unit) return;

        const llbLevels = [ 0, ...Units.getLlbLevels(unit.id) ];
        const index = llbLevels.indexOf(unit.llbLevel ?? 0);
        if (index === -1) unit.llbLevel = 0;
        else unit.llbLevel = llbLevels[(index + 1) % llbLevels.length];

    }

    function onUnitWheel(templateIndex: number, e: WheelEvent) {

        const fullID = getUnitFullID(templateIndex);
        if (!fullID) return;

        if (!Object.hasOwn(popoverData.value, fullID)) popoverData.value[fullID] = { };
        popoverData.value[fullID].index = (popoverData.value[fullID].index ?? 0) + (e.deltaY > 0 ? 1 : -1);

    }

    async function onSupportClick(templateIndex: number) {

        const teamIndex = templateIndexToTeamIndex(templateIndex);

        const usedFamilies: string[] = [ ];
        for (let i=0; i<5; ++i) {
            const unit = model.value.units[i];
            if (unit?.id) usedFamilies.push(...Units.getFamilies(unit.id, unit.variant));
            if (i !== teamIndex && unit?.support)
                usedFamilies.push(...Units.getFamilies(unit.support));
        }

        const modal = unitPickingModal.open({
            storageKey: 'support',
            supportedUnitID: getUnitID(templateIndex),
            supportedVariant: getUnitVariant(templateIndex),
            disabledFamilies: usedFamilies
        });

        const result = (await modal.result) as Nullable<{ id: number }>;
        if (isNumber(result?.id))
            model.value.units[teamIndex]!.support = result.id;

    }

    function onDragStart(e: DragEvent, templateIndex: number) {

        if (!hasUnit(templateIndex)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        dragStart.value = templateIndex;
        e.dataTransfer!.effectAllowed = 'move';
        e.dataTransfer!.setData('text/plain', '' + templateIndex);

    }

    function onDragDrop(templateIndex: number) {

        if (!dragStart.value) return;

        const sourceIndex = templateIndexToTeamIndex(dragStart.value);
        const targetIndex = templateIndexToTeamIndex(templateIndex);
        if (sourceIndex == targetIndex) return;

        const source = model.value.units[sourceIndex];
        model.value.units[sourceIndex] = model.value.units[targetIndex];
        model.value.units[targetIndex] = source;

        onDragEnd();

    }

    function onDragEnd() {
        dragStart.value = null;
        dragCurrent.value = null;
    }

    function hasUnit(templateIndex: number): boolean {
        return !!model.value.units[templateIndexToTeamIndex(templateIndex)]?.id;
    }

    function hasSupport(templateIndex: number): boolean {
        return !!model.value.units[templateIndexToTeamIndex(templateIndex)]?.support;
    }

    function getUnitID(templateIndex: number): Nullable<number> {
        return model.value.units[templateIndexToTeamIndex(templateIndex)]?.id ?? null;
    }

    function getUnitFullID(templateIndex: number): Nullable<string> {
        const data = model.value.units[templateIndexToTeamIndex(templateIndex)];
        if (!data?.id) return null;
        return `${ data.id }${ data.variant ? '-' + data.variant : '' }`;
    }

    function getUnitVariant(templateIndex: number): Nullable<number> {
        return model.value.units[templateIndexToTeamIndex(templateIndex)]?.variant ?? null;
    }

    function getUnitLlbLevel(templateIndex: number): number {
        return model.value.units[templateIndexToTeamIndex(templateIndex)]?.llbLevel ?? 0;
    }

    function templateIndexToTeamIndex(templateIndex: number): number {
        switch (templateIndex) {
            case 1: return 5;
            case 2: return 0;
            case 3: return 4;
            case 4: return 1;
            case 5: return 3;
            case 6: return 2;
            default: return -1;
        }
    }
</script>

<template>
    <div v-bind="$attrs"
         id="team-picker"
         class="inline-grid grid-cols-2 gap-3.75">

        <div v-for="n in 6"
             :key="n"
             :class="{ over: dragCurrent === n }"
             class="slot relative">

            <!-- Main -->

            <div :class="{ empty: !hasUnit(n), filled: hasUnit(n), supported: hasSupport(n) }"
                 class="unit relative w-28 h-28 flex flex-row justify-center items-center cursor-pointer text-white/30 rounded-[5px]"
                 draggable
                 @dragstart="e => onDragStart(e, n)"
                 @dragover.prevent="dragCurrent = n"
                 @dragleave.prevent="dragCurrent = null"
                 @drop.prevent="onDragDrop(n)"
                 @dragend="onDragEnd"
                 @click="onUnitClick(n)"
                 @click.middle.prevent="onUnitMiddleClick(n)"
                 @wheel.prevent="onUnitWheel(n, $event)">

                <template v-if="!hasUnit(n)">
                    Click to add
                </template>

                <template v-else>

                    <UnitThumbnail :unit-id="getUnitID(n)"
                                   :variant="getUnitVariant(n)"
                                   :llb-level="getUnitLlbLevel(n)"
                                   :boost="Battles.getBoost(getUnitID(n), props.boosters)"
                                   :popover-side="n % 2 === 0 ? 'right' : 'left'"
                                   :popover-data="{ ...popoverData[getUnitFullID(n)!], hideCaptain: n !== 1 && n !== 2 }" />

                    <UBadge v-if="Units.getLlbLevels(getUnitID(n))?.length"
                            class="absolute top-1 right-1 font-bold border border-red-800 hover:bg-red-300 cursor-pointer py-0.5 px-1 tracking-tighter select-none"
                            size="sm"
                            color="error"
                            @click.stop.prevent="onUnitLlbClick(n)">
                        LLB{{ getUnitLlbLevel(n) }}
                    </UBadge>

                </template>


            </div>

            <!-- Support -->

            <div v-if="hasUnit(n)"
                 :class="{ empty: !hasSupport(n), filled: hasSupport(n) }"
                 class="support w-12.5 h-12.5 absolute -bottom-1.25 -right-1.25 rounded-[5px] flex flex-row justify-center items-center cursor-pointer text-white/30"
                 @click="onSupportClick(n)"
                 @click.middle.prevent="model.units[templateIndexToTeamIndex(n)]!.support = null">

                <template v-if="!hasSupport(n)">
                    +
                </template>

                <UnitThumbnail v-else
                               :unit-id="model.units[templateIndexToTeamIndex(n)]!.support!"
                               :popover-side="n % 2 === 0 ? 'right' : 'left'"
                               :popover-data="{ support: true }" />

            </div>

        </div>

    </div>
</template>

<style lang="scss">
    #team-picker {

        .slot.over {
            outline: 2px solid green;
        }

        .boost {
            text-align: left;
            padding-left: 10%;
        }

        .unit.empty {
            border: 1px dashed #ffffff50;
        }

        .support.empty {
            border: 1px dashed #ffffff40;
            background: #ffffff30;
        }

        .unit.empty:hover {
            background: #ffffff10;
        }

        .support.empty:hover {
            background: #ffffff60;
        }

    }
</style>
