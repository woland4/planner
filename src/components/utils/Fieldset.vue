<script setup lang="ts">
    /*-------
      Options
      -------*/

    defineOptions({ inheritAttrs: false });

    /*-----
      Props
      -----*/

    const props = defineProps<{
        label: string;
    }>();
</script>

<template>
    <fieldset v-bind="$attrs"
              class="rounded-lg border border-default">

        <legend class="px-2 text-sm font-bold text-highlighted border border-default rounded-[5px] backdrop-blur-xl">
            {{ props.label }}
        </legend>

        <slot />

    </fieldset>
</template>
