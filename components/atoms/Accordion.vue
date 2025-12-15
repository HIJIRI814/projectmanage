<template>
  <div :class="cn('space-y-2', $attrs.class)">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { provide, ref, watch } from 'vue'
import { cn } from '~/lib/utils'

interface Props {
  defaultOpen?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  defaultOpen: () => [],
})

const openItems = ref<Set<string>>(new Set())
const multiple = ref(true)

// defaultOpenが変更されたら更新（新しいアイテムを追加、既存のアイテムは保持）
watch(() => props.defaultOpen, (newDefaultOpen) => {
  if (newDefaultOpen && newDefaultOpen.length > 0) {
    newDefaultOpen.forEach((id: string) => {
      openItems.value.add(id)
    })
  }
}, { immediate: true, deep: true })

const toggleItem = (value: string) => {
  if (multiple.value) {
    if (openItems.value.has(value)) {
      openItems.value.delete(value)
    } else {
      openItems.value.add(value)
    }
  } else {
    if (openItems.value.has(value)) {
      openItems.value.clear()
    } else {
      openItems.value.clear()
      openItems.value.add(value)
    }
  }
}

const isOpen = (value: string) => {
  return openItems.value.has(value)
}

provide('accordion', {
  openItems,
  toggleItem,
  isOpen,
  multiple,
})
</script>

