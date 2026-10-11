<script setup lang="ts">
    import { computed } from 'vue';
    import { isArray, isNullish } from 'remeda';
    import DOMPurify from 'dompurify';

    import { type BaseSpecial, type Swap, Units } from '@/utils/units.ts';
    import { Bulletizer } from '@/utils/bulletizer.ts';

    import type { Nullable } from '@/types/utils.ts';
    import { Numbers } from '@/utils/numbers.ts';

    /*-----
      Types
      -----*/

    type Section = {
        title: string;
        contents: Nullable<string>;
    };

    /*-------
      Options
      -------*/

    defineOptions({ inheritAttrs: false });

    /*-----
      Props
      -----*/

    const props = defineProps<{
        unitId: number,
        variant?: Nullable<number>,
        hideCaptain?: boolean,
        index?: Nullable<number>,
        assumeLlb?: Nullable<boolean>,
        support?: Nullable<boolean>
    }>();

    /*--------
      Computed
      --------*/

    const sections = computed<Section[]>(() => {

        if (props.support)
            return supports.value;

        const result: Nullable<Section>[] = [ ];
        if (!props.hideCaptain)
            result.push(...captains.value);
        result.push(...specials.value);
        result.push(...swaps.value);
        result.push(...superSpecials.value);
        return result.filter(r => !isNullish(r));

    });

    const captains = computed<Section[]>(() => {

        const data = Units.getCaptain(props.unitId, props.variant, !!props.assumeLlb);
        if (!data?.base) return [ ];

        const result: Section[] = [{ title: 'Captain Ability', contents: prepareContents(data.base) }];
        if (data.combined)
            result.push({ title: 'Captain Ability (combined)', contents: prepareContents(data.combined) });
        return result;

    });

    const specials = computed<Section[]>(() => {

        const data = Units.getSpecial(props.unitId, props.variant, !!props.assumeLlb);
        if (!data?.base) return [ ];

        const result: Section[] = [ convertSpecial(data.base, false) ];
        if (data.combined) result.push(convertSpecial(data.combined, true));
        return result;

    });

    const swaps = computed<Section[]>(() => {

        const data = Units.getSwaps(props.unitId);
        if (!data?.base) return [ ];

        const contents = prepareSwap(data);
        return (contents ? [{ title: 'Switch', contents }] : [ ]);

    });

    const superSpecials = computed<Section[]>(() => {

        const data = Units.getSuperSpecial(props.unitId, props.variant);
        if (!data?.base) return [ ];

        return [
            {
                title: 'Super Special',
                contents: [
                    prepareContents(data.base),
                    header('Criteria'),
                    prepareContents(data.criteria)
                ].join('')
            }
        ];

    });

    const supports = computed<Section[]>(() => {

        const data = Units.getSupport(props.unitId);
        if (!data?.base) return [{ title: 'Support', contents: 'Nope.' }];

        return [
            {
                title: 'Support',
                contents: [
                    prepareContents(data.base),
                    header('Criteria'),
                    prepareContents(data.criteria)
                ].join('')
            }
        ];

    });

    const sanitizedIndex = computed(() => {
        if (!props.index)
            return 0;
        else if (props.index > 0)
            return props.index % sections.value.length;
        else
            return ((props.index % sections.value.length) + sections.value.length) % sections.value.length;
    });

    const currentSection = computed(() => sections.value[sanitizedIndex.value]);

    /*-------
      Methods
      -------*/

    function prepareContents(value: Nullable<string>) {

        if (!value) return null;
        const sanitized = DOMPurify.sanitize(value);

        const decorated = sanitized
            .replace(/\[STR]/gi, '<span class="text-red-500 font-bold">STR</span>')
            .replace(/\[DEX]/gi, '<span class="text-green-500 font-bold">DEX</span>')
            .replace(/\[QCK]/gi, '<span class="text-blue-500 font-bold">QCK</span>')
            .replace(/\[PSY]/gi, '<span class="text-yellow-500 font-bold">PSY</span>')
            .replace(/\[INT]/gi, '<span class="text-purple-500 font-bold">INT</span>')
            .replace(/\[TND]/gi, '<span class="text-orange-800 font-bold">TND</span>')
            .replace(/(Fighter|Slasher|Striker|Shooter|Free Spirit|Driven|Powerhouse|Cerebral)/gi, '<span class="font-bold">$1</span>')
            .replace(/\[(BLOCK|BOMB|EMPTY|G|PARALYSIS|POISON|RAINBOW|RCV|SEMLA|SUPERBLOCK|SUPERBOMB|WANO)]/gi, '<span class="font-bold">$1</span>')
            .replace(/\[([a-zA-Z -]+)]/gi, '<span class="font-bold px-[2px] text-[10.5px] bg-orange-300 text-black rounded-[3px]">$1</span>');

        return Bulletizer.bulletize(decorated);

    }

    function convertSpecial(value: BaseSpecial | BaseSpecial[],
                            isCombined: boolean = false): Section {

        if (!isArray(value)) {

            const data = value as BaseSpecial;

            const qualifiers = [ ];
            if (isCombined) qualifiers.push('combined');
            if (Numbers.isPositiveInteger(data.cooldown)) qualifiers.push(data.cooldown + ' turns');

            return {
                title: 'Special' + (qualifiers.length ? ' (' + qualifiers.join(', ') + ')' : ''),
                contents: prepareContents(value.description)
            };

        }

        else {
            const lines = [ ];
            for (let i=0; i<value.length; ++i) {
                lines.push(header(`Stage ${ i + 1 } (${ value[i].cooldown } turns)`));
                lines.push(prepareContents(value[i].description));
            }
            return { title: 'Special', contents: lines.join('') };
        }

    }

    function prepareSwap(value: Swap): Nullable<string> {
        if (!value.super)
            return prepareContents(value.base);
        else {

            const lines = [ ];
            lines.push(header('Normal'));
            lines.push(prepareContents(value.base));

            const turns = value.superTurns ? ' (' + value.superTurns + ' turns)' : '';
            lines.push(header('Super' + turns));
            lines.push(prepareContents(value.super));

            return lines.join('');

        }
    }

    function header(value: string): string {
        return `<div class="font-bold border-b border-default border-dashed">${ value }</div>`;
    }
