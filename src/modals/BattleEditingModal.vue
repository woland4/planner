<script setup lang="ts">
    import { computed, ref } from 'vue';
    import { clone, isNullish } from 'remeda';
    import { type SortableEvent, VueDraggable } from 'vue-draggable-plus';

    import StageEditor from '@/components/editor/StageEditor.vue';
    import BoosterEditor from '@/components/editor/BoosterEditor.vue';

    import { Battles } from '@/utils/battles.ts';
    import { Boosters } from '@/utils/boosters.ts';
    import { Stages } from '@/utils/stages.ts';
    import { Enemies } from '@/utils/enemies.ts';
    import { Gimmicks } from '@/utils/gimmicks.ts';
    import { Validations } from '@/utils/validation.ts';

    import type { Battle } from '@/types/battles.ts';
    import type { BattleValidation } from '@/types/validation.ts';
    import type { Nullable } from '@/types/utils.ts';

    /*-----
      Props
      -----*/

    const props = defineProps<{
        data?: Nullable<Battle>;
    }>();

    /*-----
      Emits
      -----*/

    const emit = defineEmits<{ close: [ result: Nullable<Battle> ] }>();

    /*-----
      State
      -----*/

    const model = ref<Partial<Battle>>(props.data ? clone(props.data) : { });

    const activeTab = ref('stages');
    const activeStage = ref(model.value?.stages?.length ? 0 : -1);
    const activeBooster = ref(model.value?.boosters?.length ? 0 : -1);

    const validation = ref<Nullable<BattleValidation>>(null);

    /*--------
      Computed
      --------*/

    const isValidated = computed<boolean>(() => {
        if (!validation.value)
            return false;
        if (validation.value.issues?.length)
            return false;
        if (validation.value.boosters.some(b => b?.length))
            return false;
        if (validation.value.stages.some(Validations.hasStageIssues))
            return false;
        return true;
    });

    /*-------
      Methods
      -------*/

    function onAddStage() {
        if (!model.value.stages)
            model.value.stages = [ ];
        model.value.stages.push({ enemies: [ ], gimmicks: [ ] });
        activeStage.value = model.value.stages.length - 1;
    }

    function onRemoveStage(index: number) {
        model.value.stages?.splice?.(index, 1);
        activeStage.value = (model.value.stages?.length || -1);
    }

    function onToggleStage(index: number) {
        activeStage.value = (activeStage.value === index ? -1 : index);
    }

    function onAddBooster() {
        if (!model.value.boosters)
            model.value.boosters = [ ];
        model.value.boosters.push({ ids: [ ] });
        activeBooster.value = model.value.boosters.length - 1;
    }

    function onRemoveBooster(index: number) {
        model.value.boosters?.splice?.(index, 1);
        activeBooster.value = (model.value.boosters?.length || -1);
    }

    function onToggleBooster(index: number) {
        activeBooster.value = (activeBooster.value === index ? -1 : index);
    }

    function onValidate() {

        const data: Partial<BattleValidation> = { };

        data.issues = Battles.validateBattle(model.value as Battle);
        data.boosters = (model.value?.boosters ?? [ ]).map(Boosters.validateBooster);

        data.stages = (model.value?.stages ?? [ ]).map(stage => ({
            issues: Stages.validateStage(stage),
            enemies: (stage?.enemies ?? [ ]).map(Enemies.validateEnemy),
            gimmicks: (stage?.gimmicks ?? [ ]).map(Gimmicks.validateGimmick)
        }));

        validation.value = data as BattleValidation;

    }

    function onConfirm() {
        onValidate();
        if (isValidated.value)
            emit('close', model.value as Battle);
    }

    function onClose() {
        emit('close', null);
    }

    function onStageDragEnd(e: SortableEvent) {

        const from = e.oldIndex;
        const to = e.newIndex;
        if (isNullish(from) || isNullish(to))
            return;

        if (from === activeStage.value)
            activeStage.value = to;
        else if (from < to && activeStage.value > from && activeStage.value <= to)
            --activeStage.value;
        else if (from > to && activeStage.value < from && activeStage.value >= to)
            ++activeStage.value;

    }

    function onBoosterDragEnd(e: SortableEvent) {

        const from = e.oldIndex;
        const to = e.newIndex;
        if (isNullish(from) || isNullish(to))
            return;

        if (from === activeBooster.value)
            activeBooster.value = to;
        else if (from < to && activeBooster.value > from && activeBooster.value <= to)
            --activeBooster.value;
        else if (from > to && activeBooster.value < from && activeBooster.value >= to)
            ++activeBooster.value;

    }
