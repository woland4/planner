<script setup lang="ts">
    import { computed } from 'vue';
    import { isFunction, isNullish, sortBy, values } from 'remeda';

    import FloatingLabel from '@/components/utils/FloatingLabel.vue';
    import BasicSelect from '@/components/utils/BasicSelect.vue';

    import { GimmickRegistry } from '@/utils/registry.ts';
    import { Gimmicks } from '@/utils/gimmicks.ts';
    import { Enums } from '@/utils/enums.js';
    import { I18N } from '@/utils/i18n.ts';

    import type { Gimmick, GimmickEffectType } from '@/types/gimmicks.ts';
    import type { Position } from '@/types/enums.ts';
    import type { GimmickIssues } from '@/types/validation.ts';
    import type { Nullable } from '@/types/utils.ts';

    /*---------
      Constants
      ---------*/

    const TARGET_ITEMS = [
        ...Enums.types,
        { type: 'separator' },
        ...Enums.classes,
        { type: 'separator' },
        ...Enums.positions,
        { type: 'separator' },
        ...values(Enums.tags).flat()
    ].map((v: any) => v.type ? v : ({ value: v, label: I18N.position(v as Position) ?? v }));

    const INTIMIDATION_ITEMS = Enums.intimidations.map(value => ({ value, label: I18N.intimidation(value) }));

    const INTERRUPTION_ITEMS = Enums.interruptions.map(value => ({ value, label: I18N.interruption(value) }));

    const TYPE_OPTIONS = sortBy<GimmickEffectType[]>(Enums.gimmickTypes, (t) => getTypeLabel(t));

    /*-------
      Options
      -------*/

    defineOptions({ inheritAttrs: false });

    /*-----
      Props
      -----*/

    const props = defineProps<{
        validation: Nullable<GimmickIssues>
    }>();

    /*-----
      Emits
      -----*/

    const emit = defineEmits<{
        remove: [ ],
        tab: [ e: Event ]
    }>();

    /*-----
      State
      -----*/

    const model = defineModel<Partial<Gimmick>>({ required: true });

    /*--------
      Computed
      --------*/

    // Used for the additional fields to avoid typing headaches
    const draft = computed(() => model.value as Record<string, any>);

    const details = computed(() => Gimmicks.getGimmickDetails(model.value?.type));

    /*-------
      Methods
      -------*/

    function getTypeLabel(type: GimmickEffectType): string {
        const label = GimmickRegistry[type]?.label;
        if (isFunction(label)) return label({ } as any);
        else return label;
    }

    function onTypeUpdated() {
        if (details.value?.usuallyPermanent && isNullish(model.value.turns))
            model.value.turns = 99;
    }

    function onActivationUpdated() {
        delete model.value.triggers;
        delete model.value.times;
        if (model.value.activation === 'interruption') {
            model.value.triggers = [ ];
            model.value.times = 99;
        }
    }

    function isVisible(field: string): boolean {
        return details.value?.fields?.[field]?.visible?.(model.value) ?? true;
    }

    function isDisabled(field: string): boolean {
        return details.value?.fields?.[field]?.disabled?.(model.value) ?? false;
    }
</script>

