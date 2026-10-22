import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0', // Expose on all network interfaces
    port: 3000,
    // Vite 5.4.12+ requires explicit allowedHosts configuration
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'wsl.ymbihq.local',
      '.ymbihq.local',  // Wildcard for all subdomains
      '.i40sys.com',    // Wildcard for all subdomains
      '.local',         // All .local domains
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'wsl.ymbihq.local',
      '.ymbihq.local',
      '.i40sys.com',
      '.local',
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
