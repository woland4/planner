<script setup lang="ts">
    import { useOverlay } from '@nuxt/ui/composables';

    import StageViewer from '@/components/viewer/StageViewer.vue';
    import BattleEditingModal from '@/modals/BattleEditingModal.vue';

    import { useStore } from '@/store.ts';
    import { useResponsiveness } from '@/utils/responsiveness.ts';

    import { Export } from '@/utils/export.ts';
    import { Battles } from '@/utils/battles.ts';
    import { Ui } from '@/utils/ui.ts';

    /*-----------
      Injectables
      -----------*/

    const overlay = useOverlay();

    const store = useStore();
    const responsiveness = useResponsiveness();

    /*------
      Modals
      ------*/

    const battleEditingModal = overlay.create(BattleEditingModal);

    /*-------
      Methods
      -------*/

    async function onEdit() {
        const modal = battleEditingModal.open({ data: store.currentTab.battle });
        const result = await modal.result;
        if (result)
            store.currentTab.battle = result;
    }

    async function onImportFromJSON() {

        const file = await Ui.askForUpload('.json');
        if (!file) return;

        try {
            const data = JSON.parse(await file.text());
            store.currentTab.battle = Battles.sanitizeBattle(data);
        } catch (_) {
            alert('Upload failed');
        }

    }

    function onExportToJSON() {

        const battle = store.currentTab?.battle;
        if (!battle) return;

        const result = Export.battleJSON(battle);
        if (!result) return;

        const blob = new Blob([ result ], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${ store.currentTab?.name ?? 'battle' }.json`;
        a.click();
        URL.revokeObjectURL(url);

    }
</script>

<template>
    <USidebar v-if="store.currentTab"
              v-model:open="store.leftSidebarVisible"
              :ui="{
                  root: 'fixed left-0 top-0 bottom-0',
                  container: 'h-full pt-(--sidebar-padding-top)',
                  inner: 'bg-elevated/25',
                  header: 'p-4 min-h-auto',
                  body: 'p-2'
              }"
              :style="{
                  '--sidebar-width': 'var(--sidebar-left-width-desktop)',
                  '--sidebar-padding-top': 'calc(var(--header-height-desktop) + var(--tabbar-height-desktop) + var(--spacing) * 4)'
              }"
              :title="responsiveness.isMobile.value ? 'Battle Info' : undefined"
              id="left-sidebar"
              collapsible="offcanvas"
              variant="floating">

        <template #footer>
            <div class="w-full flex flex-row gap-1.25 items-center justify-between">

                <UButton color="neutral"
                         variant="subtle"
                         icon="i-ri-edit-2-line"
                         class="cursor-pointer"
                         @click="onEdit">
                    Edit battle
                </UButton>

                <div class="grow" />

                <UTooltip :content="{ side: 'bottom' }"
                          :delay-duration="0"
                          text="Import battle from file">
                    <UButton color="neutral"
                             variant="subtle"
                             icon="i-lucide-hard-drive-upload"
                             class="cursor-pointer"
                             @click="onImportFromJSON" />
                </UTooltip>

                <UTooltip :content="{ side: 'bottom' }"
                          :delay-duration="0"
                          text="Export battle to file">
                    <UButton color="neutral"
                             variant="subtle"
                             icon="i-lucide-hard-drive-download"
                             class="cursor-pointer"
                             @click="onExportToJSON" />
                </UTooltip>

            </div>
        </template>

        <template #default>

            <UEmpty v-if="!store.currentTab?.battle?.stages"
                    title="Nothing to show"
                    description="No battle selected or selected battle has no stages" />

            <StageViewer v-else
                         :battle="store.currentTab.battle" />

        </template>

    </USidebar>
</template>
