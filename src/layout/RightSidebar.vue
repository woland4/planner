<script setup lang="ts">
    import { computed } from 'vue';

    import { Html } from '@/utils/html.ts';

    import { useStore } from '@/store.ts';
    import { useResponsiveness } from '@/utils/responsiveness.ts';

    import { checkCaptainIssues } from '@/engine/captains.ts';
    import { checkSpecialIssues } from '@/engine/specials.ts';
    import { checkSuperSpecialIssues } from '@/engine/superSpecials.ts';
    import { checkCaptainShiftIssues } from '@/engine/captainShifts.ts';

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

                ].filter(g => g.contents.length > 0)
            },
        ].filter(g => g.issues?.length > 0);
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
                  body: 'p-2 text-[12px]'
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
                <ul class="list-disc pl-4">
                    <template v-for="(issueSet,m) in group.issues"
                              :key="m">

                        <USeparator class="my-1">
                            <UBadge v-if="issueSet.tag"
                                    :color="issueSet.tagColor ?? 'info'"
                                    size="xs"
                                    class="font-bold">
                                {{ issueSet.tag }}
                            </UBadge>
                        </USeparator>

                        <li v-for="(issue,j) in issueSet.contents"
                            v-html="formatIssue(issue)"
                            :key="j" />

                    </template>
                </ul>
            </UCard>

            <UEmpty v-if="!issues.length"
                    icon="i-lucide-check"
                    description="No issue detected." />

        </template>

    </USidebar>
</template>
