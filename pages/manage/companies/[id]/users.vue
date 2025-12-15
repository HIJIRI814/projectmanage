<template>
  <div class="company-users-container">
    <div class="company-users-header">
      <h1>会社ユーザー管理: {{ companyName }}</h1>
      <NuxtLink to="/manage/companies" class="back-button">会社一覧に戻る</NuxtLink>
    </div>

    <div v-if="isLoadingCompany" class="loading">読み込み中...</div>
    <div v-else-if="companyError" class="error">{{ companyError }}</div>
    <div v-else>
      <div class="add-user-section">
        <h2>ユーザーを追加</h2>
        <form @submit.prevent="handleAddUser" class="add-user-form">
          <div class="form-group">
            <label for="userId">ユーザー</label>
            <select id="userId" v-model="addUserForm.userId" :disabled="isLoadingUsers || isLoadingAdd">
              <option value="">選択してください</option>
              <option
                v-for="user in availableUsers"
                :key="user.id"
                :value="user.id"
              >
                {{ user.name }} ({{ user.email }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="userType">種別</label>
            <select id="userType" v-model="addUserForm.userType" :disabled="isLoadingAdd">
              <option :value="1">管理者</option>
              <option :value="2">メンバー</option>
              <option :value="3">パートナー</option>
              <option :value="4">顧客</option>
            </select>
          </div>
          <button type="submit" :disabled="isLoadingAdd" class="add-button">
            {{ isLoadingAdd ? '追加中...' : '追加' }}
          </button>
        </form>
      </div>

      <div class="invite-user-section">
        <h2>招待を送る</h2>
        <form @submit.prevent="handleSendInvitation" class="invite-user-form">
          <div class="form-group">
            <label for="inviteEmail">メールアドレス</label>
            <input
              type="email"
              id="inviteEmail"
              v-model="inviteForm.email"
              required
              :disabled="isLoadingInvite"
              placeholder="example@example.com"
            />
          </div>
          <div class="form-group">
            <label for="inviteUserType">種別</label>
            <select id="inviteUserType" v-model="inviteForm.userType" :disabled="isLoadingInvite">
              <option :value="1">管理者</option>
              <option :value="2">メンバー</option>
              <option :value="3">パートナー</option>
              <option :value="4">顧客</option>
            </select>
          </div>
          <button type="submit" :disabled="isLoadingInvite" class="invite-button">
            {{ isLoadingInvite ? '送信中...' : '招待を送る' }}
          </button>
        </form>
        <div v-if="invitationLink" class="invitation-link-section">
          <p>招待リンク:</p>
          <div class="link-container">
            <input type="text" :value="invitationLink" readonly class="link-input" />
            <button @click="copyLink" class="copy-button">コピー</button>
          </div>
        </div>
      </div>

      <div class="invitations-section">
        <h2>招待一覧</h2>
        <div v-if="isLoadingInvitations" class="loading">読み込み中...</div>
        <div v-else-if="invitationsError" class="error">{{ invitationsError }}</div>
        <table v-else-if="invitations && invitations.length > 0" class="invitations-table">
          <thead>
            <tr>
              <th>メールアドレス</th>
              <th>種別</th>
              <th>ステータス</th>
              <th>有効期限</th>
              <th>招待リンク</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="invitation in invitations" :key="invitation.id">
              <td>{{ invitation.email }}</td>
              <td>
                <span v-if="invitation.userType === 1">管理者</span>
                <span v-else-if="invitation.userType === 2">メンバー</span>
                <span v-else-if="invitation.userType === 3">パートナー</span>
                <span v-else>顧客</span>
              </td>
              <td>
                <span v-if="invitation.status === 'PENDING'">保留中</span>
                <span v-else-if="invitation.status === 'ACCEPTED'">承認済み</span>
                <span v-else-if="invitation.status === 'REJECTED'">拒否済み</span>
                <span v-else>期限切れ</span>
              </td>
              <td>{{ formatDate(invitation.expiresAt) }}</td>
              <td>
                <button @click="copyInvitationLink(invitation.token)" class="copy-link-button">
                  リンクをコピー
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-message">招待がありません</div>
      </div>

      <div class="users-section">
        <h2>所属ユーザー一覧</h2>
        <div v-if="isLoadingUsers" class="loading">読み込み中...</div>
        <div v-else-if="usersError" class="error">{{ usersError }}</div>
        <table v-else-if="users && users.length > 0" class="users-table">
          <thead>
            <tr>
              <th>ユーザーID</th>
              <th>名前</th>
              <th>種別</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="userCompany in users" :key="userCompany.id">
              <td>{{ userCompany.userId }}</td>
              <td>{{ getUserName(userCompany.userId) }}</td>
              <td>
                <select
                  v-model="userCompany.userType"
                  @change="handleUpdateUserType(userCompany.userId, userCompany.userType)"
                  :disabled="isUpdating"
                >
                  <option :value="1">管理者</option>
                  <option :value="2">メンバー</option>
                  <option :value="3">パートナー</option>
                  <option :value="4">顧客</option>
                </select>
              </td>
              <td>
                <button
                  @click="handleRemoveUser(userCompany.userId)"
                  class="remove-button"
                  :disabled="isRemoving"
                >
                  削除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-message">所属ユーザーがいません</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 会社ごとの管理者権限チェックはAPIエンドポイント側で行われるため、
// ここでは通常の認証ミドルウェアのみを使用
definePageMeta({
  middleware: 'auth',
});

const route = useRoute();
const companyId = route.params.id as string;

const companyName = ref('');
const isLoadingCompany = ref(true);
const companyError = ref<string | null>(null);

// 会社情報を取得
const { data: company } = await useFetch(`/api/companies/${companyId}`, {
  onResponseError({ response }) {
    companyError.value = response.statusText || '会社の取得に失敗しました';
    isLoadingCompany.value = false;
  },
  onResponse({ response }) {
    if (response._data) {
      companyName.value = response._data.name;
    }
    isLoadingCompany.value = false;
  },
});

watch(company, (newCompany) => {
  if (newCompany) {
    companyName.value = newCompany.name;
    isLoadingCompany.value = false;
  }
}, { immediate: true });

// 会社のユーザー一覧
const { data: users, error: usersError, isLoading: isLoadingUsers, refresh: refreshUsers } = useFetch(
  `/api/companies/${companyId}/users`
);

// 全ユーザー一覧（追加用）
const { data: allUsers } = await useFetch('/api/manage/users');

const availableUsers = computed(() => {
  if (!allUsers.value) return [];
  const companyUserIds = users.value?.map((uc: any) => uc.userId) || [];
  return allUsers.value.filter((u: any) => !companyUserIds.includes(u.id));
});

const addUserForm = ref({
  userId: '',
  userType: 4,
});

const inviteForm = ref({
  email: '',
  userType: 4,
});

const invitationLink = ref<string | null>(null);
const isLoadingAdd = ref(false);
const isLoadingInvite = ref(false);
const isUpdating = ref(false);
const isRemoving = ref(false);

// 招待一覧
const { data: invitations, error: invitationsError, isLoading: isLoadingInvitations, refresh: refreshInvitations } = useFetch(
  `/api/companies/${companyId}/invitations`
);

const getUserName = (userId: string) => {
  const user = allUsers.value?.find((u: any) => u.id === userId);
  return user ? `${user.name} (${user.email})` : userId;
};

const handleAddUser = async () => {
  if (!addUserForm.value.userId) {
    alert('ユーザーを選択してください');
    return;
  }

  isLoadingAdd.value = true;
  try {
    await $fetch(`/api/companies/${companyId}/users`, {
      method: 'POST',
      body: {
        userId: addUserForm.value.userId,
        userType: addUserForm.value.userType,
      },
    });
    addUserForm.value = { userId: '', userType: 4 };
    await refreshUsers();
  } catch (err: any) {
    alert(err.data?.message || 'ユーザーの追加に失敗しました');
  } finally {
    isLoadingAdd.value = false;
  }
};

const handleUpdateUserType = async (userId: string, userType: number) => {
  isUpdating.value = true;
  try {
    await $fetch(`/api/companies/${companyId}/users/${userId}`, {
      method: 'PUT',
      body: {
        userType,
      },
    });
    await refreshUsers();
  } catch (err: any) {
    alert(err.data?.message || 'ユーザー種別の更新に失敗しました');
    await refreshUsers();
  } finally {
    isUpdating.value = false;
  }
};

const handleRemoveUser = async (userId: string) => {
  if (!confirm('本当に削除しますか？')) {
    return;
  }

  isRemoving.value = true;
  try {
    await $fetch(`/api/companies/${companyId}/users/${userId}`, {
      method: 'DELETE',
    });
    await refreshUsers();
  } catch (err: any) {
    alert(err.data?.message || 'ユーザーの削除に失敗しました');
  } finally {
    isRemoving.value = false;
  }
};

const handleSendInvitation = async () => {
  if (!inviteForm.value.email) {
    alert('メールアドレスを入力してください');
    return;
  }

  isLoadingInvite.value = true;
  invitationLink.value = null;
  try {
    const response = await $fetch(`/api/companies/${companyId}/invitations`, {
      method: 'POST',
      body: {
        email: inviteForm.value.email,
        userType: inviteForm.value.userType,
      },
    });

    invitationLink.value = response.invitationLink;
    inviteForm.value = { email: '', userType: 4 };
    await refreshInvitations();
  } catch (err: any) {
    alert(err.data?.message || '招待の送信に失敗しました');
  } finally {
    isLoadingInvite.value = false;
  }
};

const copyLink = async () => {
  if (invitationLink.value) {
    await navigator.clipboard.writeText(invitationLink.value);
    alert('リンクをコピーしました');
  }
};

const copyInvitationLink = async (token: string) => {
  const link = `${window.location.origin}/invitations/${token}`;
  await navigator.clipboard.writeText(link);
  alert('リンクをコピーしました');
};

const formatDate = (date: string | Date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ja-JP');
};
</script>

<style scoped>
.company-users-container {
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.company-users-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

h1 {
  font-size: 28px;
  color: #333;
}

.back-button {
  padding: 12px 24px;
  background-color: #e2e8f0;
  color: #4a5568;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  transition: background-color 0.3s;
}

.back-button:hover {
  background-color: #cbd5e0;
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

.add-user-section {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

h2 {
  font-size: 20px;
  color: #333;
  margin-bottom: 20px;
}

.add-user-form {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.form-group {
  flex: 1;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 600;
}

select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  box-sizing: border-box;
}

select:focus {
  outline: none;
  border-color: #667eea;
}

.add-button {
  padding: 12px 24px;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  white-space: nowrap;
}

.add-button:hover:not(:disabled) {
  background-color: #5a67d8;
}

.add-button:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}

.users-section {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table thead {
  background-color: #667eea;
  color: white;
}

.users-table th,
.users-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.users-table tbody tr:hover {
  background-color: #f7fafc;
}

.users-table select {
  padding: 6px;
  font-size: 14px;
}

.remove-button {
  padding: 6px 12px;
  background-color: #e53e3e;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.remove-button:hover:not(:disabled) {
  background-color: #c53030;
}

.remove-button:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}

.empty-message {
  text-align: center;
  padding: 40px;
  color: #718096;
}

.invite-user-section {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.invite-user-form {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  margin-bottom: 20px;
}

.invite-button {
  padding: 12px 24px;
  background-color: #48bb78;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  white-space: nowrap;
}

.invite-button:hover:not(:disabled) {
  background-color: #38a169;
}

.invite-button:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}

.invitation-link-section {
  margin-top: 20px;
  padding: 20px;
  background-color: #f7fafc;
  border-radius: 6px;
}

.invitation-link-section p {
  margin-bottom: 10px;
  font-weight: 600;
  color: #333;
}

.link-container {
  display: flex;
  gap: 8px;
}

.link-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: monospace;
}

.copy-button {
  padding: 8px 16px;
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
}

.copy-button:hover {
  background-color: #3182ce;
}

.invitations-section {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.invitations-table {
  width: 100%;
  border-collapse: collapse;
}

.invitations-table thead {
  background-color: #48bb78;
  color: white;
}

.invitations-table th,
.invitations-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.invitations-table tbody tr:hover {
  background-color: #f7fafc;
}

.copy-link-button {
  padding: 6px 12px;
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.copy-link-button:hover {
  background-color: #3182ce;
}
</style>

