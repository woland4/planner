<script setup lang="ts">
    import { computed, ref, useTemplateRef } from 'vue';
    import { difference, intersection, isArray, isNullish, isPlainObject, isString, sortBy, toTitleCase } from 'remeda';
    import { refDebounced, useStorage } from '@vueuse/core';
    import { parse as parseQuery } from 'search-query-parser';

    import UnitThumbnail from '@/components/UnitThumbnail.vue';

    import { useResponsiveness } from '@/utils/responsiveness.ts';
    import { Units } from '@/utils/units.ts';
    import { Enums } from '@/utils/enums.js';
    import { Ui } from '@/utils/ui.ts';

    import type { DropdownMenuItem } from '@nuxt/ui';
    import type { Booster } from '@/types/battles.ts';
    import type { Nullable } from '@/types/utils.ts';
    import type { Slot } from '@/types/enums.ts';

    /*---------
      Constants
      ---------*/

    const WACK_IDS = [ 5013, 5014, 5029, 5030, 5031, 5032, 5046, 5047, 5054, 5055, 5056 ];

    /*-----
      Types
      -----*/

    type ListItem = {
        id: number,
        variant?: number
    };

    /*-----
      Props
      -----*/

    const props = defineProps<{
        storageKey?: string
        boosters?: Nullable<Booster[]>,
        exclude?: Nullable<number[]>,
        multiple?: boolean,
        noVariants?: boolean,
        supportedUnitID?: Nullable<number>,
        supportedVariant?: Nullable<number>
    }>();

    /*----
      Refs
      ----*/

    const headerRef = useTemplateRef('headerRef');

    /*-----
      Emits
      -----*/

    const emit = defineEmits<{ close: [ result: Nullable<ListItem | ListItem[]> ] }>();

    /*-----------
      Injectables
      -----------*/

    const responsiveness = useResponsiveness();

    /*-----
      State
      -----*/

    const query = ref<string>('');
    const popoverIndices = ref<Record<string, number>>({ });
    const debouncedQuery = refDebounced(query, 500);

    const recentUnits = (props.storageKey ? useStorage('recentUnits.' + props.storageKey, [ ]) : ref<ListItem[]>([ ]));

    const selection = ref<ListItem[]>([ ]);

    const enablePopovers = useStorage('unitPicking.popovers', false);

    /*--------
      Computed
      --------*/

    const allUnitIDs = computed<ListItem[]>(() => {

        const validKeys = Object.keys(window.details).filter(id => !id.includes('-'));

        let sanitized = validKeys.map(id => parseInt(id, 10));
        if (props.exclude?.length) sanitized = difference(sanitized, props.exclude);

        if (props.supportedUnitID) {
            const supporterIDs = Units.getSupporters(props.supportedUnitID, props.supportedVariant);
            sanitized = sanitized.filter(id => supporterIDs.includes(id));
        }

        const sorted = sortBy(sanitized,
            n => WACK_IDS.includes(n) ? 1 : -1,
            n => -(boosterMap.value[n] ?? -1),
            n => -n
        );

        return sorted
            .map(id => {
                if (props.noVariants || !Units.hasVariants(id)) return { id };
                return [{ id, variant: 1 }, { id, variant: 2 }];
            })
            .flat();

    });

    const filteredUnitIDs = computed<ListItem[]>(() => {

        if (!debouncedQuery.value?.trim?.())
            return allUnitIDs.value;

        let parsed = doParseQuery(debouncedQuery.value);
        if (isString(parsed))  parsed = { text: parsed };

        let result = allUnitIDs.value;

        // Text filter
        for (let token of (parsed?.text ?? '').split(/\s+/)) {
            if (!token.length) continue;
            const sanitized = token.toLowerCase();
            if (/^\d+$/.test(sanitized)) {
                const parsed = parseInt(sanitized, 10);
                result = result.filter(({ id }) => id === parsed);
            } else
                result = result.filter(({ id, variant }) => Units.getName(id, variant)?.toLowerCase()?.includes(sanitized));
        }

        // Type filter
        if (isString(parsed.type)) {
            const type = parsed.type.toUpperCase();
            result = result.filter(({ id }) => Units.getTypes(id).includes(type));
        } else if (isArray(parsed.type)) {
            const types = parsed.type.map((t: string) => t.toUpperCase());
            result = result.filter(({ id, variant }) => intersection(types, Units.getTypes(id, variant)).length === types.length);
        }

        // Class filter
        if (isString(parsed.class)) {
            const clazz = sanitizeClassFilter(parsed.class);
            result = result.filter(({ id }) => Units.getClasses(id).includes(clazz));
        } else if (isArray(parsed.class)) {
            const classes = parsed.class.map((t: string) => sanitizeClassFilter(t));
            result = result.filter(({ id, variant }) => intersection(classes, Units.getClasses(id, variant)).length === classes.length);
        }

        // Rarity filter
        if (isString(parsed.rarity))
            result = result.filter(({ id }) => Units.getRarity(id) === parsed.rarity);

        // Tag filter
        if (isString(parsed.tag)) {
            const tag = parsed.tag.toLowerCase();
            result = result.filter(({ id, variant }) => Units.getTags(id, variant).map(t => t.toLowerCase()).includes(tag));
        } else if (isArray(parsed.tag)) {
            const tags = (parsed.tag as string[]).map(t => t.toLowerCase());
            result = result.filter(({ id, variant }) => intersection(tags, Units.getTags(id, variant).map(t => t.toLowerCase())).length == tags.length);
        }

        // Captain filter
        if (isString(parsed.captain) && parsed.captain.trim().length > 0) {
            const query = parsed.captain.trim().toLowerCase();
            result = result.filter(({ id, variant }) => Units.getCaptain(id, variant)?.base?.toLowerCase()?.includes(query));
        }

        // Special filter
        if (isString(parsed.special) && parsed.special.trim().length > 0) {
            const query = parsed.special.trim().toLowerCase();
            result = result.filter(({ id, variant }) => {
                const specials = Units.getSpecial(id, variant);
                if (isArray(specials?.base)) return specials.base.some(s => s.description?.toLowerCase()?.includes(query));
                else if (isPlainObject(specials?.base)) return specials.base?.description?.toLowerCase()?.includes(query);
                else return false;
            });
        }

        // Support filter
        if (isString(parsed.support) && parsed.support.trim().length > 0) {
            const query = parsed.support.trim().toLowerCase();
            result = result.filter(({ id }) => Units.getSupport(id)?.base?.toLowerCase()?.includes(query));
        }

        return result;

    });

    const menuItems = computed<DropdownMenuItem[][]>(() => {

        const result: DropdownMenuItem[] = [ ];
        const parsed = doParseQuery(query.value ?? '');

        // Types
        if (isNullish(parsed.type) || isString(parsed.type) || (isArray(parsed.type) && parsed.type.length < 2)) {
            result.push({
                label: 'Types',
                children: [
                    [ 'STR', 'QCK', 'DEX', 'PSY', 'INT' ].map(t =>
                        makeFilterItem(`<span class="optc-icon ${ Ui.getSlotIcon(t as Slot) } w-4 h-4 relative top-1"></span> ${ t }`, [ 'type', t ]))
                ]
            });
        }

        // Classes
        if (isNullish(parsed.class) || isString(parsed.class) || (isArray(parsed.class) && parsed.class.length < 2)) {
            result.push({
                label: 'Classes',
                children: [
                    [ 'Fighter', 'Slasher', 'Striker', 'Shooter', 'Free Spirit', 'Cerebral', 'Powerhouse', 'Driven' ].map(c =>
                        makeFilterItem(`<span class="optc-icon ${ Ui.getClassIcon(c) } w-4 h-4 relative top-1"></span> ${ c }`, [ 'class', c ]))
                ]
            });
        }

        // Rarity
        if (isNullish(parsed.rarity)) {
            result.push({
                label: 'Rarity',
                children: [
                    [
                        makeFilterItem('6+', [ 'rarity', '6+' ]),
                        makeFilterItem('6', [ 'rarity', '6' ]),
                        makeFilterItem('5+', [ 'rarity', '5+' ]),
                        makeFilterItem('5', [ 'rarity', '5' ])
                    ]
                ]
            });
        }

        // Tags
        result.push({
            label: 'Tags',
            children: [
                [
                    {
                        label: 'Crews',
                        children: [ Enums.tags.crews.map(t => makeFilterItem(t, [ 'tag', t ])) ]
                    },
                    {
                        label: 'Titles',
                        children: [ Enums.tags.titles.map(t => makeFilterItem(t, [ 'tag', t ])) ]
                    },
                    {
                        label: 'Devil Fruits',
                        children: [ Enums.tags.fruits.map(t => makeFilterItem(t, [ 'tag', t ])) ]
                    },
                    {
                        label: 'Arcs',
                        children: [ Enums.tags.arcs.map(t => makeFilterItem(t, [ 'tag', t ])) ]
                    }
                ]
            ]
        });

        // Others
        result.push({
            label: 'Others',
            children: [
                [
                    makeFilterItem('Captain', [ 'captain', '*' ]),
                    makeFilterItem('Special', [ 'special', '*' ]),
                    makeFilterItem('Support', [ 'support', '*' ])
                ]
            ]
        })

        return [ result ];

    });

    const boosterMap = computed<Record<string, number>>(() => {
        if (!props.boosters?.length) return { };
        const result: Record<string, number> = { };
        for (let booster of props.boosters) {
            const multiplier = booster.pureMultiplier ?? booster?.additiveMultiplier;
            if (!multiplier) continue;
            for (let id of booster.ids)
                result[id] = multiplier;
        }
        return result;
    });

    /*-------
      Methods
      -------*/

    function makeFilterItem(label: string, filter: string[]): DropdownMenuItem
    function makeFilterItem(label: string, ...rest: [string, string[]] | [string[]]): DropdownMenuItem {
        const [ icon, filter ] = (rest.length === 2 ? rest : [ null, rest[0] ]);
        if (icon) return { label, icon, onSelect: (e) => onAddFilter(e, filter[0], filter[1]) };
        else return { label, onSelect: (e) => onAddFilter(e, filter[0], filter[1]) };
    }

    function onAddFilter(e: Event, prefix: string, value: string) {

        const sanitized = (value.includes(' ') || value === '*' ? `"${ value.replace('*', '') }"` : value);
        query.value = `${ query.value } ${ prefix }:${ sanitized }`.trim()

        if (value !== '*') {
            e.preventDefault();
            e.stopPropagation();
        } else {
            requestAnimationFrame(() => {
                const input = headerRef.value?.querySelector('input');
                if (input) {
                    input.focus();
                    input.setSelectionRange(input.value.length - 1, input.value.length - 1);
                }
            });
        }

    }

    function doParseQuery(value: string): any {
        return parseQuery(value, {
            keywords: [ 'type', 'class', 'rarity', 'tag', 'captain', 'special', 'support' ]
        });
    }

    function sanitizeClassFilter(filter: string): string {
        return toTitleCase(filter
            .replace(/^fs$/i, 'free spirit')
            .replace(/^freespirit$/i, 'free spirit')
            .replace(/^ph$/i, 'powerhouse'));
    }

    function onSelection(unit: ListItem) {
        if (props.multiple) {
            const index = selection.value.findIndex(u => u.id === unit.id && (u.variant ?? 0) === (unit.variant ?? 0));
            if (index !== -1) selection.value.splice(index, 1);
            else selection.value.push(unit);
        } else {
            const index = recentUnits.value.findIndex(u => u.id === unit.id && (u.variant ?? 0) === (unit.variant ?? 0));
            if (index !== -1) recentUnits.value.splice(index, 1);
            recentUnits.value.unshift(unit);
            recentUnits.value = recentUnits.value.slice(0, 9);
            emit('close', unit);
        }
    }

    function onConfirm() {

        for (let unit of selection.value) {
            const index = recentUnits.value.findIndex(u => u.id === unit.id && (u.variant ?? 0) === (unit.variant ?? 0));
            if (index !== -1) recentUnits.value.splice(index, 1);
            recentUnits.value.unshift(unit);
        }
        recentUnits.value = recentUnits.value.slice(0, 9);

        emit('close', selection.value);

    }

    function onWheel(e: WheelEvent) {

        if (!e.shiftKey || !(e.target instanceof Element)) return;
        e.preventDefault();

        const unitID = e.target.closest('[unit-id]')?.getAttribute('unit-id');
        if (unitID)
            popoverIndices.value[unitID] = (popoverIndices.value[unitID] ?? 0) + (e.deltaY > 0 ? 1 : -1);

    }

    function onClose() {
        emit('close', null);
    }