</script>

<template>
    <UModal :content="({ id: 'battle-editing-modal', onInteractOutside: onClose }) as any"
            :close="{ onClick: onClose }"
            :dismissible="false"
            title="Edit Battle"
            fullscreen>

        <template #body>

            <ul v-if="validation?.issues?.length"
                class="mb-5 list-disc pl-4">
                <li v-for="(v,n) in validation.issues"
                    :key="n"
                    class="text-error text-[12px]">
                    {{ v }}
                </li>
            </ul>

            <UTabs v-model="activeTab"
                   :items="[ { value: 'stages', slot: 'stages', label: 'Stages' }, { value: 'boosters', slot: 'boosters', label: 'Boosters' } ]"
                   :ui="{ trigger: 'cursor-pointer', content: 'flex flex-col' }"
                   color="neutral"
                   variant="link">

                <!-- Tab Headers -->

                <template #default="{ item }">

                    {{ item.label }}

                    <UIcon v-if="item.value === 'stages' && validation?.stages?.some(Validations.hasStageIssues)"
                           class="text-error inline-block ml-1 animate__animated animate__pulse animate__infinite"
                           name="i-lucide-circle-alert">
                    </UIcon>

                    <UIcon v-if="item.value === 'boosters' && validation?.boosters?.some(b => b?.length)"
                           class="text-error inline-block ml-1 animate__animated animate__pulse animate__infinite"
                           name="i-lucide-circle-alert">
                    </UIcon>

                </template>

                <!-- Stages -->

                <template #stages>

                    <UEmpty v-if="!model?.stages?.length"
                            :ui="{ root: 'bg-elevated/25' }"
                            title="No stage defined"
                            description="Click &quot;Add stage&quot; to add a new stage" />

                    <VueDraggable v-if="model.stages"
                                  v-model="model.stages"
                                  handle=".stage-drag"
                                  @update="onStageDragEnd">
                        <StageEditor v-for="(_, n) in model.stages"
                                     v-model="model.stages!![n]"
                                     :key="n"
                                     :index="n"
                                     :collapsed="n !== activeStage"
                                     :validation="validation?.stages?.[n]"
                                     @toggle="onToggleStage"
                                     @remove="onRemoveStage" />
                    </VueDraggable>

                </template>

                <!-- Boosters -->

                <template #boosters>

                    <UEmpty v-if="!model?.boosters?.length"
                            :ui="{ root: 'bg-elevated/25' }"
                            title="No booster defined"
                            description="Click &quot;Add booster&quot; to add a new stage" />

                    <VueDraggable v-if="model.boosters"
                                  v-model="model.boosters"
                                  handle=".booster-drag"
                                  @update="onBoosterDragEnd">
                        <BoosterEditor v-for="(_,n) in model.boosters"
                                       v-model="model.boosters!![n]"
                                       :key="n"
                                       :index="n"
                                       :collapsed="n !== activeBooster"
                                       :validation="validation?.boosters?.[n]"
                                       @toggle="onToggleBooster"
                                       @remove="onRemoveBooster" />
                    </VueDraggable>

                </template>

            </UTabs>

        </template>

        <template #footer>

            <UButton v-if="activeTab === 'stages'"
                     color="info"
                     variant="subtle"
                     icon="i-lucide-plus"
                     class="cursor-pointer"
                     @click="onAddStage">
                Add stage
            </UButton>

            <UButton v-if="activeTab === 'boosters'"
                     color="info"
                     variant="subtle"
                     icon="i-lucide-plus"
                     class="cursor-pointer"
                     @click="onAddBooster">
                Add booster group
            </UButton>

            <div class="grow" />

            <UButton label="Cancel"
                     color="neutral"
                     variant="outline"
                     class="cursor-pointer"
                     @click="onClose" />

            <UButton label="Save"
                     color="success"
                     class="cursor-pointer"
                     @click="onConfirm" />

        </template>

    </UModal>
</template>

<style lang="scss">
    #battle-editing-modal {

        .unit-thumbnail.main {
            max-width: 60px;
        }

        .unit-thumbnail.support {

            position: absolute;
            right: 0;
            bottom: 0;
            max-width: 25px;

            border: 1px solid black;
            border-radius: 5px;

        }

        .unit-thumbnail-boost {
            bottom: unset;
            top: 2.5px;
        }

    }
</style>
