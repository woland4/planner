<script setup lang="ts">
    import { computed } from 'vue';

    import FloatingLabel from '@/components/utils/FloatingLabel.vue';

    import { Enums } from '@/utils/enums.js';

    import type { GimmickIssues } from '@/types/validation.ts';
    import type { Nullable } from '@/types/utils.ts';
    import type { Enemy } from '@/types/battles.ts';

    /*-------
      Options
      -------*/

    defineOptions({ inheritAttrs: false });

    /*-----
      Props
      -----*/

    const props = defineProps<{
        validation: Nullable<GimmickIssues>;
    }>();

    /*-----
      Emits
      -----*/

    const emit = defineEmits<{
        remove: [ ];
        tab: [ e: Event ];
    }>();

    /*-----
      State
      -----*/

    const model = defineModel<Partial<Enemy>>({ required: true });

    /*--------
      Computed
      --------*/

    const areEnemyTypesValid = computed(() => !model.value.types?.length || model.value.types?.length === 1 || model.value.types?.length === 2);

    const isEnemyCountValid = computed(() => (model.value?.count ?? 0) > 0);
</script>

<template>

    <div v-bind="$attrs"
         class="enemy-editor flex flex-row items-start gap-2.5">

        <!-- Enemy Drag Handle -->

        <UButton color="neutral"
                 variant="ghost"
                 icon="i-lucide-menu"
                 class="enemy-drag cursor-move" />

        <div class="grow flex flex-col gap-2.5 md:flex-row md:items-baseline">

            <div class="grow flex flex-col items-stretch gap-2.5 md:grow-0 md:flex-row md:flex-wrap">

                <!-- Types -->

                <FloatingLabel label="Types"
                               required>

                    <UInputMenu v-model="model.types"
                                :items="[ ...Enums.types ]"
                                :ui="{ root: 'w-full!', base: 'pl-3' }"
                                :color="areEnemyTypesValid ? 'primary' : 'error'"
                                :highlight="!areEnemyTypesValid"
                                placeholder="Types"
                                multiple />

                    <ul v-if="props.validation?.length"
                        class="mb-5 list-disc pl-4">
                        <li v-for="(v,m) in props.validation"
                            :key="m"
                            class="text-error text-[12px]">
                            {{ v }}
                        </li>
                    </ul>

                </FloatingLabel>

                <!-- Count -->

                <FloatingLabel label="Count"
                               required>
                    <UInputNumber v-model="model.count"
                                  :step="1"
                                  :min="1"
                                  :increment="false"
                                  :decrement="false"
                                  :color="isEnemyCountValid ? 'primary' : 'error'"
                                  :highlight="!isEnemyCountValid"
                                  :ui="{ root: 'w-full!' }"
                                  class="w-30"
                                  placeholder="Count" />
                </FloatingLabel>

            </div>

            <!-- Actions -->

            <UButton :ui="{ label: 'md:hidden' }"
                     label="Remove"
                     color="error"
                     variant="subtle"
                     icon="i-lucide-trash"
                     class="cursor-pointer  md:relative md:top-1"
                     @click="emit('remove')"
                     @keydown.tab.exact="emit('tab', $event)" />

        </div>

    </div>

    <ul v-if="props.validation?.length"
        class="list-disc pl-4">
        <li v-for="(v,n) in props.validation"
            :key="n"
            class="text-error text-[12px]">
            {{ v }}
        </li>
    </ul>

</template>
