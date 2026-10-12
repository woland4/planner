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
        issues: Issue[];
    };

    type Issue = {
        tag?: string;
        tagColor?: 'info' | 'success' | 'warning' | 'error';
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

    const issues = computed<IssueGroup[]>(() => {
        return [
            {
                title: 'Team Composition',
                issues: [

                    ...checkCaptainIssues(store.currentTab?.team)
                        .map(text => ({ tag: 'CAPTAIN', text })),

                    ...checkSpecialIssues(store.currentTab?.team)
                        .map(text => ({ tag: 'SPECIAL', tagColor: 'error', text })),

                    ...checkSuperSpecialIssues(store.currentTab?.team)
                        .map(text => ({ tag: 'SUPER SPECIAL', tagColor: 'warning', text })),

                    ...checkCaptainShiftIssues(store.currentTab?.team)
                        .map(text => ({ tag: 'CAPTAIN SHIFT', tagColor: 'error', text }))

                ]
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
                  root: 'fixed left-0 top-0 bottom-0',
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
                    <li v-for="(issue,m) in group.issues"
                        :key="m">

                        <UBadge v-if="issue.tag"
                                :color="issue.tagColor ?? 'info'"
                                size="xs"
                                class="font-bold mr-1">
                            {{ issue.tag }}
                        </UBadge>

                        <span v-html="formatIssue(issue.text)" />

                    </li>
                </ul>
            </UCard>

            <UEmpty v-if="!issues.length"
                    icon="i-lucide-check"
                    description="No issue detected." />

        </template>

    </USidebar>
</template>
