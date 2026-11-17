// Integra JSX y las transformaciones de React en Vite.
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Redirige las llamadas /api al servidor Express local.
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
