<script setup lang="ts">
    import { computed } from 'vue';

    import { Html } from '@/utils/html.ts';

    import { useStore } from '@/store.ts';
    import { useResponsiveness } from '@/utils/responsiveness.ts';

    import { checkCaptainIssues } from '@/engine/captains.ts';
    import { checkSpecialIssues } from '@/engine/specials.ts';
    import { checkSuperSpecialIssues } from '@/engine/superSpecials.ts';
    import { checkCaptainShiftIssues } from '@/engine/captainShifts.ts';
    import { checkGimmicks } from '@/engine/gimmicks.ts';

    import { GimmickRegistry } from '@/utils/registry.ts';

    import type { GimmickType } from '@/types/enums.ts';
    import type { Stage } from '@/types/battles.ts';
    import type { GimmickCheckStatus } from '@/types/engine.ts';

    /*-----
      Types
      -----*/

    type IssueGroup = {
        title: string;
        issues: IssueSet[];
    };

    type IssueSet = {

        tag?: string;
        tagColor?: 'info' | 'success' | 'warning' | 'error';

        gimmick?: GimmickType;
        gimmickStatus?: GimmickCheckStatus;

        contents: string[];

    };

    /*-----------
      Injectables
      -----------*/

    const store = useStore();
    const responsiveness = useResponsiveness();

    /*--------
      Computed
      --------*/

    const issues = computed<IssueGroup[]>(() => {
        return [

            {
                title: 'Team Composition',
                issues: [

                    {
                        tag: 'CAPTAINS',
                        contents: checkCaptainIssues(store.currentTab?.team)
                    },

                    {
                        tag: 'SPECIALS',
                        tagColor: 'error' as const,
                        contents: checkSpecialIssues(store.currentTab?.team)
                    },

                    {
                        tag: 'SUPER SPECIALS',
                        tagColor: 'warning' as const,
                        contents: checkSuperSpecialIssues(store.currentTab?.team)
                    },

                    {
                        tag: 'CAPTAIN SHIFTS',
                        tagColor: 'success' as const,
                        contents: checkCaptainShiftIssues(store.currentTab?.team)
                    }

                ].filter(g => g?.contents?.length ?? 0 > 0)
            },

            ...(store.currentTab?.battle?.stages ?? [ ]).flatMap((stage: Stage, n: number) => {

                const gimmickIssues = checkGimmicks(stage, store.currentTab?.team)
                    .filter(r => r.status !== 'ignored')
                    .map(r => ({
                        gimmick: r.gimmick.type,
                        gimmickStatus: r.status,
                        contents: r.details ?? [ ]
                    }));

                if (!gimmickIssues.length)
                    return [ ];
                else {
                    return [{
                        title: `Stage ${ n + 1 }`,
                        issues: gimmickIssues
                    }];
                }

            })

        ].filter(g => g?.issues?.length ?? 0 > 0);
    });

    /*-------
      Methods
      -------*/

    function formatIssue(issue: string): string {
        return Html.textToHTML(issue);
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

                    <template v-if="!issueSet.gimmick">

                        <USeparator v-if="issueSet.tag"
                                    class="my-1">
                            <UBadge v-if="issueSet.tag"
                                    :color="issueSet.tagColor ?? 'info'"
                                    size="xs"
                                    class="font-bold">
                                {{ issueSet.tag }}
                            </UBadge>
                        </USeparator>

                        <ul class="list-disc pl-4">
                            <li v-for="(issue,j) in issueSet.contents"
                                v-html="formatIssue(issue)"
                                :key="j" />
                        </ul>

                    </template>

                    <template v-else>

                        <span class="flex items-center gap-1.25">
                            <span :class="GimmickRegistry[issueSet.gimmick].icon ?? issueSet.gimmick"
                                  class="optc-icon w-3.5 h-3.5" />

                            <strong>
                                {{ GimmickRegistry[issueSet.gimmick].label }}
                            </strong>

                            <UBadge v-if="issueSet.gimmickStatus && issueSet.gimmickStatus !== 'advisory'"
                                    :color="issueSet.gimmickStatus === 'handled' ? 'success' : 'error'"
                                    size="xs"
                                    class="font-bold">
                                {{ issueSet.gimmickStatus === 'handled' ? 'HANDLED' : 'NOT HANDLED' }}
                            </UBadge>

                        </span>

                        <ul class="list-disc pl-6.75">
                            <li v-for="(issue,j) in issueSet.contents"
                                v-html="formatIssue(issue)"
                                :key="j" />
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
