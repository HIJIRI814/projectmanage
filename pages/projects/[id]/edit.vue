<template>
  <div class="project-form-container">
    <h1>プロジェクト編集</h1>
    <div v-if="isLoadingProject" class="loading">読み込み中...</div>
    <div v-else-if="projectError" class="error">{{ projectError }}</div>
    <form v-else @submit.prevent="handleSubmit" class="project-form">
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
      <div class="form-group">
        <label for="description">説明</label>
        <textarea
          id="description"
          v-model="form.description"
          rows="4"
          :disabled="isLoading"
        ></textarea>
      </div>
      <div class="form-group">
        <label for="visibility">公開範囲</label>
        <select id="visibility" v-model="form.visibility" :disabled="isLoading">
          <option value="PRIVATE">プライベート</option>
          <option value="COMPANY_INTERNAL">社内公開</option>
          <option value="PUBLIC">公開</option>
        </select>
      </div>
      <div class="form-group">
        <label for="companyIds">所属会社（複数選択可）</label>
        <div v-if="isLoadingCompanies" class="loading-text">読み込み中...</div>
        <div v-else-if="companiesError" class="error-text">{{ companiesError }}</div>
        <div v-else class="checkbox-group">
          <label
            v-for="company in companies"
            :key="company.id"
            class="checkbox-label"
          >
            <input
              type="checkbox"
              :value="company.id"
              v-model="form.companyIds"
              :disabled="isLoading"
            />
            {{ company.name }}
          </label>
        </div>
      </div>
      <div v-if="error" class="error-message">{{ error }}</div>
      <div class="form-actions">
        <button type="submit" :disabled="isLoading" class="submit-button">
          {{ isLoading ? '更新中...' : '更新' }}
        </button>
        <NuxtLink to="/projects" class="cancel-button">キャンセル</NuxtLink>
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
  if (!user.value || user.value.userType === null) return false;
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
  visibility: 'PRIVATE' as 'PRIVATE' | 'COMPANY_INTERNAL' | 'PUBLIC',
  companyIds: [] as string[],
});

const isLoading = ref(false);
const isLoadingProject = ref(true);
const error = ref<string | null>(null);
const projectError = ref<string | null>(null);
const isLoadingCompanies = ref(true);
const companiesError = ref<string | null>(null);
const companies = ref<any[]>([]);

// 会社一覧を取得
const { data: companiesData, error: companiesFetchError } = await useFetch('/api/companies');
watch(companiesData, (newCompanies) => {
  if (newCompanies) {
    companies.value = newCompanies;
    isLoadingCompanies.value = false;
  }
}, { immediate: true });
watch(companiesFetchError, (err) => {
  if (err) {
    companiesError.value = err.message || '会社一覧の取得に失敗しました';
    isLoadingCompanies.value = false;
  }
});

const { data: project } = await useFetch(`/api/projects/${projectId}`, {
  onResponseError({ response }) {
    projectError.value = response.statusText || 'プロジェクトの取得に失敗しました';
    isLoadingProject.value = false;
  },
  onResponse({ response }) {
    if (response._data) {
      const projectData = response._data;
      form.value = {
        name: projectData.name,
        description: projectData.description || '',
        visibility: projectData.visibility || 'PRIVATE',
        companyIds: projectData.companyIds || [],
      };
    }
    isLoadingProject.value = false;
  },
});

// project.value の変化を監視してフォームを更新（SSR/CSRの両方に対応）
watch(project, (newProject) => {
  if (newProject) {
    form.value = {
      name: newProject.name,
      description: newProject.description || '',
      visibility: newProject.visibility || 'PRIVATE',
      companyIds: newProject.companyIds || [],
    };
    isLoadingProject.value = false;
  }
}, { immediate: true });

const handleSubmit = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    await $fetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      body: {
        name: form.value.name,
        description: form.value.description || undefined,
        visibility: form.value.visibility,
        companyIds: form.value.companyIds.length > 0 ? form.value.companyIds : undefined,
      },
    });
    router.push('/projects');
  } catch (err: any) {
    error.value = err.data?.message || '更新に失敗しました';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.project-form-container {
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

.project-form {
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

select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  box-sizing: border-box;
  font-family: inherit;
}

select:focus {
  outline: none;
  border-color: #667eea;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background-color: #f9fafb;
  max-height: 200px;
  overflow-y: auto;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: normal;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  margin: 0;
  cursor: pointer;
}

.loading-text,
.error-text {
  padding: 8px;
  font-size: 14px;
}

.error-text {
  color: #e53e3e;
}
</style>

