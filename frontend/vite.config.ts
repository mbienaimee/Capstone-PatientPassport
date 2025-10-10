import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
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
      // Define environment variables for production build
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
        env.VITE_API_BASE_URL || 'https://capstone-patientpassport.onrender.com/api'
      ),
      'import.meta.env.VITE_SOCKET_URL': JSON.stringify(
        env.VITE_SOCKET_URL || 'https://capstone-patientpassport.onrender.com'
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
      proxy: {
        '/api': {
          target: 'https://capstone-patientpassport.onrender.com',
          changeOrigin: true,
          secure: true,
        },
      },
    },
  }
})
