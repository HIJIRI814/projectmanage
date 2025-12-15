<template>
  <Card class="cursor-pointer transition-shadow hover:shadow-lg" @click="$emit('click')">
    <CardHeader>
      <div class="flex items-start justify-between">
        <CardTitle>{{ project.name }}</CardTitle>
        <Badge v-if="project.visibility" :variant="getVisibilityBadgeVariant(project.visibility)">
          {{ getVisibilityLabel(project.visibility) }}
        </Badge>
      </div>
      <CardDescription v-if="project.description">
        {{ project.description }}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div class="flex items-center justify-between text-sm text-muted-foreground">
        <span>作成日: {{ formatDate(project.createdAt) }}</span>
        <div class="flex gap-2">
          <slot name="actions" />
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import Card from '~/components/atoms/Card.vue'
import CardHeader from '~/components/atoms/CardHeader.vue'
import CardTitle from '~/components/atoms/CardTitle.vue'
import CardDescription from '~/components/atoms/CardDescription.vue'
import CardContent from '~/components/atoms/CardContent.vue'
import Badge from '~/components/atoms/Badge.vue'
import type { VariantProps } from 'class-variance-authority'

interface Project {
  id: string
  name: string
  description?: string | null
  visibility?: string
  createdAt: string | Date
}

interface Props {
  project: Project
}

defineProps<Props>()

defineEmits<{
  click: []
}>()

const formatDate = (date: string | Date) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ja-JP')
}

const getVisibilityLabel = (visibility: string) => {
  const labels: Record<string, string> = {
    PRIVATE: 'プライベート',
    COMPANY_INTERNAL: '社内公開',
    PUBLIC: '公開',
  }
  return labels[visibility] || visibility
}

const getVisibilityBadgeVariant = (
  visibility: string
): VariantProps<typeof Badge>['variant'] => {
  const variants: Record<string, VariantProps<typeof Badge>['variant']> = {
    PRIVATE: 'secondary',
    COMPANY_INTERNAL: 'default',
    PUBLIC: 'outline',
  }
  return variants[visibility] || 'default'
}
</script>

