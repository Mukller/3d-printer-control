import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    proxy: {
      '/upload': 'http://localhost:3001',
      '/print': 'http://localhost:3001',
      '/printer': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
    },
  },
})
