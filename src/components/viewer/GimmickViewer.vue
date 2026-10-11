<script setup lang="ts">
    import { computed } from 'vue';
    import { isFunction, isNullish } from 'remeda';

    import { type GimmickDetails, GimmickRegistry } from '@/utils/registry.ts';
    import { Numbers } from '@/utils/numbers.ts';

    import type { Gimmick } from '@/types/gimmicks.ts';
    import type { Nullable } from '@/types/utils.ts';
    import { I18N } from '@/utils/i18n.ts';

    /*-------
      Options
      -------*/

    defineOptions({ inheritAttrs: false });

    /*-----
      Props
      -----*/

    const props = defineProps<{
        gimmick: Gimmick
    }>();

    /*--------
      Computed
      --------*/

    const data = computed<Nullable<GimmickDetails<any>>>(() => GimmickRegistry[props.gimmick.type]);

    const icon = computed<Nullable<string>>(() => {
        if (!data.value) return props.gimmick.type ?? null;
        else if (isFunction(data.value.icon)) return data.value.icon(props.gimmick);
        else return data.value.icon ?? props.gimmick.type;
    });

    const label = computed<Nullable<string>>(() => {
        if (!data.value) return null;
        else if (isFunction(data.value.label)) return data.value.label(props.gimmick);
        else return data.value.label;
    });

    const details = computed<Nullable<string>[]>(() => {
        if (!data.value) return [ ];
        return data.value.details?.(props.gimmick).filter(t => !isNullish(t)) ?? [ ];
    });

    const lines = computed<Nullable<string>[]>(() => {
        if (!data.value) return [ ];
        return data.value.lines?.(props.gimmick).filter(t => !isNullish(t)) ?? [ ];
    });

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
