import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
        env.VITE_API_BASE_URL || 'https://patientpassport-api.azurewebsites.net/api'
      ),
      'import.meta.env.VITE_SOCKET_URL': JSON.stringify(
        env.VITE_SOCKET_URL || 'https://patientpassport-api.azurewebsites.net'
      ),
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
          },
        },
      },
    },
    server: {
      port: 3000,
      host: true,
      headers: {
        'X-Frame-Options': 'SAMEORIGIN',
        'Content-Security-Policy': "frame-ancestors 'self' http://localhost:* https://localhost:*",
      },
      proxy: {
        '/api': {
          target: 'https://patientpassport-api.azurewebsites.net',
          changeOrigin: true,
          secure: true,
        },
      },
    },
  }
})
