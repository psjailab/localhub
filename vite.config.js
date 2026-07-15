import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite' // 1. 플러그인 불러오기

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(), // 2. 플러그인 등록
  ],
})