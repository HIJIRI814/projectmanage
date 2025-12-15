<template>
  <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="container px-4 md:px-6 flex h-14 items-center">
      <div class="mr-4 hidden md:flex">
        <NuxtLink to="/" class="mr-6 flex items-center space-x-2">
          <span class="font-bold text-xl">Project Manager</span>
        </NuxtLink>
        <nav class="flex items-center space-x-6 text-sm font-medium">
          <NavigationItem
            v-for="item in navigationItems"
            :key="item.to"
            :to="item.to"
            :is-active="isActive(item.to)"
            :icon="item.icon"
          >
            {{ item.label }}
          </NavigationItem>
        </nav>
      </div>
      <div class="flex flex-1 items-center justify-between space-x-2 md:justify-end">
        <div class="w-full flex-1 md:w-auto md:flex-none">
          <slot name="search" />
        </div>
        <div v-if="user" class="flex items-center gap-4">
          <div class="text-sm">
            <p class="font-medium">{{ user.name }}</p>
            <p class="text-xs text-muted-foreground">{{ user.email }}</p>
          </div>
          <Button variant="ghost" size="sm" @click="handleLogout">
            ログアウト
          </Button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import { useAuthStore } from '~/stores/auth'
import Button from '~/components/atoms/Button.vue'
import NavigationItem from '~/components/molecules/NavigationItem.vue'
import { LayoutDashboard, FolderKanban, Building2, Users } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const { user, logout } = useAuth()

// クライアントサイドでユーザー情報を取得
const initUser = async () => {
  if (process.client) {
    const store = useAuthStore()
    const accessTokenCookie = useCookie('accessToken')
    
    // クッキーにトークンがあるがストアにない場合、ストアに設定
    if (accessTokenCookie.value && !store.accessToken) {
      store.setTokens(accessTokenCookie.value, null)
    }
    
    // トークンはあるがユーザー情報がない場合、APIから取得してストアに設定
    if (accessTokenCookie.value && !store.user) {
      try {
        const userData = await $fetch('/api/auth/me')
        store.setUser(userData)
      } catch (error: any) {
        console.error('Failed to fetch user info:', error)
      }
    }
  }
}

onMounted(() => {
  initUser()
})

// userがnullの場合は定期的にチェック
watch(() => user.value, (newUser) => {
  if (!newUser && process.client) {
    // 少し遅延させてから再試行
    setTimeout(() => {
      initUser()
    }, 100)
  }
}, { immediate: true })

const navigationItems = computed(() => {
  const items = [
    { to: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
    { to: '/projects', label: 'プロジェクト', icon: FolderKanban },
  ]

  // ユーザー情報が読み込まれている場合のみ管理者メニューを追加
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

const handleLogout = async () => {
  await logout()
  await router.push('/login')
}
</script>

