<template>
  <img
    :class="cn('aspect-square h-full w-full', $attrs.class)"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { cn } from '~/lib/utils'
</script>

