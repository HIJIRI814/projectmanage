<template>
  <div class="min-h-screen flex items-center justify-center bg-muted/50 p-4">
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle class="text-2xl">{{ title }}</CardTitle>
        <CardDescription v-if="description">
          {{ description }}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <slot />
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import Card from '~/components/atoms/Card.vue'
import CardHeader from '~/components/atoms/CardHeader.vue'
import CardTitle from '~/components/atoms/CardTitle.vue'
import CardDescription from '~/components/atoms/CardDescription.vue'
import CardContent from '~/components/atoms/CardContent.vue'

interface Props {
  title: string
  description?: string
}

withDefaults(defineProps<Props>(), {
  description: undefined,
})
</script>