<template>

    <div v-bind="$attrs"
         class="gimmick-editor flex flex-row items-start gap-2.5">

        <!-- Gimmick Drag Handle -->

        <UButton color="neutral"
                 variant="ghost"
                 icon="i-lucide-menu"
                 class="gimmick-drag cursor-move" />

        <div class="grow flex flex-col gap-2.5 md:flex-row md:items-baseline">

            <div class="grow flex flex-col items-stretch gap-2.5 md:grow-0 md:flex-row md:flex-wrap">

                <!-- Activation -->

                <FloatingLabel label="Activation"
                               required>
                    <BasicSelect v-model="model.activation"
                                 :class="{ 'border-red-500': !model.activation, 'max-md:w-full': true }"
                                 placeholder="Activation"
                                 @update:model-value="onActivationUpdated">
                        <option v-for="activation in Enums.activations"
                                :key="activation"
                                :value="activation">
                            {{ I18N.activation(activation) }}
                        </option>
                    </BasicSelect>
                </FloatingLabel>

                <!-- Interruption Trigger -->

                <FloatingLabel v-if="model.activation === 'interruption'"
                               label="Interruption Triggers"
                               required>
                    <UInputMenu v-model="model.triggers"
                                :items="INTERRUPTION_ITEMS"
                                :color="!model.triggers?.length ? 'error' : 'primary'"
                                :highlight="!model.triggers?.length"
                                :ui="{ root: 'max-md:w-full!' }"
                                value-key="value"
                                label-key="label"
                                placeholder="Triggers"
                                multiple />
                </FloatingLabel>

                <!-- Interruption Times -->

                <FloatingLabel v-if="model.activation === 'interruption'"
                               label="Interruption Times"
                               required>
                    <UInputNumber v-model="model.times"
                                  :step="1"
                                  :min="1"
                                  :increment="false"
                                  :decrement="false"
                                  :color="(model.times ?? 0) > 0 ? 'primary' : 'error'"
                                  :highlight="!((model.times ?? 0) > 0)"
                                  :ui="{ root: 'max-md:w-full!' }"
                                  class="w-35" />
                </FloatingLabel>

                <!-- Type -->

                <FloatingLabel label="Type"
                               required>
                    <BasicSelect v-model="model.type"
                                 :class="{ 'border-red-500': !model.type, 'max-md:w-full': true }"
                                 placeholder="Type"
                                 @update:model-value="onTypeUpdated">
                        <option v-for="type in TYPE_OPTIONS"
                                :key="type"
                                :value="type">
                            {{ getTypeLabel(type) ?? type }}
                        </option>
                    </BasicSelect>
                </FloatingLabel>

                <!-- Turns -->

                <FloatingLabel v-if="model.type && details?.turns !== false"
                               label="Turns"
                               required>
                    <UInputNumber v-model="model.turns"
                                  :step="1"
                                  :min="1"
                                  :increment="false"
                                  :decrement="false"
                                  :color="(model.turns ?? 0) > 0 ? 'primary' : 'error'"
                                  :highlight="!((model.turns ?? 0) > 0)"
                                  :ui="{ root: 'max-md:w-full!' }"
                                  class="w-20" />
                </FloatingLabel>

                <!-- Additional Fields -->

                <template v-if="details?.fields">
                    <template v-for="(data, key) in details.fields"
                              :key="key">
                        <FloatingLabel v-if="isVisible(key)"
                                       :label="data.label"
                                       :required="!!data.required">

                            <!-- Boolean -->

                            <UCheckbox v-if="data.type === 'boolean'"
                                       v-model="draft[key]"
                                       :disabled="isDisabled(key)"
                                       :ui="{ root: 'border-accented' }"
                                       label="Yes"
                                       class="p-1.25 w-30"
                                       color="neutral"
                                       variant="card"
                                       default-value />

                            <!-- Class -->

                            <BasicSelect v-else-if="data.type === 'class'"
                                         v-model="draft[key]"
                                         :disabled="isDisabled(key)"
                                         :class="{ 'border-red-500': data.required && !draft[key], 'max-md:w-full': true }"
                                         placeholder="Class">
                                <option v-for="clazz in Enums.classes"
                                        :key="clazz"
                                        :value="clazz">
                                    {{ clazz }}
                                </option>
                            </BasicSelect>

                            <!-- Immunity -->

                            <BasicSelect v-else-if="data.type === 'immunity'"
                                         v-model="draft[key]"
                                         :disabled="isDisabled(key)"
                                         :class="{ 'border-red-500': data.required && !draft[key], 'max-md:w-full': true }"
                                         placeholder="Immunity">

                                <option v-if="!data.required"
                                        :value="null">
                                    {{ draft[key] ? '(Unset)' : 'Immunity' }}
                                </option>

                                <option v-for="immunity in Enums.immunities"
                                        :key="immunity"
                                        :value="immunity">
                                    {{ I18N.immunity(immunity) }}
                                </option>

                            </BasicSelect>

                            <!-- Integer -->

                            <UInputNumber v-else-if="data.type === 'integer'"
                                          v-model="draft[key]"
                                          :step="1"
                                          :min="1"
                                          :increment="false"
                                          :decrement="false"
                                          :color="data.required && !draft[key] ? 'error' : 'primary'"
                                          :highlight="!!data.required && !draft[key]"
                                          :disabled="isDisabled(key)"
                                          :ui="{ root: 'max-md:w-full!' }"
                                          placeholder="Value"
                                          class="w-30" />

                            <!-- Intimidation -->

                            <UInputMenu v-else-if="data.type === 'intimidation'"
                                        v-model="draft[key]"
                                        :items="INTIMIDATION_ITEMS"
                                        :color="data.required && !draft[key] ? 'error' : 'primary'"
                                        :highlight="!!data.required && !draft[key]"
                                        :disabled="isDisabled(key)"
                                        :ui="{ root: 'max-md:w-full!' }"
                                        value-key="value"
                                        label-key="label"
                                        placeholder="Effects"
                                        multiple />

                            <!-- Multiplier/Percentage -->

                            <UFieldGroup v-else-if="data.type === 'multiplier' || data.type === 'percentage'"
                                         class="w-full md:w-35">

                                <UInputNumber v-model="draft[key]"
                                              :step="0.1"
                                              :min="1"
                                              :increment="false"
                                              :decrement="false"
                                              :color="data.required && !draft[key] ? 'error' : 'primary'"
                                              :highlight="!!data.required && !draft[key]"
                                              :disabled="isDisabled(key)"
                                              :ui="{ root: 'grow' }"
                                              placeholder="Value" />

                                <UButton color="neutral"
                                         variant="subtle"
                                         tabindex="-1">
                                    {{ data.type === 'multiplier' ? 'x' : '%' }}
                                </UButton>

                            </UFieldGroup>

                            <!-- Position -->

                            <BasicSelect v-else-if="data.type === 'position'"
                                         v-model="draft[key]"
                                         :disabled="isDisabled(key)"
                                         :class="{ 'border-red-500': data.required && !draft[key], 'max-md:w-full': true }"
                                         placeholder="Position">
                                <option v-for="position in Enums.positions"
                                        :key="position"
                                        :value="position">
                                    {{ I18N.position(position) }}
                                </option>
                            </BasicSelect>

                            <!-- Removable Effect -->

                            <BasicSelect v-else-if="data.type === 'removableEffect'"
                                         v-model="draft[key]"
                                         :disabled="isDisabled(key)"
                                         :class="{ 'border-red-500': data.required && !draft[key], 'max-md:w-full': true }"
                                         placeholder="Effect">

                                <option v-if="!data.required"
                                        :value="null">
                                    {{ draft[key] ? '(Unset)' : 'Effect' }}
                                </option>

                                <option v-for="effect in Enums.removableEffects"
                                        :key="effect"
                                        :value="effect">
                                    {{ I18N.removableEffect(effect) }}
                                </option>

                            </BasicSelect>

                            <!-- Slot -->

                            <BasicSelect v-else-if="data.type === 'slot'"
                                         v-model="draft[key]"
                                         :disabled="isDisabled(key)"
                                         :class="{ 'border-red-500': data.required && !draft[key], 'max-md:w-full': true }"
                                         placeholder="Slot">
                                <option v-for="slot in Enums.slots"
                                        :key="slot"
                                        :value="slot">
                                    {{ slot }}
                                </option>
                            </BasicSelect>

                            <!-- Slots -->

                            <UInputMenu v-else-if="data.type === 'slots'"
                                        v-model="draft[key]"
                                        :items="[ ...Enums.slots ]"
                                        :color="data.required && !draft[key] ? 'error' : 'primary'"
                                        :highlight="!!data.required && !draft[key]"
                                        :disabled="isDisabled(key)"
                                        :ui="{ root: 'max-md:w-full!' }"
                                        placeholder="Slots"
                                        multiple />

                            <!-- Targets -->

                            <UInputMenu v-else-if="data.type === 'targets'"
                                        v-model="draft[key]"
                                        :items="TARGET_ITEMS"
                                        :color="data.required && !draft[key] ? 'error' : 'primary'"
                                        :highlight="!!data.required && !draft[key]"
                                        :disabled="isDisabled(key)"
                                        :ui="{ root: 'max-md:w-full!' }"
                                        value-key="value"
                                        label-key="label"
                                        placeholder="Targets"
                                        multiple />

                            <!-- Timing -->

                            <BasicSelect v-else-if="data.type === 'timing'"
                                         v-model="draft[key]"
                                         :disabled="isDisabled(key)"
                                         :class="{ 'border-red-500': data.required && !draft[key], 'max-md:w-full': true }"
                                         placeholder="Timing"
                                         class="w-30">
                                <option v-for="timing in Enums.timings"
                                        :key="timing"
                                        :value="timing">
                                    {{ timing }}
                                </option>
                            </BasicSelect>

                        </FloatingLabel>
                    </template>
                </template>

            </div>

            <!-- Actions -->

            <UButton :ui="{ label: 'md:hidden' }"
                     label="Remove"
                     color="error"
                     variant="subtle"
                     icon="i-lucide-trash"
                     class="cursor-pointer md:relative md:top-1"
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
