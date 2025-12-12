<template>
  <div class="users-container">
    <div class="users-header">
      <h1>ユーザー管理</h1>
      <NuxtLink to="/manage/users/new" class="new-user-button">
        新規登録
      </NuxtLink>
    </div>

    <div v-if="isLoading" class="loading">読み込み中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <table v-else class="users-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>メールアドレス</th>
          <th>名前</th>
          <th>種別</th>
          <th>作成日</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.id }}</td>
          <td>{{ user.email }}</td>
          <td>{{ user.name }}</td>
          <td>{{ getUserTypeLabel(user.userType) }}</td>
          <td>{{ formatDate(user.createdAt) }}</td>
          <td>
            <NuxtLink :to="`/manage/users/${user.id}/edit`" class="edit-button">
              編集
            </NuxtLink>
            <button 
              v-if="!isCurrentUser(user.id)" 
              @click="handleDelete(user.id)" 
              class="delete-button"
            >
              削除
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
});

const { user: currentUser } = useAuth();

const isCurrentUser = (userId: string) => {
  return currentUser.value?.id === userId;
};

const { data: users, error, isLoading, refresh } = useFetch('/api/manage/users', {
  onResponse({ response }) {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/5bb52b61-727f-4e41-8e72-bb69d23dc924',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pages/manage/users/index.vue:49',message:'API response received',data:{status:response.status,hasData:!!response._data,dataLength:Array.isArray(response._data)?response._data.length:0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
  },
  onResponseError({ response }) {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/5bb52b61-727f-4e41-8e72-bb69d23dc924',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pages/manage/users/index.vue:55',message:'API response error',data:{status:response.status,statusText:response.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
  },
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

const formatDate = (date: string | Date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ja-JP');
};

const handleDelete = async (userId: string) => {
  if (!confirm('本当に削除しますか？')) {
    return;
  }

  try {
    await $fetch(`/api/manage/users/${userId}`, {
      method: 'DELETE',
    });
    await refresh();
  } catch (err: any) {
    alert(err.data?.message || '削除に失敗しました');
  }
};
</script>

<style scoped>
.users-container {
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.users-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

h1 {
  font-size: 28px;
  color: #333;
}

.new-user-button {
  padding: 12px 24px;
  background-color: #667eea;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  transition: background-color 0.3s;
}

.new-user-button:hover {
  background-color: #5a67d8;
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

.users-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

.edit-button {
  padding: 6px 12px;
  background-color: #48bb78;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  margin-right: 8px;
  font-size: 14px;
}

.edit-button:hover {
  background-color: #38a169;
}

.delete-button {
  padding: 6px 12px;
  background-color: #e53e3e;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.delete-button:hover {
  background-color: #c53030;
}
</style>