</script>

<template>
    <UModal :title="props.multiple ? 'Select Units' : 'Select Unit'"
            :content="({ id: 'unit-picking-modal', onInteractOutside: onClose }) as any"
            :close="{ onClick: onClose }"
            :ui="{ footer: 'justify-end' }">

        <template #body>

            <div ref="headerRef"
                 class="flex gap-1">

                <UInput v-model="query"
                        :autofocus="responsiveness.isDesktop.value"
                        placeholder="Filter..."
                        class="w-full" />

                <UDropdownMenu :items="menuItems"
                               :content="{ onCloseAutoFocus: (e: Event) => e.preventDefault() }">

                    <template #item-label="{ item }">
                        <div v-html="item.label" />
                    </template>

                    <UButton icon="i-lucide-filter"
                             color="neutral"
                             variant="outline"
                             class="cursor-pointer" />

                </UDropdownMenu>

            </div>

            <div id="unit-picking-modal-thumbnails"
                 class="h-69.5 p-2 mt-2 overflow-y-auto"
                 @wheel="onWheel">
                <RecycleScroller #default="{ item }"
                                 class="scroller"
                                 :items="filteredUnitIDs"
                                 :item-size="55"
                                 :grid-items="responsiveness.isDesktop.value ? 9 : 6"
                                 :key-field="(n: number) => n"
                                 page-mode>
                    <UnitThumbnail :unit-id="item.id"
                                   :variant="item.variant"
                                   :boost="boosterMap[item.id]"
                                   :class="{ 'border-4! border-red-500! rounded-[10px]!': selection.some(s => s.id === item.id) }"
                                   :popover-data="enablePopovers ? { support: !!props.supportedUnitID, index: popoverIndices[item.id], shift: true } : undefined"
                                   :popover-side="enablePopovers ? 'bottom' : undefined"
                                   loading="lazy"
                                   class="w-12.5 h-12.5 mr-1.25 mb-1.25 cursor-pointer rounded-[7px]"
                                   @click="onSelection(item)" />
                </RecycleScroller>
            </div>

            <template v-if="recentUnits.length > 0">

                <USeparator class="mt-2.5 mb-2.5" />

                <div id="unit-picking-modal-recent"
                     class="flex flex-row flex-wrap content-start gap-1.25 pl-2"
                     @wheel="onWheel">
                    <UnitThumbnail v-for="unit in recentUnits"
                                   :key="`${ unit.id }-${ unit.variant ?? 0 }`"
                                   :unit-id="unit.id"
                                   :variant="unit.variant"
                                   :boost="boosterMap[unit.id]"
                                   class="w-12.5 h-12.5 cursor-pointer rounded-[5px]"
                                   @click="onSelection(unit)" />
                </div>

            </template>

        </template>

        <template #footer>

            <span v-if="responsiveness.isDesktop.value"
                  class="mr-auto self-center text-xs text-dimmed">
                <UCheckbox v-model="enablePopovers"
                           description="Enable popovers" />
            </span>

            <UButton label="Cancel"
                     color="neutral"
                     variant="outline"
                     class="cursor-pointer"
                     @click="onClose" />

            <UButton v-if="props.multiple && selection.length > 0"
                     label="Confirm"
                     color="success"
                     class="cursor-pointer"
                     @click="onConfirm" />

        </template>

    </UModal>
</template>

<style lang="scss">
    #unit-picking-modal {

        max-width: 34.5rem;

        .unit-thumbnail:hover {
            border: 2px solid var(--ui-primary);
        }

    }
</style>
