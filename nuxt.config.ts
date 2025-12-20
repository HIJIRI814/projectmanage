import { fileURLToPath } from 'url';
import { resolve } from 'path';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  vite: {
    resolve: {
      alias: {
        '~domain': resolve(fileURLToPath(new URL('./domain', import.meta.url))),
        '~application': resolve(fileURLToPath(new URL('./application', import.meta.url))),
        '~infrastructure': resolve(fileURLToPath(new URL('./infrastructure', import.meta.url))),
      },
    },
  },
  nitro: {
    alias: {
      '~domain': resolve(fileURLToPath(new URL('./domain', import.meta.url))),
      '~application': resolve(fileURLToPath(new URL('./application', import.meta.url))),
      '~infrastructure': resolve(fileURLToPath(new URL('./infrastructure', import.meta.url))),
    },
  },
})
