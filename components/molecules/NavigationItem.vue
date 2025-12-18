<template>
  <NuxtLink
    :to="to"
    :class="cn(
      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive
        ? 'bg-accent text-accent-foreground'
        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      customClass
    )"
    v-bind="$attrs"
  >
    <component v-if="icon" :is="icon" class="h-4 w-4" />
    <span :class="hideLabelOnMobile ? 'hidden lg:inline' : ''"><slot /></span>
  </NuxtLink>
</template>

<script setup lang="ts">
import { useAttrs } from 'vue'
import { type ClassValue } from 'clsx'
import { cn } from '~/lib/utils'

interface Props {
  to: string
  isActive?: boolean
  icon?: any
  hideLabelOnMobile?: boolean
}

withDefaults(defineProps<Props>(), {
  isActive: false,
  icon: undefined,
  hideLabelOnMobile: true,
})

const attrs = useAttrs()
const customClass = attrs.class as ClassValue
</script>

