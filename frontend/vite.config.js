// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  base: '/student-dashboard-incompletecourse/', 
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)), // ← 這行是重點
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        // 你這裡的 rewrite 等於沒改路徑，其實可以拿掉或保留都行
        // rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
})
