<template>
  <div
    v-show="isOpen"
    :class="cn(
      'overflow-hidden text-sm transition-all duration-200',
      isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0',
      $attrs.class
    )"
  >
    <div class="pb-4 pt-0">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, computed } from 'vue'
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
  throw new Error('AccordionContent must be used within Accordion')
}

const isOpen = computed(() => accordion.isOpen(props.value))
</script>

