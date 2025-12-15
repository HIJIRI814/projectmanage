<template>
  <div class="signup-container">
    <div class="signup-form-wrapper">
      <h1>新規登録</h1>
      <form @submit.prevent="handleSubmit" class="signup-form">
        <div class="form-group">
          <label for="email">メールアドレス</label>
          <input
            type="email"
            id="email"
            v-model="form.email"
            required
            :disabled="isLoading"
            placeholder="example@example.com"
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
            placeholder="山田 太郎"
          />
        </div>
        <div class="form-group">
          <label for="password">パスワード</label>
          <input
            type="password"
            id="password"
            v-model="form.password"
            required
            :disabled="isLoading"
            minlength="8"
            placeholder="8文字以上"
          />
        </div>
        <div v-if="error" class="error-message">{{ error }}</div>
        <button type="submit" :disabled="isLoading" class="submit-button">
          {{ isLoading ? '登録中...' : '登録' }}
        </button>
        <div class="login-link">
          <NuxtLink to="/login">既にアカウントをお持ちの方はこちら</NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'guest',
});

const router = useRouter();
const { login } = useAuth();

const form = ref({
  email: '',
  name: '',
  password: '',
});

const isLoading = ref(false);
const error = ref<string | null>(null);

const handleSubmit = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    await $fetch('/api/auth/signup', {
      method: 'POST',
      body: {
        email: form.value.email,
        name: form.value.name,
        password: form.value.password,
      },
    });

    // サインアップAPIで既にCookieにトークンが設定されているので、/api/auth/meでユーザー情報を取得
    const userData = await $fetch('/api/auth/me');
    const { setUser } = useAuth();
    setUser(userData);

    // プロジェクト一覧にリダイレクト
    router.push('/projects');
  } catch (err: any) {
    if (err.data?.statusMessage) {
      error.value = err.data.statusMessage;
    } else if (err.data?.message) {
      error.value = err.data.message;
    } else {
      error.value = '登録に失敗しました';
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.signup-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.signup-form-wrapper {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 30px;
  text-align: center;
}

.signup-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  font-weight: 600;
  color: #555;
  font-size: 14px;
}

input[type='email'],
input[type='text'],
input[type='password'] {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  font-family: inherit;
  transition: border-color 0.3s;
}

input:focus {
  outline: none;
  border-color: #667eea;
}

input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.error-message {
  color: #e53e3e;
  padding: 12px;
  background-color: #fee;
  border-radius: 6px;
  font-size: 14px;
}

.submit-button {
  padding: 12px;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 10px;
}

.submit-button:hover:not(:disabled) {
  background-color: #5a67d8;
}

.submit-button:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}

.login-link {
  text-align: center;
  margin-top: 20px;
}

.login-link a {
  color: #667eea;
  text-decoration: none;
  font-size: 14px;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>

