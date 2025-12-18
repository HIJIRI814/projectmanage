<template>
  <aside
    :class="cn(
      'fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-64 border-r bg-background transition-transform',
      isOpen ? 'translate-x-0' : '-translate-x-full',
      'md:translate-x-0',
      $attrs.class
    )"
  >
    <nav class="space-y-1 p-4">
      <NavigationItem
        v-for="item in navigationItems"
        :key="item.to"
        :to="item.to"
        :is-active="isActive(item.to)"
        :icon="item.icon"
        :hide-label-on-mobile="false"
      >
        {{ item.label }}
      </NavigationItem>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import { cn } from '~/lib/utils'
import NavigationItem from '~/components/molecules/NavigationItem.vue'
import { LayoutDashboard, FolderKanban, Building2, Users } from 'lucide-vue-next'

interface Props {
  isOpen?: boolean
}

withDefaults(defineProps<Props>(), {
  isOpen: true,
})

const route = useRoute()
const { user } = useAuth()

const navigationItems = computed(() => {
  const items = [
    { to: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
    { to: '/projects', label: 'プロジェクト', icon: FolderKanban },
  ]

  if (user.value?.userCompanies?.some((uc: any) => uc.userType === 1)) {
    items.push(
      { to: '/manage/companies', label: '会社管理', icon: Building2 },
      { to: '/manage/users', label: 'ユーザー管理', icon: Users }
    )
  }

  return items
})

const isActive = (path: string) => {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>

