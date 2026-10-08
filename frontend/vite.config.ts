import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // o front chama /api e o Vite repassa para o backend (evita CORS em desenvolvimento)
  const backend = env.VITE_API_PROXY || 'http://localhost:3333'
  const proxy = { '/api': { target: backend, changeOrigin: true } }

  return {
    plugins: [react()],
    server: { proxy },
    preview: { proxy },
  }
})
