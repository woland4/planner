<script setup lang="ts">
    import { computed } from 'vue';
    import { useStorage } from '@vueuse/core';

    import { Battles } from '@/utils/battles.ts';

    import type { Booster, Team } from '@/types/battles.ts';
    import type { Nullable } from '@/types/utils.ts';

    /*-----
      Types
      -----*/

    type SavedTeam = { name: string } & Team;

    /*-----
      Props
      -----*/

    const props = defineProps<{
        boosters?: Nullable<Booster[]>
    }>();

    /*-----
      Emits
      -----*/

    const emit = defineEmits<{ close: [ result: Nullable<Team> ] }>();

    /*-----
      State
      -----*/

    const savedTeams = useStorage<SavedTeam[]>('savedTeams', [ ]);

    /*--------
      Computed
      --------*/

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

    function onSelect(team: SavedTeam) {
        emit('close', team);
    }

    function onClose() {
        emit('close', null);
    }
</script>

<template>
    <UModal title="Load Team"
            :content="({ id: 'team-loading-modal', onInteractOutside: onClose }) as any"
            :close="{ onClick: onClose }"
            :ui="{ footer: 'justify-end' }">

        <template #body>

            <UEmpty v-if="!savedTeams.length"
                    title="No team found"
                    description="Saved teams will show up here" />

            <UCard v-for="(team,n) in savedTeams"
                   :key="n"
                   :ui="{ header: 'sm:p-3 relative', body: 'sm:p-3 flex flex-row gap-2' }"
                   variant="subtle">

                <template #title>

                    {{ team.name }}

                    <UBadge v-if="Battles.getOverallBoost(team.units, props.boosters)"
                            size="sm"
                            class="font-bold absolute right-3">
                        {{ Battles.getOverallBoost(team.units, props.boosters)!!.toFixed(2) }}x
                    </UBadge>

                </template>

                <div v-for="(unit,m) in team.units"
                     :key="m"
                     class="team-loading-modal-thumb text-[0px] relative">

                    <UnitThumbnail :unit-id="unit?.id"
                                   :variant="unit?.variant"
                                   :boost="unit?.id ? boosterMap[unit.id] : null"
                                   class="max-w-15" />

                    <UnitThumbnail v-if="unit?.support"
                                   :unit-id="unit.support"
                                   class="absolute! right-0 bottom-0 max-w-6.25 border border-black rounded-[5px]" />

                </div>

                <UButton color="error"
                         variant="subtle"
                         class="cursor-pointer ml-auto self-center pt-2 pb-2"
                         @click="onSelect(team)">
                    Load
                </UButton>

            </UCard>

        </template>

        <template #footer>

            <UButton label="Cancel"
                     color="neutral"
                     variant="outline"
                     class="cursor-pointer"
                     @click="onClose" />

        </template>

    </UModal>
</template>

<style lang="scss">
    #team-loading-modal {

        .unit-thumbnail .boost {
            bottom: unset;
            top: 2.5px;
        }

    }
</style>
