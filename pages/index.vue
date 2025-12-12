<template>
  <div class="redirect-container">
    <p>リダイレクト中...</p>
  </div>
</template>

<script setup lang="ts">
// クライアントサイドでのみリダイレクト
onMounted(async () => {
  await navigateTo('/login');
});
</script>

<style scoped>
.redirect-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  font-size: 18px;
}
</style>

