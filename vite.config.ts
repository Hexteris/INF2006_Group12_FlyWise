/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// NODE_ENV is set to 'production' by the `build` script in package.json rather
// than here. Two separate consumers need it and neither can be reached from this
// config: React picks its development or production implementation at runtime
// from process.env.NODE_ENV, and @vitejs/plugin-react-swc chooses between the
// JSX production transform and jsxDEV before any config hook runs. With it
// unset, `vite build` on this project emitted 354 kB including React's
// development build and dev-only warning machinery, against 156 kB with it set.
export default defineConfig({
  plugins: [react()],

  test: {
    globals: true,
    // Every test is server-side (config, etl, db). There are no DOM tests, so
    // there is no jsdom/happy-dom environment to configure.
    environment: 'node',
  },

  server: {
    // Dev-only. In production src/server.ts serves the built client from the
    // same origin on port 8000, so this proxy is not in the production path.
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },

  build: {
    // Must stay in step with CLIENT_DIR in src/server.ts.
    outDir: 'dist/client',
    emptyOutDir: true,
  },
});
