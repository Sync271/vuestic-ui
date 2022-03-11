import { defineNuxtConfig } from 'nuxt3'
import { resolve } from 'path'

// https://v3.nuxtjs.org/docs/directory-structure/nuxt.config
export default defineNuxtConfig({
  build: {
    // transpile: ['vue-i18n', 'vue-class-component', 'colortranslator'],
  },
  buildModules: [
    '~/modules/i18n'
  ],
  meta: {
    link: [
      { href: 'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:ital,wght@0,400;1,700&display=swap', rel: 'stylesheet' },
      { href: 'https://fonts.googleapis.com/icon?family=Material+Icons', rel: 'stylesheet' },
      { href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css', rel: 'stylesheet' }
    ],
    script: [
      { src: 'https://kit.fontawesome.com/5460c87b2a.js', crossorigin: 'anonymous' }
    ]
  },
  vite: {
    define: {
      __VUE_I18N_FULL_INSTALL__: true,
      __VUE_I18N_LEGACY_API__: false,
      __VUE_I18N_PROD_DEVTOOLS__: false
    },
    resolve: {
      alias: [
        { find: /^~(.*)$/, replacement: '$1' },
      ],
    },
    build: {
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    }
  },
  alias: {
    'vuestic-ui/styles': resolve(__dirname, '../ui/src/styles'),
    'vuestic-ui': resolve(__dirname, '../ui/src/main'),
  }
})
