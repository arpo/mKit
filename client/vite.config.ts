import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy API requests starting with /api to the backend server
      '/api': {
        target: 'http://localhost:3000', // Your backend server address
        changeOrigin: true, // Needed for virtual hosted sites
        // Optionally rewrite path: remove /api prefix before forwarding
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
