<template>
  <div class="user-form-container">
    <h1>ユーザー編集</h1>
    <div v-if="isLoadingUser" class="loading">読み込み中...</div>
    <div v-else-if="userError" class="error">{{ userError }}</div>
    <form v-else @submit.prevent="handleSubmit" class="user-form">
      <div class="form-group">
        <label for="email">メールアドレス</label>
        <input
          type="email"
          id="email"
          v-model="form.email"
          required
          :disabled="isLoading"
        />
      </div>
      <div class="form-group">
        <label for="password">パスワード（変更する場合のみ入力）</label>
        <input
          type="password"
          id="password"
          v-model="form.password"
          minlength="8"
          :disabled="isLoading"
        />
      </div>
      <div class="form-group">
        <label for="name">名前</label>
        <input
          type="text"
          id="name"
          v-model="form.name"
          required
          :disabled="isLoading"
        />
      </div>
      <!-- userTypeはUserCompanyで管理するため、ここでは削除 -->
      <div v-if="error" class="error-message">{{ error }}</div>
      <div class="form-actions">
        <button type="submit" :disabled="isLoading" class="submit-button">
          {{ isLoading ? '更新中...' : '更新' }}
        </button>
        <NuxtLink to="/manage/users" class="cancel-button">キャンセル</NuxtLink>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
});

const route = useRoute();
const router = useRouter();
const userId = route.params.id as string;

const { user: currentUser } = useAuth();
const isEditingSelf = computed(() => {
  return currentUser.value?.id === userId;
});

const form = ref({
  email: '',
  password: '',
  name: '',
});

const isLoading = ref(false);
const isLoadingUser = ref(true);
const error = ref<string | null>(null);
const userError = ref<string | null>(null);

const { data: user } = await useFetch(`/api/manage/users/${userId}`, {
  onResponseError({ response }) {
    userError.value = response.statusText || 'ユーザーの取得に失敗しました';
    isLoadingUser.value = false;
  },
  onResponse({ response }) {
    if (response._data) {
      const userData = response._data;
      form.value = {
        email: userData.email,
        password: '',
        name: userData.name,
      };
    }
    isLoadingUser.value = false;
  },
});

// user.value の変化を監視してフォームを更新（SSR/CSRの両方に対応）
watch(user, (newUser) => {
  if (newUser) {
    form.value = {
      email: newUser.email,
      password: '',
      name: newUser.name,
    };
    isLoadingUser.value = false;
  }
}, { immediate: true });

const handleSubmit = async () => {
  isLoading.value = true;
  error.value = null;

  const updateData: any = {
    email: form.value.email,
    name: form.value.name,
  };

  if (form.value.password) {
    updateData.password = form.value.password;
  }

  try {
    await $fetch(`/api/manage/users/${userId}`, {
      method: 'PUT',
      body: updateData,
    });
    router.push('/manage/users');
  } catch (err: any) {
    error.value = err.data?.message || '更新に失敗しました';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.user-form-container {
  padding: 40px;
  max-width: 600px;
  margin: 0 auto;
}

h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 30px;
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

.user-form {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 600;
}

input[type='email'],
input[type='password'],
input[type='text'],
select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  box-sizing: border-box;
}

input:focus,
select:focus {
  outline: none;
  border-color: #667eea;
}

.error-message {
  color: #e53e3e;
  margin-bottom: 20px;
  padding: 12px;
  background-color: #fee;
  border-radius: 6px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 30px;
}

.submit-button {
  flex: 1;
  padding: 12px;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.submit-button:hover:not(:disabled) {
  background-color: #5a67d8;
}

.submit-button:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}

.cancel-button {
  padding: 12px 24px;
  background-color: #e2e8f0;
  color: #4a5568;
  text-decoration: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  transition: background-color 0.3s;
}

.cancel-button:hover {
  background-color: #cbd5e0;
}

.help-text {
  margin-top: 8px;
  font-size: 14px;
  color: #718096;
  font-style: italic;
}

select:disabled {
  background-color: #f7fafc;
  cursor: not-allowed;
  opacity: 0.6;
}
</style>

