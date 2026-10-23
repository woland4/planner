<script setup lang="ts">
    /*-------
      Options
      -------*/

    defineOptions({ inheritAttrs: false });

    /*-----
      Props
      -----*/

    const props = defineProps<{
        placeholder?: string;
    }>();

    /*-----
      State
      -----*/

    const model = defineModel();
</script>

<template>
    <select v-model="model"
            v-bind="$attrs"
            :class="{ 'text-dimmed!': !model }"
            class="basic-select rounded-md border-0 placeholder:text-dimmed disabled:cursor-not-allowed disabled:opacity-75 px-3 p-[6.5px] text-base/5 gap-1.5 text-highlighted bg-default ring ring-inset ring-accented outline-primary/25 focus-visible:outline-3 focus-visible:ring-primary text-start md:text-sm">

        <option v-if="props.placeholder"
                value=""
                disabled
                selected
                hidden>
            {{ props.placeholder }}
        </option>

        <slot />

    </select>
</template>