</script>

<template>
    <div class="unit-popover flex flex-col max-w-100 p-3 text-sm">

        <!-- Header (always visible) -->

        <div class="flex items-baseline gap-1.5 pb-0.5">

            <span class="shrink-0 text-xs text-dimmed tabular-nums">
                #{{ props.unitId }}
            </span>

            <span class="font-bold text-highlighted truncate">
                {{ Units.getName(props.unitId, props.variant) }}
            </span>

        </div>

        <!-- Subheader (always visible) -->

        <div v-if="!props.support"
             class="flex flex-wrap items-center gap-1 pb-1 border-b border-default">

            <span v-for="clazz in Units.getClasses(props.unitId, props.variant)"
                  :key="clazz"
                  :class="[ 'optc-icon', clazz.toLowerCase() ]"
                  class="w-3.5 h-3.5" />

            <UBadge v-for="tag in Units.getTags(props.unitId, props.variant)"
                    :key="tag"
                    size="sm"
                    color="info"
                    class="font-bold py-px! px-0.5">
                {{ tag }}
            </UBadge>

        </div>

        <!-- Section title -->

        <div v-if="currentSection?.title"
             class="text-[11px] font-semibold uppercase tracking-wide text-primary mt-1.25">
            {{ currentSection.title }}
        </div>

        <!-- Section contents -->

        <p v-if="currentSection?.contents"
           v-html="currentSection.contents"
           class="text-[11px] text-muted leading-snug whitespace-pre-line" />

        <!-- Footer (always visible) -->

        <div v-if="!props.support"
             class="flex items-center gap-1.5 pt-1 mt-1.25 border-t border-default">

            <span class="flex gap-1.25 items-center text-xs text-dimmed">

                <span :class="{ 'font-bold text-red-500': props.assumeLlb }">{{ props.assumeLlb ? 'LLB' : 'Base' }}</span>

                / right click to change

            </span>

            <span v-if="sections.length > 1"
                  class="ml-auto shrink-0 text-[11px] text-dimmed tabular-nums">
                Scroll to cycle, {{ sanitizedIndex + 1 }} / {{ sections.length }}
            </span>

        </div>

    </div>
</template>
