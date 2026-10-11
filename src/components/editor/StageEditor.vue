<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import { VueDraggable } from 'vue-draggable-plus';

    import Fieldset from '@/components/utils/Fieldset.vue';
    import GimmickEditor from '@/components/editor/GimmickEditor.vue';
    import EnemyEditor from '@/components/editor/EnemyEditor.vue';

    import { useResponsiveness } from '@/utils/responsiveness.ts';
    import { Validations } from '@/utils/validation.ts';

    import type { Stage } from '@/types/battles.ts';
    import type { StageValidation } from '@/types/validation.ts';
    import type { Nullable } from '@/types/utils.ts';

    /*-------
      Options
      -------*/

    defineOptions({ inheritAttrs: false });

    /*----
      Refs
      ----*/

    const rootRef = useTemplateRef('rootRef');

    /*-----
      Props
      -----*/

    const props = defineProps<{
        index: number,
        collapsed: boolean,
        validation?: Nullable<StageValidation>
    }>();

    /*-----
      Emits
      -----*/

    const emit = defineEmits<{
        toggle: [ index: number ],
        remove: [ index: number ]
    }>();

    /*-----------
      Injectables
      -----------*/

    const responsiveness = useResponsiveness();

    /*-----
      State
      -----*/

    const model = defineModel<Partial<Stage>>({ required: true });

    /*-------
      Methods
      -------*/

    function onAddEnemy() {
        if (!model.value.enemies)
            model.value.enemies = [ ];
        model.value.enemies.push({ types: [ ], count: 1 });
        focusOnLastEnemy();
    }

    function onAddGimmick() {
        if (!model.value.gimmicks)
            model.value.gimmicks = [ ];
        if (!model.value.gimmicks[model.value.gimmicks.length - 1]?.activation)
            model.value.gimmicks.push({ } as any);
        else {
            const last = model.value.gimmicks[model.value.gimmicks.length - 1];
            const gimmick = { activation: last.activation } as any;
            if (last.activation === 'interruption') gimmick.times = last.times;
            model.value.gimmicks.push(gimmick);
        }
        focusOnLastGimmick();
    }

    function onGimmickTab(e: Event, index: number) {
        if (index !== (model.value.gimmicks?.length ?? 0) - 1)
            return;
        e.preventDefault();
        onAddGimmick();
    }

    function onEnemyTab(e: Event, index: number) {
        if (index !== (model.value.enemies?.length ?? 0) - 1)
            return;
        e.preventDefault();
        onAddEnemy();
    }

    function focusOnLastGimmick() {
        if (!responsiveness.isDesktop.value) return;
        requestAnimationFrame(() => {
            const targets = rootRef.value?.$el?.querySelectorAll?.('.gimmick-editor');
            if (targets?.length)
                targets[targets.length - 1].querySelector('select')?.focus?.();
        });
    }

    function focusOnLastEnemy() {
        if (!responsiveness.isDesktop.value) return;
        requestAnimationFrame(() => {
            const targets = rootRef.value?.$el?.querySelectorAll?.('.enemy-editor');
            if (targets?.length)
                targets[targets.length - 1].querySelector('input')?.focus?.();
        });
    }
</script>

<template>
    <UCard ref="rootRef"
           :ui="{ root: 'mb-[10px]', header: 'py-1 pr-1! pl-1.5! bg-black/25', title: 'flex flex-row items-center gap-2', body: 'flex flex-col gap-3 px-5! pt-2! pb-5! bg-elevated/50' + (props.collapsed ? ' hidden' : '') }"
           class="stage-editor">

        <template #title>

            <UButton :icon="props.collapsed ? 'i-lucide-chevron-right' : 'i-lucide-chevron-down'"
                     color="neutral"
                     variant="ghost"
                     class="cursor-pointer"
                     @click="emit('toggle', props.index)" />

            Stage {{ props.index + 1 }}

            <UIcon v-if="Validations.hasStageIssues(props.validation)"
                   class="text-error inline-block ml-1 animate__animated animate__pulse animate__infinite"
                   name="i-lucide-circle-alert">
            </UIcon>

            <div class="grow" />

            <UButton color="neutral"
                     variant="ghost"
                     icon="i-lucide-menu"
                     class="stage-drag cursor-move" />

            <UButton color="error"
                     variant="ghost"
                     icon="i-lucide-trash"
                     class="cursor-pointer"
                     @click="emit('remove', props.index)" />

        </template>

        <!-- Enemies -->

        <Fieldset v-if="!props.collapsed"
                  label="Enemies"
                  class="p-3 pl-5! pt-3! bg-default flex flex-col">

            <VueDraggable v-if="model.enemies?.length"
                          v-model="model.enemies"
                          handle=".enemy-drag">
                <EnemyEditor v-for="(_, n) in model.enemies"
                             v-model="model.enemies!![n]"
                             :key="n"
                             :validation="props.validation?.enemies?.[n]"
                             :class="{
                                 'max-md:pt-3.5 max-md:mt-3.5 max-md:border-t max-md:border-accented': n > 0,
                                 'mb-1.5!': n < model.enemies.length - 1
                             }"
                             @remove="model.enemies!!.splice(n, 1)"
                             @tab="e => onEnemyTab(e, n)" />
            </VueDraggable>

            <UButton :class="{ 'mt-2.5': model.enemies?.length }"
                     color="warning"
                     variant="subtle"
                     icon="i-lucide-plus"
                     size="sm"
                     class="self-start cursor-pointer"
                     @click="onAddEnemy">
                Add enemy
            </UButton>

        </Fieldset>

        <!-- Gimmicks -->

        <Fieldset v-if="!props.collapsed"
                  label="Gimmicks"
                  class="p-3 pl-5! pt-3! bg-default flex flex-col">

            <VueDraggable v-if="model.gimmicks?.length"
                          v-model="model.gimmicks"
                          handle=".gimmick-drag">
                <GimmickEditor v-for="(_, n) in model.gimmicks"
                               v-model="model.gimmicks!![n]"
                               :key="n"
                               :validation="props.validation?.gimmicks?.[n]"
                               :class="{
                                   'max-md:pt-3.5 max-md:mt-3.5 max-md:border-t max-md:border-accented': n > 0,
                                   'mb-1.5!': n < model.gimmicks.length - 1
                               }"
                               @remove="model.gimmicks!!.splice(n, 1)"
                               @tab="e => onGimmickTab(e, n)" />
            </VueDraggable>

            <UButton :class="{ 'mt-2.5': model.gimmicks?.length }"
                     color="warning"
                     variant="subtle"
                     icon="i-lucide-plus"
                     size="sm"
                     class="self-start cursor-pointer"
                     @click="onAddGimmick">
                Add gimmick
            </UButton>

        </Fieldset>

        <!-- Stage-level Issues -->

        <ul v-if="props.validation?.issues?.length"
            class="list-disc pl-4">
            <li v-for="(v,n) in props.validation.issues"
                :key="n"
                class="text-error text-[12px]">
                {{ v }}
            </li>
        </ul>

    </UCard>
</template>

<style lang="scss">
    .stage-editor {

        td {
            vertical-align: top;
        }

    }
</style>
