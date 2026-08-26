import react from '@vitejs/plugin-react-swc'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react()],
  publicDir: false,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('../src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('/node_modules/recharts/') ||
            id.includes('/node_modules/d3-')
          ) {
            return 'charts'
          }
          if (id.includes('/node_modules/@mui/icons-material/')) {
            return 'mui-icons'
          }
          if (
            id.includes('/node_modules/@mui/') ||
            id.includes('/node_modules/@emotion/') ||
            id.includes('/node_modules/@floating-ui/')
          ) {
            return 'mui'
          }
          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/react-router')
          ) {
            return 'react'
          }
        },
      },
    },
  },
})
