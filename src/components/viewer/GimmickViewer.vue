<script setup lang="ts">
    import { computed } from 'vue';

    import { Gimmicks } from '@/utils/gimmicks.ts';
    import { Numbers } from '@/utils/numbers.ts';
    import { I18N } from '@/utils/i18n.ts';

    import type { Gimmick } from '@/types/gimmicks.ts';
    import type { Nullable } from '@/types/utils.ts';

    /*-------
      Options
      -------*/

    defineOptions({ inheritAttrs: false });

    /*-----
      Props
      -----*/

    const props = defineProps<{
        gimmick: Gimmick;
    }>();

    /*--------
      Computed
      --------*/

    const icon = computed<Nullable<string>>(() => Gimmicks.getGimmickIcon(props.gimmick));

    const label = computed<Nullable<string>>(() => Gimmicks.getGimmickLabel(props.gimmick));

    const details = computed<Nullable<string>[]>(() => Gimmicks.getGimmickDetails(props.gimmick) ?? [ ]);

    const lines = computed<Nullable<string>[]>(() => Gimmicks.getGimmickLines(props.gimmick) ?? [ ]);

    const triggers = computed<Nullable<string>>(() => {
        if (!props.gimmick.triggers?.length) return null;
        return props.gimmick.triggers.map(t => I18N.interruption(t)).join('/');
    });
</script>

<template>
    <div class="gimmick-viewer flex flex-row items-start gap-1.25">

        <span v-if="icon"
              :class="icon"
              class="optc-icon w-3.5 h-3.5 relative top-0.5" />

        <div>

            <template v-if="props.gimmick.activation === 'interruption'">

                <template v-if="props.gimmick.triggers?.length && props.gimmick.times && props.gimmick.times < 99">
                    {{ triggers }},
                    {{ props.gimmick.times }} time{{ props.gimmick.times === 1 ? '' : 's' }} &#x2192;
                </template>

                <template v-else-if="props.gimmick.triggers?.length">
                    {{ triggers }} &#x2192;
                </template>

            </template>

            <strong>

                <template v-if="Numbers.isPositiveInteger(props.gimmick.turns)">
                    {{ props.gimmick.turns }}T
                </template>

                {{ label ?? `Unknown "${ props.gimmick.type }"` }}

            </strong>

            <template v-if="details?.length > 0">
                ({{ details.join(', ') }})
            </template>

            <ul v-if="lines?.length > 0"
                class="list-disc pl-2">
                <li v-for="(line,n) in lines"
                    class="text-[10.5px] text-white/60"
                    :key="n">
                    <span v-html="line"
                          class="inline-flex flex-row items-center gap-0.5" />
                </li>
            </ul>

        </div>

    </div>
</template>
