import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    // 确保 CommonJS 模块能被正确处理
    mainFields: ['module', 'jsnext:main', 'jsnext']
  },
  optimizeDeps: {
    // 预构建 CommonJS 模块
    include: ['china-area-data']
  },
  build: {
    // 确保构建时能正确处理 CommonJS 模块
    commonjsOptions: {
      include: [/node_modules/]
    }
  }
})
