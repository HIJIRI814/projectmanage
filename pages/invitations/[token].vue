<template>
  <AuthLayout title="招待承認" :description="invitation ? `${invitation.companyName}からの招待` : '招待情報を確認中...'">
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-muted-foreground">読み込み中...</div>
    </div>
    <div v-else-if="error" class="rounded-lg border border-destructive bg-destructive/15 p-4 text-destructive">
      {{ error }}
    </div>
    <div v-else-if="invitation" class="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>招待情報</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div v-if="invitation.companyName">
            <Label class="text-sm font-medium text-muted-foreground">会社名</Label>
            <p class="mt-1">{{ invitation.companyName }}</p>
          </div>
          <div>
            <Label class="text-sm font-medium text-muted-foreground">メールアドレス</Label>
            <p class="mt-1">{{ invitation.email }}</p>
          </div>
          <div>
            <Label class="text-sm font-medium text-muted-foreground">種別</Label>
            <div class="mt-1">
              <Badge :variant="getUserTypeBadgeVariant(invitation.userType)">
                {{ getUserTypeLabel(invitation.userType) }}
              </Badge>
            </div>
          </div>
          <div>
            <Label class="text-sm font-medium text-muted-foreground">ステータス</Label>
            <div class="mt-1">
              <Badge :variant="getStatusBadgeVariant(invitation.status)">
                {{ getStatusLabel(invitation.status) }}
              </Badge>
            </div>
          </div>
          <div v-if="invitation.expiresAt">
            <Label class="text-sm font-medium text-muted-foreground">有効期限</Label>
            <p class="mt-1">{{ formatDate(invitation.expiresAt) }}</p>
          </div>
        </CardContent>
      </Card>

      <div v-if="!isAuthenticated" class="space-y-4">
        <p class="text-center text-sm text-muted-foreground">
          招待を承認するにはログインが必要です。
        </p>
        <Button class="w-full" as-child>
          <NuxtLink :to="`/login?redirect=${encodeURIComponent($route.fullPath)}`">
            ログイン
          </NuxtLink>
        </Button>
      </div>

      <div v-else-if="invitation.status === 'PENDING' && !isExpired" class="space-y-4">
        <Button
          class="w-full"
          :disabled="isAccepting"
          @click="handleAccept"
        >
          <span v-if="isAccepting">承認中...</span>
          <span v-else>招待を承認する</span>
        </Button>
      </div>

      <div v-else-if="invitation.status === 'ACCEPTED'" class="rounded-lg border bg-muted p-4 text-center">
        <p class="text-sm text-muted-foreground">この招待は既に承認されています。</p>
      </div>

      <div v-else-if="isExpired" class="rounded-lg border border-destructive bg-destructive/15 p-4 text-center">
        <p class="text-sm text-destructive">この招待は期限切れです。</p>
      </div>

      <div v-else class="rounded-lg border bg-muted p-4 text-center">
        <p class="text-sm text-muted-foreground">この招待は承認できません。</p>
      </div>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import AuthLayout from '~/components/templates/AuthLayout.vue'
import Card from '~/components/atoms/Card.vue'
import CardHeader from '~/components/atoms/CardHeader.vue'
import CardTitle from '~/components/atoms/CardTitle.vue'
import CardContent from '~/components/atoms/CardContent.vue'
import Button from '~/components/atoms/Button.vue'
import Badge from '~/components/atoms/Badge.vue'
import Label from '~/components/atoms/Label.vue'
import type { VariantProps } from 'class-variance-authority'

const route = useRoute()
const router = useRouter()
const token = route.params.token as string
const { isAuthenticated, user } = useAuth()

const isLoading = ref(true)
const error = ref<string | null>(null)
const invitation = ref<any>(null)
const isAccepting = ref(false)

// 招待情報を取得
const { data: invitationData, isLoading: isLoadingInvitation, error: invitationError } = useApiFetch(`/api/invitations/${token}`)

watch(invitationData, (newInvitation) => {
  if (newInvitation) {
    invitation.value = newInvitation
    isLoading.value = false
  }
}, { immediate: true })
watch(isLoadingInvitation, (loading) => {
  isLoading.value = loading
})
watch(invitationError, (err) => {
  if (err) {
    error.value = err
    isLoading.value = false
  }
})

const isExpired = computed(() => {
  if (!invitation.value || !invitation.value.expiresAt) return false
  const expiresAt = new Date(invitation.value.expiresAt)
  return new Date() > expiresAt
})

const getUserTypeLabel = (userType: number) => {
  const labels: Record<number, string> = {
    1: '管理者',
    2: 'メンバー',
    3: 'パートナー',
    4: '顧客',
  }
  return labels[userType] || '不明'
}

const getUserTypeBadgeVariant = (
  userType: number
): VariantProps<typeof Badge>['variant'] => {
  const variants: Record<number, VariantProps<typeof Badge>['variant']> = {
    1: 'default',
    2: 'secondary',
    3: 'outline',
    4: 'outline',
  }
  return variants[userType] || 'outline'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: '保留中',
    ACCEPTED: '承認済み',
    REJECTED: '拒否済み',
    EXPIRED: '期限切れ',
  }
  return labels[status] || status
}

const getStatusBadgeVariant = (
  status: string
): VariantProps<typeof Badge>['variant'] => {
  const variants: Record<string, VariantProps<typeof Badge>['variant']> = {
    PENDING: 'default',
    ACCEPTED: 'secondary',
    REJECTED: 'destructive',
    EXPIRED: 'outline',
  }
  return variants[status] || 'outline'
}

const formatDate = (date: string | Date) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ja-JP')
}

const handleAccept = async () => {
  isAccepting.value = true
  error.value = null

  try {
    const { apiFetch } = useApi()
    await apiFetch(`/api/invitations/${token}/accept`, {
      method: 'POST',
    })
    await router.push('/projects')
  } catch (err: any) {
    error.value = err.message || '承認に失敗しました'
  } finally {
    isAccepting.value = false
  }
}
</script>
