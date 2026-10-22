import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Vite 5.4.12+ rejects requests whose Host header is not allowed.
  // Extra hostnames (e.g. a LAN name or a tunnel domain, '.example.com' for
  // all subdomains) can be added as a comma-separated VITE_ALLOWED_HOSTS.
  const allowedHosts = [
    'localhost',
    '127.0.0.1',
    ...(env.VITE_ALLOWED_HOSTS || '')
      .split(',')
      .map((host) => host.trim())
      .filter(Boolean),
  ]

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0', // Expose on all IPv4 interfaces (reachable from WSL2 hosts and the LAN)
      port: 3000,
      allowedHosts,
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
      allowedHosts,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
  }
})
