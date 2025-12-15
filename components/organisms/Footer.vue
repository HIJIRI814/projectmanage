<template>
  <footer class="border-t bg-background">
    <div class="container flex h-14 items-center justify-center text-sm text-muted-foreground">
      <p>&copy; {{ currentYear }} Project Manager. All rights reserved.</p>
    </div>
  </footer>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

