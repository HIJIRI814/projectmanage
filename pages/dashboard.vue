<template>
  <DashboardLayout>
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">ダッシュボード</h1>
        <p class="text-muted-foreground mt-1">
          ようこそ、{{ user?.name }}さん
        </p>
      </div>

      <div v-if="user" class="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>ユーザー情報</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div>
              <Label class="text-sm font-medium text-muted-foreground">ID</Label>
              <p class="mt-1 font-mono text-sm">{{ user.id }}</p>
            </div>
            <div>
              <Label class="text-sm font-medium text-muted-foreground">メールアドレス</Label>
              <p class="mt-1">{{ user.email }}</p>
            </div>
            <div>
              <Label class="text-sm font-medium text-muted-foreground">名前</Label>
              <p class="mt-1">{{ user.name }}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>クイックアクション</CardTitle>
          </CardHeader>
          <CardContent class="space-y-2">
            <Button variant="outline" class="w-full justify-start" as-child>
              <NuxtLink to="/projects" class="flex items-center">
                <FolderKanban class="mr-2 h-4 w-4" />
                プロジェクト一覧
              </NuxtLink>
            </Button>
            <Button
              variant="destructive"
              class="w-full justify-start"
              @click="handleLogout"
            >
              <LogOut class="mr-2 h-4 w-4" />
              ログアウト
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

import { FolderKanban, LogOut } from 'lucide-vue-next'
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import Card from '~/components/atoms/Card.vue'
import CardHeader from '~/components/atoms/CardHeader.vue'
import CardTitle from '~/components/atoms/CardTitle.vue'
import CardContent from '~/components/atoms/CardContent.vue'
import Button from '~/components/atoms/Button.vue'
import Label from '~/components/atoms/Label.vue'

const router = useRouter()
const { user, logout } = useAuth()

const handleLogout = async () => {
  await logout()
  await router.push('/login')
}
</script>
