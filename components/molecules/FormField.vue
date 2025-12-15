<template>
  <div :class="cn('space-y-2', $attrs.class)">
    <Label v-if="label" :for="id">
      {{ label }}
      <span v-if="required" class="text-destructive">*</span>
    </Label>
    <slot />
    <p v-if="error" class="text-sm text-destructive">
      {{ error }}
    </p>
    <p v-else-if="description" class="text-sm text-muted-foreground">
      {{ description }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { cn } from '~/lib/utils'
import Label from '~/components/atoms/Label.vue'

interface Props {
  label?: string
  id?: string
  error?: string
  description?: string
  required?: boolean
}

withDefaults(defineProps<Props>(), {
  label: undefined,
  id: undefined,
  error: undefined,
  description: undefined,
  required: false,
})
</script>

