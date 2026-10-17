<script setup lang="ts">
    import { computed, ref, watch } from 'vue';
    import { groupBy, intersection, isNullish, sortBy, uniqueBy } from 'remeda';

    import { useStore } from '@/store.ts';
    import { useResponsiveness } from '@/utils/responsiveness.ts';

    import { checkCaptainIssues } from '@/engine/captains.ts';
    import { checkSpecialIssues } from '@/engine/specials.ts';
    import { checkSuperSpecialIssues } from '@/engine/superSpecials.ts';
    import { checkCaptainShiftIssues } from '@/engine/captainShifts.ts';
    import { checkSupportIssues } from '@/engine/supports.ts';
    import { checkGimmicks } from '@/engine/gimmicks.ts';

    import { Html } from '@/utils/html.ts';
    import { Gimmicks } from '@/utils/gimmicks.ts';

    import type { Nullable } from '@/types/utils.ts';

    /*-----
      Types
      -----*/

    type IssueGroup = {
        id: string;
        title: string;
        issues: IssueSet[];
    };

    type IssueSet = {

        title: string;
        icon?: string;
        badge?: string;
        badgeColor?: 'info' | 'success' | 'warning' | 'error';

        details: IssueDetail[];

    };

    type IssueDetail = {

        badge?: string;
        badgeClass?: string;

        text: string;

    };

    /*-----------
      Injectables
      -----------*/

    const store = useStore();
    const responsiveness = useResponsiveness();

    /*-----
      State
      -----*/

    const collapsedGroups = ref<string[]>([ ]);

    /*--------
      Computed
      --------*/

    const teamCompositionIssues = computed<{ name: string, issues: IssueDetail[] }[]>(() => {

        const team = store.currentTab?.team;
        if (!team?.units?.length) return [ ];

        const data = uniqueBy([
            ...checkCaptainIssues(store.currentTab?.team)
                .map(issue => ({ ...issue, badge: 'CAPTAIN' })),
            ...checkSpecialIssues(store.currentTab.team)
                .map(issue => ({ ...issue, badge: 'SPECIAL' })),
            ...checkSuperSpecialIssues(store.currentTab.team)
                .map(issue => ({ ...issue, badge: 'SUPER' })),
            ...checkCaptainShiftIssues(store.currentTab.team)
                .map(issue => ({ ...issue, badge: 'SHIFT' })),
            ...checkSupportIssues(store.currentTab.team)
                .map(issue => ({ ...issue, badge: 'SUPPORT' }))
        ], issue => {
            const unit = team.units[issue.index];
            return `${ unit?.id }/${ unit?.variant ?? 0 }/${ issue.issue }`
        });

        const sorted = sortBy(data,
            d => [ 5, 0, 4, 1, 3, 2 ].indexOf(d.index),
            d => [ 'CAPTAIN', 'SPECIAL', 'SUPER', 'SHIFT', 'SUPPORT' ].indexOf(d.badge)
        );

        const groups = groupBy(sorted, i => i.index);

        const entries = sortBy(Object.entries(groups),
            e => [ '5', '0', '4', '1', '3', '2' ].indexOf(e[0]));
        
        return entries.map(([ key, issues ]) => {

            const index = parseInt(key, 10);
            const unit = team.units[index]!!;

            return {
                name: Html.decorateUnit(unit.id, unit.variant)!!,
                issues: issues.map(i => ({
                    badge: i.badge,
                    badgeClass: getTeamCompBadgeClass(i.badge),
                    text: i.issue
                }))
            };

        });

    });

    const stageIssues = computed<IssueGroup[]>(() => {

        const battle = store.currentTab?.battle;
        if (!battle?.stages?.length) return [ ];

        const result: IssueGroup[] = [ ];

        for (let n=0; n<battle.stages.length; ++n) {

            const items = checkGimmicks(battle, n, store.currentTab?.team);
            if (!items.length)
                continue;

            result.push({
                id: 'stage' + n,
                title: `Stage ${ n + 1 }`,
                issues: items.map(i => {

                    const result: Partial<IssueSet> = {
                        title: Gimmicks.getGimmickLabel(i.gimmick)!!,
                        icon: Gimmicks.getGimmickIcon(i.gimmick)!!,
                        details: (i.details ?? [ ]).map(text => ({ text }))
                    };

                    if (!isNullish(i.turnsHandled)) {
                        const fullyHandled = i.turnsHandled >= (i.gimmick.turns ?? 0);
                        result.badge = `${ Math.min(i.turnsHandled, i.gimmick.turns ?? 0) }/${ i.gimmick.turns }`;
                        result.badgeColor = fullyHandled ? 'success' : 'error';
                        if (result.details && !result.details.length)
                            result.details.push({ text: 'Not handled' });
                    }

                    return result as IssueSet;

                })
            });

        }

        return result;

    });

    const issues = computed<IssueGroup[]>(() => {
        return [

            {
                id: 'teamIssues',
                title: 'Team Composition Issues',
                issues: teamCompositionIssues.value.map(issue => ({
                    title: issue.name,
                    details: issue.issues
                }))
            },

            ...stageIssues.value

        ].filter(r => r?.issues?.length > 0);
    });

    /*--------
      Watchers
      --------*/

    watch(() => issues.value.map(i => i.id), v => {
        collapsedGroups.value = intersection(v, collapsedGroups.value);
    });

    /*-------
      Methods
      -------*/

    function onToggleCollapse(id: string) {
        const index = collapsedGroups.value.indexOf(id);
        if (index < 0) collapsedGroups.value.push(id);
        else collapsedGroups.value.splice(index, 1);
    }

    function formatIssue(issue: Nullable<string>): string {
        if (!issue?.length) return '';
        return Html.textToHTML(issue);
    }

    function getTeamCompBadgeClass(tag: string): string {
        switch (tag) {
            case 'CAPTAIN': return 'bg-error/10 text-error ring-error/25';
            case 'SPECIAL': return 'bg-info/10 text-info ring-info/25';
            case 'SUPER': return 'bg-success/10 text-success ring-success/25';
            case 'SHIFT': return 'bg-warning/10 text-warning ring-warning/25';
            case 'SUPPORT': return 'bg-purple-400/10 text-purple-400 ring-purple-400/25';
            default: return 'bg-info/info text-info ring-info/25';
        }
    }
