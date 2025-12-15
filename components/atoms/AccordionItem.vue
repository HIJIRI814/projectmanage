<template>
  <div :class="cn('border-b', $attrs.class)">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { cn } from '~/lib/utils'

interface AccordionContext {
  openItems: Set<string>
  toggleItem: (value: string) => void
  isOpen: (value: string) => boolean
  multiple: boolean
}

const props = defineProps<{
  value: string
}>()

const accordion = inject<AccordionContext>('accordion')

if (!accordion) {
  throw new Error('AccordionItem must be used within Accordion')
}
</script>

