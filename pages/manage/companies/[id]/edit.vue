<template>
  <div class="company-form-container">
    <h1>会社編集</h1>
    <div v-if="isLoadingCompany" class="loading">読み込み中...</div>
    <div v-else-if="companyError" class="error">{{ companyError }}</div>
    <form v-else @submit.prevent="handleSubmit" class="company-form">
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
      <div v-if="error" class="error-message">{{ error }}</div>
      <div class="form-actions">
        <button type="submit" :disabled="isLoading" class="submit-button">
          {{ isLoading ? '更新中...' : '更新' }}
        </button>
        <NuxtLink to="/manage/companies" class="cancel-button">キャンセル</NuxtLink>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  // 会社ごとの管理者権限チェックはAPIエンドポイント側で行われるため、
  // ここでは通常の認証ミドルウェアのみを使用
  middleware: 'auth',
});

const route = useRoute();
const router = useRouter();
const companyId = route.params.id as string;

const form = ref({
  name: '',
});

const isLoading = ref(false);
const isLoadingCompany = ref(true);
const error = ref<string | null>(null);
const companyError = ref<string | null>(null);

const { data: company } = await useFetch(`/api/companies/${companyId}`, {
  onResponseError({ response }) {
    companyError.value = response.statusText || '会社の取得に失敗しました';
    isLoadingCompany.value = false;
  },
  onResponse({ response }) {
    if (response._data) {
      const companyData = response._data;
      form.value = {
        name: companyData.name,
      };
    }
    isLoadingCompany.value = false;
  },
});

watch(company, (newCompany) => {
  if (newCompany) {
    form.value = {
      name: newCompany.name,
    };
    isLoadingCompany.value = false;
  }
}, { immediate: true });

const handleSubmit = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    await $fetch(`/api/companies/${companyId}`, {
      method: 'PUT',
      body: {
        name: form.value.name,
      },
    });
    router.push('/manage/companies');
  } catch (err: any) {
    error.value = err.data?.message || '更新に失敗しました';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.company-form-container {
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

.company-form {
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

input[type='text'] {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  box-sizing: border-box;
  font-family: inherit;
}

input:focus {
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
</style>

