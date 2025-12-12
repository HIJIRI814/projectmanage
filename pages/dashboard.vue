<template>
  <div class="dashboard-container">
    <div class="dashboard-card">
      <h1>ダッシュボード</h1>
      <div v-if="user" class="user-info">
        <div class="info-item">
          <span class="label">ID:</span>
          <span class="value">{{ user.id }}</span>
        </div>
        <div class="info-item">
          <span class="label">メールアドレス:</span>
          <span class="value">{{ user.email }}</span>
        </div>
        <div class="info-item">
          <span class="label">名前:</span>
          <span class="value">{{ user.name }}</span>
        </div>
      </div>
      <button @click="handleLogout" class="logout-button">ログアウト</button>
    </div>
  </div>
</template>

<script setup lang="ts">
// 認証必須ページとしてmiddlewareを適用
definePageMeta({
  middleware: 'auth',
});

const router = useRouter();
const { user, logout } = useAuth();

const handleLogout = () => {
  logout();
  router.push('/login');
};
</script>

<style scoped>
.dashboard-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.dashboard-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 28px;
}

.user-info {
  margin-bottom: 30px;
}

.info-item {
  display: flex;
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.info-item:last-child {
  border-bottom: none;
}

.label {
  font-weight: 600;
  color: #555;
  width: 150px;
  flex-shrink: 0;
}

.value {
  color: #333;
  word-break: break-all;
}

.logout-button {
  width: 100%;
  padding: 12px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.3s;
}

.logout-button:hover {
  opacity: 0.9;
}
</style>

