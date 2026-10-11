<script setup lang="ts">
    import { computed } from 'vue';
    import { groupBy, isEmpty } from 'remeda';

    import GimmickViewer from '@/components/viewer/GimmickViewer.vue';

    import type { Battle } from '@/types/battles.ts';
    import type { Gimmick } from '@/types/gimmicks.ts';
    import type { Activation } from '@/types/enums.ts';
    import { I18N } from '@/utils/i18n.ts';

    /*-------
      Options
      -------*/

    defineOptions({ inheritAttrs: false });

    /*-----
      Props
      -----*/

    const props = defineProps<{
        battle: Battle
    }>();

    /*--------
      Computed
      --------*/

    const gimmickGroups = computed<Record<number, Record<Activation, Gimmick[]>>>(() => {
        const result: Record<number, Record<string, Gimmick[]>> = { };
        for (let i=0; i<props.battle.stages?.length; ++i) {
            const groups = groupBy(props.battle.stages[i]?.gimmicks ?? [ ], g => g.activation);
            if (!isEmpty(groups))
                result[i] = groups;
        }
        return result;
    })
</script>

<template>
    <div class="stage-viewer flex flex-col gap-2.5 pt-px text-[12px]">

        <UCard v-for="(stage,n) in props.battle.stages"
               :key="n"
               :title="`Stage ${ n + 1}`"
               :ui="{ header: 'p-2! bg-black/50 leading-none font-bold', body: 'p-2! flex flex-col gap-[5px]' }"
               class="stage-viewer-stage">

            <!-- Enemies -->

            <template v-if="stage.enemies?.length">

                <div v-for="(enemy,m) in stage.enemies"
                     :key="m">
                    {{ enemy.count ?? 1 }}x
                    <span v-for="type in enemy.types ?? [ ]"
                          :key="type"
                          :class="type?.toLowerCase()"
                          class="optc-icon w-4 h-4 relative top-1" />
                    enemy
                </div>

            </template>

            <!-- Gimmicks -->

            <template v-if="!isEmpty(gimmickGroups[n])">

                <template v-if="gimmickGroups[n].preexisting">

                    <USeparator>
                        <UBadge color="success"
                                size="sm"
                                class="font-bold py-0.5 uppercase">
                            {{ I18N.activation('preexisting') }}
                        </UBadge>
                    </USeparator>

                    <GimmickViewer v-for="(gimmick,m) in gimmickGroups[n].preexisting"
                                   :key="m"
                                   :gimmick="gimmick" />

                </template>

                <template v-if="gimmickGroups[n].preemptive">

                    <USeparator>
                        <UBadge color="info"
                                size="sm"
                                class="font-bold py-0.5 uppercase">
                            {{ I18N.activation('preemptive') }}
                        </UBadge>
                    </USeparator>

                    <GimmickViewer v-for="(gimmick,m) in gimmickGroups[n].preemptive"
                                   :key="m"
                                   :gimmick="gimmick" />

                </template>

                <template v-if="gimmickGroups[n].death">

                    <USeparator>
                        <UBadge color="warning"
                                size="sm"
                                class="font-bold py-0.5 uppercase">
                            {{ I18N.activation('death') }}
                        </UBadge>
                    </USeparator>

                    <GimmickViewer v-for="(gimmick,m) in gimmickGroups[n].death"
                                   :key="m"
                                   :gimmick="gimmick" />

                </template>

                <template v-if="gimmickGroups[n].interruption">

                    <USeparator>
                        <UBadge color="error"
                                size="sm"
                                class="font-bold py-0.5 uppercase">
                            {{ I18N.activation('interruption') }}
                        </UBadge>
                    </USeparator>

                    <GimmickViewer v-for="(gimmick,m) in gimmickGroups[n].interruption"
                                   :key="m"
                                   :gimmick="gimmick" />

                </template>

            </template>

        </UCard>

    </div>
</template>
