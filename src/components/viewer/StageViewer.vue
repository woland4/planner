<script setup lang="ts">
    import { computed } from 'vue';
    import { groupBy, isEmpty } from 'remeda';

    import GimmickViewer from '@/components/viewer/GimmickViewer.vue';

    import { I18N } from '@/utils/i18n.ts';

    import type { BadgeProps } from '@nuxt/ui';
    import type { Battle } from '@/types/battles.ts';
    import type { Gimmick } from '@/types/gimmicks.ts';
    import type { Activation } from '@/types/enums.ts';

    /*---------
      Constants
      ---------*/

    const ACTIVATIONS: { key: Activation; badge: BadgeProps['color'] }[] = [
        { key: 'preexisting', badge: 'success' },
        { key: 'preemptive', badge: 'info' },
        { key: 'death', badge: 'warning' },
        { key: 'interruption', badge: 'error' }
    ];

    /*-------
      Options
      -------*/

    defineOptions({ inheritAttrs: false });

    /*-----
      Props
      -----*/

    const props = defineProps<{
        battle: Battle;
    }>();

    /*--------
      Computed
      --------*/

    const gimmickGroups = computed<Record<number, Record<Activation, Gimmick[]>>>(() => {
        const result: Record<number, Record<string, Gimmick[]>> = { };
        for (let i = 0; i < props.battle.stages?.length; ++i) {
            const groups = groupBy(props.battle.stages[i]?.gimmicks ?? [ ], g => g.activation);
            if (!isEmpty(groups))
                result[i] = groups;
        }
        return result;
    });
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

            <template v-for="activation in ACTIVATIONS"
                      :key="activation.key">
                <template v-if="gimmickGroups[n]?.[activation.key]?.length">

                    <USeparator>
                        <UBadge :color="activation.badge"
                                size="xs"
                                class="font-bold text-[8px] uppercase">
                            {{ I18N.activation(activation.key) }}
                        </UBadge>
                    </USeparator>

                    <GimmickViewer v-for="(gimmick,m) in gimmickGroups[n][activation.key]"
                                   :key="m"
                                   :gimmick="gimmick" />

                </template>
            </template>

        </UCard>

    </div>
</template>
