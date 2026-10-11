<script lang="ts">
    const numberFormatter = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });
</script>

<script setup lang="ts">
    import { computed } from 'vue';
    import { unique } from 'remeda';
    import { useOverlay } from '@nuxt/ui/composables';

    import Fieldset from '@/components/utils/Fieldset.vue';
    import UnitThumbnail from '@/components/UnitThumbnail.vue';
    import UnitPickingModal from '@/modals/UnitPickingModal.vue';

    import { Numbers } from '@/utils/numbers.ts';

    import type { Booster } from '@/types/battles.ts';
    import type { BoosterIssues } from '@/types/validation.ts';
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
        index: number,
        collapsed: boolean,
        validation?: Nullable<BoosterIssues>
    }>();

    /*-----
      Emits
      -----*/

    const emit = defineEmits<{
        toggle: [ index: number ],
        remove: [ index: number ]
    }>();

    /*-----
      State
      -----*/

    const model = defineModel<Partial<Booster>>({ required: true });

    /*--------
      Computed
      --------*/

    const summary = computed(() => {
        const result = [ ];
        if (Numbers.isPositive(model.value.pureMultiplier))
            result.push(`${ numberFormatter.format(model.value.pureMultiplier!!) }x boost`);
        else if (Numbers.isPositive(model.value.additiveMultiplier))
            result.push(`${ numberFormatter.format(model.value.additiveMultiplier!!) }x boost`);
        return result.length ? result.join(', ') : null;
    });

    /*-------
      Methods
      -------*/

    async function onAddUnit() {
        const modal = unitPickingModal.open({ storageKey: 'booster', exclude: model.value.ids, multiple: true, noVariants: true });
        const result = (await modal.result) as Nullable<{ id: number, variant?: number }[]>;
        if ((result?.length ?? 0) > 0) // TODO Fix for variant support
            model.value.ids = unique([ ...(model.value.ids ?? [ ]), ...(result!!.map(u => u.id) ?? [ ]) ]);
    }
</script>

<template>
    <UCard :ui="{
               root: 'mb-[10px]',
               header: 'py-1 pr-1! pl-1.5! bg-black/25',
               title: 'flex flex-row items-center gap-2',
               body: 'flex flex-col gap-3 px-5! pt-2! pb-5! bg-elevated/50' + (props.collapsed ? ' hidden' : '')
           }"
           class="booster-editor">

        <template #title>

            <UButton :icon="props.collapsed ? 'i-lucide-chevron-right' : 'i-lucide-chevron-down'"
                     color="neutral"
                     variant="ghost"
                     class="cursor-pointer"
                     @click="emit('toggle', props.index)" />

            Booster Group {{ props.index + 1 }}

            <small v-if="summary">
                ({{ summary }})
            </small>

            <UIcon v-if="props.validation?.length"
                   class="text-error inline-block ml-1 animate__animated animate__pulse animate__infinite"
                   name="i-lucide-circle-alert">
            </UIcon>

            <div class="grow" />

            <UButton color="neutral"
                     variant="ghost"
                     icon="i-lucide-menu"
                     class="booster-drag cursor-move" />

            <UButton color="error"
                     variant="ghost"
                     icon="i-lucide-trash"
                     class="cursor-pointer"
                     @click="emit('remove', props.index)" />

        </template>

        <Fieldset label="Bonuses"
                  class="flex flex-col items-stretch gap-2.5 p-3 pl-5 pb-5 bg-default md:flex-row">

            <FloatingLabel label="Multiplicative booster (TM, Kizuna)">
                <UFieldGroup class="w-full md:w-60">

                    <UInputNumber v-model="model.pureMultiplier"
                                  :step="0.05"
                                  :min="0.05"
                                  :increment="false"
                                  :decrement="false"
                                  :ui="{ root: 'w-full!' }"
                                  placeholder="Value" />

                    <UButton color="neutral"
                             variant="subtle"
                             tabindex="-1">
                        x
                    </UButton>

                </UFieldGroup>
            </FloatingLabel>

            <FloatingLabel label="Additive booster (PKA)">
                <UFieldGroup class="w-full md:w-60">

                    <UInputNumber v-model="model.additiveMultiplier"
                                  :step="0.05"
                                  :min="0.05"
                                  :increment="false"
                                  :decrement="false"
                                  :ui="{ root: 'w-full!' }"
                                  placeholder="Value" />

                    <UButton color="neutral"
                             variant="subtle"
                             tabindex="-1">
                        x
                    </UButton>

                </UFieldGroup>
            </FloatingLabel>

        </Fieldset>

        <Fieldset label="Units"
                  class="flex flex-row gap-2.5 p-3 pl-5 pb-5 bg-default">

            <UnitThumbnail v-for="id in model.ids"
                           :key="id"
                           :unit-id="id"
                           loading="lazy"
                           class="w-12.5 h-12.5 cursor-pointer rounded-[5px]"
                           @click="model.ids = (model.ids ?? [ ]).filter(i => i !== id)" />

            <UButton color="neutral"
                     variant="outline"
                     icon="i-lucide-plus"
                     class="w-12.5 h-12.5 cursor-pointer shadow-[none] border border-white/30 border-dashed rounded-[5px] justify-center"
                     @click="onAddUnit" />

        </Fieldset>

        <ul v-if="props.validation?.length"
            class="list-disc pl-4">
            <li v-for="(v,n) in props.validation"
                :key="n"
                class="text-error text-[12px]">
                {{ v }}
            </li>
        </ul>

    </UCard>
</template>
