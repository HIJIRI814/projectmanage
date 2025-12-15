<template>
  <div
    :class="cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted',
      $attrs.class
    )"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { cn } from '~/lib/utils'
</script>

