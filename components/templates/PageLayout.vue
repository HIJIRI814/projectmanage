<template>
  <div class="min-h-screen flex flex-col">
    <Header />
    <main class="flex-1">
      <slot />
    </main>
    <Footer v-if="showFooter" />
  </div>
</template>

<script setup lang="ts">
import Header from '~/components/organisms/Header.vue'
import Footer from '~/components/organisms/Footer.vue'

interface Props {
  showFooter?: boolean
}

withDefaults(defineProps<Props>(), {
  showFooter: true,
})
</script>