</script>

<template>
    <USidebar v-if="store.currentTab"
              v-model:open="store.rightSidebarVisible"
              :ui="{
                  root: 'fixed right-0 top-0 bottom-0',
                  container: 'h-full pt-(--sidebar-padding-top)',
                  inner: 'bg-elevated/25',
                  header: 'p-4 min-h-auto',
                  body: 'p-2 text-[11px] gap-2'
              }"
              :style="{
                  '--sidebar-width': 'var(--sidebar-right-width-desktop)',
                  '--sidebar-padding-top': 'calc(var(--header-height-desktop) + var(--tabbar-height-desktop) + var(--spacing) * 4)'
              }"
              :title="responsiveness.isMobile.value ? 'Issues' : undefined"
              id="right-sidebar"
              collapsible="offcanvas"
              variant="floating"
              side="right">

        <template #default>

            <UCard v-for="(group,n) in issues"
                   :key="n"
                   :ui="{
                       header: 'p-1.5! bg-black/50 leading-none font-bold',
                       title: 'flex justify-between items-center',
                       body: 'p-2! flex flex-col gap-[5px]'
                   }">

                <template #title>

                    {{ group.title }}

                    <UButton :icon="collapsedGroups.includes(group.id) ? 'i-lucide-chevron-left' : 'i-lucide-chevron-down'"
                             color="neutral"
                             variant="ghost"
                             size="xs"
                             class="p-px cursor-pointer"
                             @click="onToggleCollapse(group.id)" />

                </template>

                <template v-if="!collapsedGroups.includes(group.id)"
                          #default>

                    <template v-for="(issueSet,m) in group.issues"
                              :key="m">

                        <span class="flex items-center gap-1.25">

                            <span v-if="issueSet.icon"
                                  :class="issueSet.icon"
                                  class="optc-icon w-3.5 h-3.5" />

                            <span v-html="formatIssue(issueSet.title)" />

                            <UBadge v-if="issueSet.badge"
                                    :color="issueSet.badgeColor ?? 'info'"
                                    size="xs"
                                    class="font-bold py-px">
                                {{ issueSet.badge }}
                            </UBadge>

                        </span>

                        <ul class="list-disc pl-6.75">
                            <li v-for="(issue,j) in issueSet.details"
                                :key="j">

                                <UBadge v-if="issue.badge"
                                        :class="issue.badgeClass"
                                        size="xs"
                                        variant="subtle"
                                        class="font-bold mr-1 pt-0 pb-px min-w-11 justify-center">
                                    {{ issue.badge }}
                                </UBadge>

                                <span v-html="formatIssue(issue.text)" />

                            </li>
                        </ul>

                    </template>

                </template>

            </UCard>

            <UEmpty v-if="!issues.length"
                    icon="i-lucide-check"
                    description="No issue detected." />

        </template>

    </USidebar>
</template>
