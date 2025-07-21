import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('vue-')
        }
      }
    })
  ],
  resolve: {
    alias: {
      'vue': '@vue/runtime-dom'
    }
  },
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      // Handle /api/v1 paths
      '/api/v1': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/v1/, '/api/v1')
      },
      // Also handle /v1 for backward compatibility
      '/v1': {
        target: 'http://localhost:8000/api/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/v1/, '/api/v1'),
        secure: false
      }
    }
  }
})
