<script setup lang="ts">
    import { computed } from 'vue';
    import { groupBy, isFunction, isString, sortBy, uniqueBy } from 'remeda';

    import { useStore } from '@/store.ts';
    import { useResponsiveness } from '@/utils/responsiveness.ts';

    import { checkCaptainIssues } from '@/engine/captains.ts';
    import { checkSpecialIssues } from '@/engine/specials.ts';
    import { checkSuperSpecialIssues } from '@/engine/superSpecials.ts';
    import { checkCaptainShiftIssues } from '@/engine/captainShifts.ts';
    import { checkGimmicks } from '@/engine/gimmicks.ts';

    import { Html } from '@/utils/html.ts';
    import { Gimmicks } from '@/utils/gimmicks.ts';

    import type { Nullable } from '@/types/utils.ts';

    /*-----
      Types
      -----*/

    type IssueGroup = {
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
        badgeColor?: 'info' | 'success' | 'warning' | 'error';

        text: string;

    };

    /*-----------
      Injectables
      -----------*/

    const store = useStore();
    const responsiveness = useResponsiveness();

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
                .map(issue => ({ ...issue, badge: 'SHIFT' }))
        ], issue => {
            const unit = team.units[issue.index];
            return `${ unit?.id }/${ unit?.variant ?? 0 }/${ issue.issue }`
        });

        const sorted = sortBy(data,
            d => [ 5, 0, 4, 1, 3, 2 ].indexOf(d.index),
            d => [ 'CAPTAIN', 'SPECIAL', 'SUPER', 'SHIFT' ].indexOf(d.badge)
        );

        const groups = groupBy(sorted, i => i.index);

        return Object.entries(groups).map(([ key, issues ]) => {

            const index = parseInt(key, 10);
            const unit = team.units[index]!!;

            return {
                name: Html.decorateUnit(unit.id, unit.variant)!!,
                issues: issues.map(i => ({
                    badge: i.badge,
                    badgeColor: getTeamCompBadgeColor(i.badge),
                    text: i.issue
                }))
            };

        });

    });

    const stageIssues = computed<IssueGroup[]>(() => {

        const stages = store.currentTab?.battle?.stages ?? [ ];
        if (!stages?.length) return [ ];

        const result: IssueGroup[] = [ ];

        for (let n=0; n<stages.length; ++n) {

            const items = checkGimmicks(stages[n], store.currentTab?.team)
                .filter(r => r.status !== 'ignored');
            if (!items.length)
                continue;

            result.push({
                title: `Stage ${ n + 1 }`,
                issues: items.map(i => {
                    const data = Gimmicks.getGimmickDetails(i.gimmick.type);
                    return {
                        title: isString(data?.label) ? data.label : (isFunction(data?.label) ? data.label(i.gimmick) : i.gimmick.type),
                        icon: isString(data?.icon) ? data.icon : (isFunction(data?.icon) ? data.icon(i.gimmick) : undefined),
                        badge: i.status === 'advisory' ? undefined : i.status.toUpperCase(),
                        badgeColor: i.status === 'handled' ? 'success' : 'error',
                        details: (i.details ?? [ ]).map(text => ({ text }))
                    };
                })
            });

        }

        return result;

    });

    const issues = computed<IssueGroup[]>(() => {
        return [

            {
                title: 'Team Composition Issues',
                issues: teamCompositionIssues.value.map(issue => ({
                    title: issue.name,
                    details: issue.issues
                }))
            },

            ...stageIssues.value

        ].filter(r => r?.issues?.length > 0);
    });

    /*-------
      Methods
      -------*/

    function formatIssue(issue: Nullable<string>): string {
        if (!issue?.length) return '';
        return Html.textToHTML(issue);
    }

    function getTeamCompBadgeColor(tag: string): IssueDetail['badgeColor'] {
        switch (tag) {
            case 'CAPTAIN': return 'error';
            case 'SPECIAL': return 'info';
            case 'SUPER': return 'success';
            case 'SHIFT': return 'warning';
            default: return 'info';
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
                  body: 'p-2 text-[11px]'
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
                   :title="group.title"
                   :ui="{ header: 'p-2! bg-black/50 leading-none font-bold', body: 'p-2! flex flex-col gap-[5px]' }">
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
                                class="font-bold">
                            {{ issueSet.badge }}
                        </UBadge>

                    </span>

                    <ul class="list-disc pl-6.75">
                        <li v-for="(issue,j) in issueSet.details"
                            :key="j">

                            <UBadge v-if="issue.badge"
                                    :color="issue.badgeColor ?? 'info'"
                                    size="xs"
                                    variant="subtle"
                                    class="font-bold mr-1 pt-0 pb-px min-w-11 justify-center">
                                {{ issue.badge }}
                            </UBadge>

                            <span v-html="formatIssue(issue.text)" />

                        </li>
                    </ul>

                </template>
            </UCard>

            <UEmpty v-if="!issues.length"
                    icon="i-lucide-check"
                    description="No issue detected." />

        </template>

    </USidebar>
</template>
