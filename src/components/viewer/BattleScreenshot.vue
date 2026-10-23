<script setup lang="ts">
    import { computed } from 'vue';
    import { groupBy, isEmpty } from 'remeda';

    import GimmickViewer from '@/components/viewer/GimmickViewer.vue';

    import { I18N } from '@/utils/i18n.ts';

    import type { Battle } from '@/types/battles.ts';
    import type { Gimmick } from '@/types/gimmicks.ts';
    import type { Activation } from '@/types/enums.ts';
    import type { Nullable } from '@/types/utils.ts';

    // TODO Merge with StageViewer? Lots of repeated code

    /*---------
      Constants
      ---------*/

    const ACTIVATIONS: { key: Activation; badge: string }[] = [
        { key: 'preexisting', badge: 'bg-green-400 text-green-950' },
        { key: 'preemptive', badge: 'bg-blue-400 text-blue-950' },
        { key: 'death', badge: 'bg-amber-400 text-amber-950' },
        { key: 'interruption', badge: 'bg-red-400 text-red-950' }
    ];

    /*-----
      Props
      -----*/

    const props = defineProps<{
        battle: Battle;
        title?: Nullable<string>;
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
    <div class="battle-screenshot w-100 space-y-2.5 p-4 bg-[#0f172b] text-white text-[12px]">

        <div v-if="props.title?.trim()?.length"
             class="text-[14px] font-bold">
            {{ props.title }}
        </div>

        <div v-for="(stage,n) in props.battle.stages"
             :key="n"
             class="rounded-lg border border-[#314158] overflow-hidden">

            <div class="p-2 bg-black/50 leading-none font-bold">
                Stage {{ n + 1 }}
            </div>

            <div class="p-2 flex flex-col gap-1.25 bg-[#1d293d]">

                <!-- Enemies -->

                <div v-for="(enemy,m) in stage.enemies ?? [ ]"
                     :key="m">
                    {{ enemy.count ?? 1 }}x
                    <span v-for="type in enemy.types ?? [ ]"
                          :key="type"
                          :class="type?.toLowerCase()"
                          class="optc-icon w-4 h-4 relative top-1" />
                    enemy
                </div>

                <!-- Gimmicks -->

                <template v-for="activation in ACTIVATIONS"
                          :key="activation.key">
                    <template v-if="gimmickGroups[n]?.[activation.key]?.length">

                        <div class="flex flex-row items-center gap-2 py-0.5">

                            <div class="grow h-px bg-white/15" />

                            <span :class="activation.badge"
                                  class="px-1.5 py-0.5 rounded text-[10px] leading-none font-bold uppercase">
                                {{ I18N.activation(activation.key) }}
                            </span>

                            <div class="grow h-px bg-white/15" />

                        </div>

                        <GimmickViewer v-for="(gimmick,m) in gimmickGroups[n][activation.key]"
                                       :key="m"
                                       :gimmick="gimmick" />

                    </template>
                </template>

            </div>

        </div>

    </div>
</template>

<style lang="scss">
    .battle-screenshot {

        ul {
            list-style: none;
        }

        li::before {
            content: '\2022';
            display: inline-block;
            width: 0.75em;
            margin-left: -0.75em;
        }

    }
</style>
