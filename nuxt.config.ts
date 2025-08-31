// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/icon', 'nuxt-auth-utils'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    uploadFolder: './uploads',
    public:
    {
      uploadLimits: {
        maxFileSize: 1024 * 1024, // 1MB
        maxFileCount: 4,
        maxAltLength: 2000
      },
  },
    session: {
      password: '',
      cookie: {
        secure: false
      }
    }
  },
  nitro: {
    experimental: {
      tasks: true
    },
    scheduledTasks: {
      '*/1 * * * *': ['postbsky'],
    }
  },
  app: {
    head: {
      title: 'Bsky Planner',
      htmlAttrs: {
        lang: 'en',
      },
      link: [
        { rel: 'icon', type: 'images/png', href: '/favicon.png' },
      ]
    }
  }
})