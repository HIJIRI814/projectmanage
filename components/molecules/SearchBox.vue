<template>
  <div :class="cn('relative', $attrs.class)">
    <Search
      :class="cn(
        'absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground',
        $attrs.class
      )"
    />
    <Input
      :class="cn('pl-9', $attrs.class)"
      :placeholder="placeholder"
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      v-bind="$attrs"
    />
  </div>
</template>

<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import { cn } from '~/lib/utils'
import Input from '~/components/atoms/Input.vue'

interface Props {
  modelValue: string
  placeholder?: string
}

withDefaults(defineProps<Props>(), {
  placeholder: '検索...',
})

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

