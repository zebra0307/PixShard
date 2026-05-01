import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000', // Use IPv4 explicitly — 'localhost' resolves to ::1 on Windows (Node 17+) causing 502
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
