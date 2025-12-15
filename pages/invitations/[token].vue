<template>
  <div class="invitation-container">
    <div class="invitation-card">
      <div v-if="isLoading" class="loading">読み込み中...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else-if="invitation">
        <h1>招待承認</h1>
        <div class="invitation-info">
          <p v-if="invitation.companyName"><strong>会社名:</strong> {{ invitation.companyName }}</p>
          <p><strong>メールアドレス:</strong> {{ invitation.email }}</p>
          <p><strong>種別:</strong> {{ getUserTypeLabel(invitation.userType) }}</p>
          <p><strong>ステータス:</strong> {{ getStatusLabel(invitation.status) }}</p>
          <p v-if="invitation.expiresAt">
            <strong>有効期限:</strong> {{ formatDate(invitation.expiresAt) }}
          </p>
        </div>

        <div v-if="!isAuthenticated" class="auth-required">
          <p>招待を承認するにはログインが必要です。</p>
          <NuxtLink :to="`/login?redirect=${encodeURIComponent($route.fullPath)}`" class="login-button">
            ログイン
          </NuxtLink>
        </div>

        <div v-else-if="invitation.status === 'PENDING' && !isExpired" class="accept-section">
          <button @click="handleAccept" :disabled="isAccepting" class="accept-button">
            {{ isAccepting ? '承認中...' : '招待を承認する' }}
          </button>
        </div>

        <div v-else-if="invitation.status === 'ACCEPTED'" class="already-accepted">
          <p>この招待は既に承認されています。</p>
        </div>

        <div v-else-if="isExpired" class="expired">
          <p>この招待は期限切れです。</p>
        </div>

        <div v-else class="cannot-accept">
          <p>この招待は承認できません。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const token = route.params.token as string;
const { isAuthenticated, user } = useAuth();

const isLoading = ref(true);
const error = ref<string | null>(null);
const invitation = ref<any>(null);
const isAccepting = ref(false);

// 招待情報を取得
const { data: invitationData } = await useFetch(`/api/invitations/${token}`, {
  onResponseError({ response }) {
    error.value = response.statusText || '招待の取得に失敗しました';
    isLoading.value = false;
  },
  onResponse({ response }) {
    if (response._data) {
      invitation.value = response._data;
    }
    isLoading.value = false;
  },
});

watch(invitationData, (newInvitation) => {
  if (newInvitation) {
    invitation.value = newInvitation;
    isLoading.value = false;
  }
}, { immediate: true });

const isExpired = computed(() => {
  if (!invitation.value || !invitation.value.expiresAt) return false;
  const expiresAt = new Date(invitation.value.expiresAt);
  return new Date() > expiresAt;
});

const getUserTypeLabel = (userType: number) => {
  const labels: Record<number, string> = {
    1: '管理者',
    2: 'メンバー',
    3: 'パートナー',
    4: '顧客',
  };
  return labels[userType] || '不明';
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: '保留中',
    ACCEPTED: '承認済み',
    REJECTED: '拒否済み',
    EXPIRED: '期限切れ',
  };
  return labels[status] || status;
};

const formatDate = (date: string | Date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ja-JP');
};

const handleAccept = async () => {
  if (!isAuthenticated.value) {
    router.push(`/login?redirect=${encodeURIComponent(route.fullPath)}`);
    return;
  }

  isAccepting.value = true;
  try {
    await $fetch(`/api/invitations/${token}/accept`, {
      method: 'POST',
    });

    alert('招待を承認しました');
    router.push('/projects');
  } catch (err: any) {
    if (err.data?.statusMessage === 'User not found. Please sign up first.') {
      alert('ユーザーが見つかりません。先にサインアップしてください。');
      router.push(`/signup?redirect=${encodeURIComponent(route.fullPath)}`);
    } else if (err.data?.statusMessage === 'User ID does not match invitation email') {
      alert('ログイン中のユーザーと招待のメールアドレスが一致しません。');
    } else if (err.data?.statusMessage === 'Invitation has expired') {
      alert('この招待は期限切れです。');
    } else {
      alert(err.data?.message || err.data?.statusMessage || '招待の承認に失敗しました');
    }
  } finally {
    isAccepting.value = false;
  }
};
</script>

<style scoped>
.invitation-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.invitation-card {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 600px;
}

h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 30px;
  text-align: center;
}

.loading,
.error {
  text-align: center;
  padding: 40px;
  font-size: 18px;
}

.error {
  color: #e53e3e;
}

.invitation-info {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f7fafc;
  border-radius: 8px;
}

.invitation-info p {
  margin-bottom: 12px;
  font-size: 16px;
  color: #333;
}

.invitation-info strong {
  color: #555;
  margin-right: 8px;
}

.auth-required {
  text-align: center;
  padding: 20px;
  background-color: #fff3cd;
  border-radius: 8px;
  margin-bottom: 20px;
}

.auth-required p {
  margin-bottom: 16px;
  color: #856404;
}

.login-button {
  display: inline-block;
  padding: 12px 24px;
  background-color: #667eea;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  transition: background-color 0.3s;
}

.login-button:hover {
  background-color: #5a67d8;
}

.accept-section {
  text-align: center;
}

.accept-button {
  padding: 12px 24px;
  background-color: #48bb78;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.accept-button:hover:not(:disabled) {
  background-color: #38a169;
}

.accept-button:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}

.already-accepted,
.expired,
.cannot-accept {
  text-align: center;
  padding: 20px;
  background-color: #e2e8f0;
  border-radius: 8px;
  color: #4a5568;
}
</style>

