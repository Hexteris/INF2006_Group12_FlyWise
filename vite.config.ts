/// <reference types="vitest" />

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],

  test: {
    globals: true,
    environment: 'node',
  },

  server: {
    port: 3000,

    proxy: {
      '/airlines': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },

      '/airports': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },

      '/routes': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },

      '/flights': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },

      '/analytics': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },

      '/prediction-data': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },

      '/predict': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
  },
});
