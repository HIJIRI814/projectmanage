<template>
  <div class="login-container">
    <div class="login-card">
      <h1>ログイン</h1>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">メールアドレス</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="example@email.com"
            required
            :disabled="isLoading"
          />
        </div>
        <div class="form-group">
          <label for="password">パスワード</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="パスワードを入力"
            required
            :disabled="isLoading"
          />
        </div>
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        <button type="submit" :disabled="isLoading" class="login-button">
          {{ isLoading ? 'ログイン中...' : 'ログイン' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
// ゲスト専用ページとしてmiddlewareを適用
definePageMeta({
  middleware: 'guest',
});

const router = useRouter();
const { login, isLoading, error } = useAuth();

const email = ref('');
const password = ref('');

const handleLogin = async () => {
  try {
    await login(email.value, password.value);
    await router.push('/projects');
  } catch (err) {
    // エラーはストアで管理されているので、ここでは何もしない
    console.error('Login error:', err);
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 28px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s;
  box-sizing: border-box;
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
  background-color: #fee;
  color: #c33;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
}

.login-button {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.3s;
}

.login-button:hover:not(:disabled) {
  opacity: 0.9;
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

