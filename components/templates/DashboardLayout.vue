<template>
  <div class="min-h-screen flex flex-col">
    <Header />
    <div class="flex flex-1">
      <Sidebar :is-open="sidebarOpen" />
      <main
        :class="cn(
          'flex-1 transition-all duration-300',
          'md:ml-64',
          sidebarOpen ? 'ml-64' : 'ml-0'
        )"
      >
        <div class="container px-4 md:px-6 py-6">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { cn } from '~/lib/utils'
import Header from '~/components/organisms/Header.vue'
import Sidebar from '~/components/organisms/Sidebar.vue'

const sidebarOpen = ref(true)
</script>

