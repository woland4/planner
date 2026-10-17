<script setup lang="ts">
    import { computed } from 'vue';
    import { isNullish } from 'remeda';
    import DOMPurify from 'dompurify';

    import { Bulletizer } from '@/utils/bulletizer.ts';

    import type { Nullable } from '@/types/utils.ts';
    import { type Unit, Units } from '@/utils/units.ts';
    import { Html } from '@/utils/html.ts';

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
        llbLevel?: Nullable<number>;

        index?: Nullable<number>,

        hideCaptain?: boolean,
        support?: Nullable<boolean>,

        insideModal?: Nullable<boolean>


    }>();

    /*--------
      Computed
      --------*/

    const unit = computed<Nullable<Unit>>(() => Units.getUnit(props.unitId, props.variant, props.llbLevel ?? 0));

    const sections = computed<Section[]>(() => {
        if (props.support)
            return supportSection.value ? [ supportSection.value ] : [{ title: 'Support', contents: 'Nope.' }];
        else {
            return [
                props.hideCaptain ? null : captainSection.value,
                ...specialSections.value,
                swapSection.value,
                superSpecialSection.value,
                props.hideCaptain ? sailorSection.value : null,
                potentialSection.value
            ].filter(r => !isNullish(r));
        }
    });

    const captainSection = computed<Nullable<Section>>(() => {
        if (!unit.value?.captain)
            return null;
        return {
            title: 'Captain Ability',
            contents: generateContents(unit.value.captain)
        };
    })

    const potentialSection = computed<Nullable<Section>>(() => {
        if (!unit.value?.potentials?.length)
            return null;
        return {
            title: 'Potential Abilities',
            contents: Html.bulletize(unit.value.potentials.map(generateContents))
        };
    });

    const specialSections = computed<Section[]>(() => {
        if (!unit.value?.id || !unit.value?.special?.length)
            return [ ];
        const result: Section[] = [ generateSpecialSection('Special', unit.value.special) ];
        if (unit.value.variant && Units.isDual(unit.value.id)) {
            const combined = Units.getSpecial(unit.value.id, 0, props.llbLevel ?? 0);
            const combinedSection = generateSpecialSection('Combined Special', combined);
            if (combinedSection.contents !== result[0].contents)
                result.push(combinedSection);
        }
        return result;
    });

    const swapSection = computed<Nullable<Section>>(() => {
        if (!unit.value?.swap || !unit.value.variant)
            return null;
        else if (!unit.value.swap.super) {
            return {
                title: 'Switch',
                contents: generateContents(unit.value.swap.description)
            };
        } else {
            const turns = unit.value.swap.superTurns ? ' (' + unit.value.swap.superTurns + ' turns)' : '';
            return {
                title: 'Switch',
                contents: (
                    generateHeader('Normal') +
                    generateContents(unit.value.swap.description) +
                    generateHeader('Super' + turns) +
                    generateContents(unit.value.swap.super)
                )
            };
        }
    });

    const superSpecialSection = computed<Nullable<Section>>(() => {
        if (!unit.value?.superSpecial)
            return null;
        return {
            title: 'Super Special',
            contents: (
                generateContents(unit.value.superSpecial.description) +
                generateHeader('Condition') +
                generateContents(unit.value.superSpecial.condition)
            )
        };
    });

    const sailorSection = computed<Nullable<Section>>(() => {
        if (!unit.value?.sailors?.length)
            return null;
        return {
            title: 'Sailor Abilities',
            contents: Html.bulletize(unit.value.sailors.map(generateContents))
        };
    });

    const supportSection = computed<Nullable<Section>>(() => {
        if (!unit.value?.support)
            return null;
        return {
            title: 'Support',
            contents: (
                generateContents(unit.value.support.description) +
                generateHeader('Condition') +
                generateContents(unit.value.support.condition)
            )
        };
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

    function generateHeader(value: string): string {
        return `<div class="font-bold border-b border-default border-dashed">${ value }</div>`;
    }

    function generateContents(value: Nullable<string>) {

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
            .replace(/\[([a-zA-Z -\d]+)]/gi, '<span class="font-bold px-[2px] text-[10.5px] bg-orange-300 text-black rounded-[3px]">$1</span>');

        return Bulletizer.bulletize(decorated);

    }

    function generateSpecialSection(title: string,
                                    special: { description: string, turns: Nullable<number> }[]): Section {

        // Single-stage
        if (special.length < 2) {
            return {
                title: title + (special[0].turns ? ' (' + special[0].turns + ' turns)' : ''),
                contents: generateContents(special[0].description)
            };
        }

        // Multi-stage
        const lines = [ ];
        for (let i=0; i<special.length; ++i) {
            lines.push(generateHeader(`Stage ${ i + 1 } (${ special[i].turns ?? '???' } turns)`));
            lines.push(generateContents(special[i].description));
        }
        return { title, contents: lines.join('') };

    }
</script>

<template>
    <div v-if="unit?.id"
         class="unit-popover flex flex-col max-w-100 p-3 text-sm">

        <!-- Header (always visible) -->

        <div class="flex items-baseline gap-1.5 pb-0.5">

            <span class="shrink-0 text-xs text-dimmed tabular-nums">
                #{{ unit.id }}
            </span>

            <span class="font-bold text-highlighted truncate">
                {{ unit.name }}
            </span>

        </div>

        <!-- Subheader (always visible) -->

        <div v-if="!props.support"
             class="flex flex-wrap items-center gap-1 pb-1 border-b border-default">

            <span v-for="clazz in unit.classes ?? [ ]"
                  :key="clazz"
                  :class="[ 'optc-icon', clazz.toLowerCase() ]"
                  class="w-3.5 h-3.5" />

            <UBadge v-for="tag in unit.tags ?? [ ]"
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

            <span v-if="props.insideModal"
                  class="flex gap-1.25 items-center text-xs text-dimmed">

                <span :class="{ 'font-bold text-red-500': props.llbLevel }">{{ props.llbLevel ? 'LLB5' : 'LLB0' }}</span>

                / right click to change

            </span>

            <span v-if="sections.length > 1"
                  class="ml-auto shrink-0 text-[11px] text-dimmed tabular-nums">
                {{ props.insideModal ? 'Shift + scroll' : 'Scroll' }} to cycle, {{ sanitizedIndex + 1 }} / {{ sections.length }}
            </span>

        </div>

    </div>
</template>
