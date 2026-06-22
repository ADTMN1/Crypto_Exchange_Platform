import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const backendUrl = process.env.VITE_API_BASE_URL || 'https://crypto-exchange-platform-1.onrender.com'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: backendUrl,
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
