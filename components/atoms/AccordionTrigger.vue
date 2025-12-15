<template>
  <button
    :class="cn(
      'flex flex-1 items-center justify-between py-4 font-medium transition-all w-full',
      !isOpen && '[&>svg]:rotate-180',
      $attrs.class
    )"
    @click="handleClick"
  >
    <slot />
    <ChevronDown class="h-4 w-4 shrink-0 transition-transform duration-200 ml-2" />
  </button>
</template>

<script setup lang="ts">
import { inject, computed } from 'vue'
import { cn } from '~/lib/utils'
import { ChevronDown } from 'lucide-vue-next'

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
  throw new Error('AccordionTrigger must be used within Accordion')
}

const isOpen = computed(() => accordion.isOpen(props.value))

const handleClick = () => {
  accordion.toggleItem(props.value)
}
</script>

