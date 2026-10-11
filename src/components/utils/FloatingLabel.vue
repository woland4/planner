<script setup lang="ts">
    /*-------
      Options
      -------*/

    defineOptions({ inheritAttrs: false });

    /*-----
      Props
      -----*/

    const props = defineProps<{
        label: string
        required?: boolean
    }>();
</script>

<template>
    <div v-bind="$attrs"
         class="max-md:w-full relative">

        <label class="absolute left-2 -top-2.5 z-10 px-1 bg-default text-xs font-medium text-highlighted pointer-events-none">

            {{ props.label }}

            <span v-if="props.required"
                  class="text-error">
                *
            </span>

        </label>

        <slot />

    </div>
</template>
