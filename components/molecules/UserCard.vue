<template>
  <Card>
    <CardContent class="flex items-center gap-4 p-4">
      <Avatar>
        <AvatarImage v-if="avatarUrl" :src="avatarUrl" :alt="name" />
        <AvatarFallback>
          {{ name.charAt(0).toUpperCase() }}
        </AvatarFallback>
      </Avatar>
      <div class="flex-1">
        <p class="font-medium">{{ name }}</p>
        <p v-if="email" class="text-sm text-muted-foreground">{{ email }}</p>
        <div v-if="badge" class="mt-1">
          <Badge :variant="badgeVariant">{{ badge }}</Badge>
        </div>
      </div>
      <slot name="actions" />
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import Card from '~/components/atoms/Card.vue'
import CardContent from '~/components/atoms/CardContent.vue'
import Avatar from '~/components/atoms/Avatar.vue'
import AvatarImage from '~/components/atoms/AvatarImage.vue'
import AvatarFallback from '~/components/atoms/AvatarFallback.vue'
import Badge from '~/components/atoms/Badge.vue'
import type { VariantProps } from 'class-variance-authority'

interface Props {
  name: string
  email?: string
  avatarUrl?: string
  badge?: string
  badgeVariant?: VariantProps<typeof Badge>['variant']
}

withDefaults(defineProps<Props>(), {
  email: undefined,
  avatarUrl: undefined,
  badge: undefined,
  badgeVariant: 'default',
})
</script>

