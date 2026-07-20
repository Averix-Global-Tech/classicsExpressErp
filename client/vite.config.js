import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev proxy → backend so HTTP-only auth cookies share an origin in development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
});
