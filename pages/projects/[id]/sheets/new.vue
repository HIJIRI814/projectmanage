<template>
  <div class="sheet-form-container">
    <h1>シート作成</h1>
    <div class="back-link-container">
      <NuxtLink :to="`/projects/${projectId}`" class="back-link">
        ← プロジェクトに戻る
      </NuxtLink>
    </div>
    <form @submit.prevent="handleSubmit" class="sheet-form">
      <div class="form-group">
        <label for="name">名前 <span class="required">*</span></label>
        <input
          type="text"
          id="name"
          v-model="form.name"
          required
          :disabled="isLoading"
          placeholder="シート名を入力"
        />
      </div>
      <div class="form-group">
        <label for="description">説明</label>
        <textarea
          id="description"
          v-model="form.description"
          rows="3"
          :disabled="isLoading"
          placeholder="シートの説明を入力（任意）"
        ></textarea>
      </div>
      <div class="form-group">
        <label for="content">内容</label>
        <textarea
          id="content"
          v-model="form.content"
          rows="10"
          :disabled="isLoading"
          placeholder="シートの内容を入力（任意）"
        ></textarea>
      </div>
      <div v-if="error" class="error-message">{{ error }}</div>
      <div class="form-actions">
        <button type="submit" :disabled="isLoading" class="submit-button">
          {{ isLoading ? '作成中...' : '作成' }}
        </button>
        <NuxtLink :to="`/projects/${projectId}`" class="cancel-button">
          キャンセル
        </NuxtLink>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
});

import { UserType } from '~/domain/user/model/UserType';

const route = useRoute();
const router = useRouter();
const projectId = route.params.id as string;

const { user } = useAuth();

// 管理者・メンバーのみアクセス可能
const canManageProjects = computed(() => {
  if (!user.value) return false;
  return user.value.userType === UserType.ADMINISTRATOR || user.value.userType === UserType.MEMBER;
});

// アクセス権限チェック
if (process.client && !canManageProjects.value) {
  throw createError({
    statusCode: 403,
    statusMessage: 'Forbidden: Administrator or Member access required',
  });
}

const form = ref({
  name: '',
  description: '',
  content: '',
});

const isLoading = ref(false);
const error = ref<string | null>(null);

const handleSubmit = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    await $fetch(`/api/projects/${projectId}/sheets`, {
      method: 'POST',
      body: {
        name: form.value.name,
        description: form.value.description || undefined,
        content: form.value.content || undefined,
      },
    });
    router.push(`/projects/${projectId}`);
  } catch (err: any) {
    error.value = err.data?.message || '作成に失敗しました';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.sheet-form-container {
  padding: 40px;
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 12px;
}

.back-link-container {
  margin-bottom: 24px;
}

.back-link {
  color: #667eea;
  text-decoration: none;
  font-size: 14px;
}

.back-link:hover {
  text-decoration: underline;
}

.sheet-form {
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

.required {
  color: #e53e3e;
}

input[type='text'],
textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  box-sizing: border-box;
  font-family: inherit;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #667eea;
}

textarea {
  resize: vertical;
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
</style>

