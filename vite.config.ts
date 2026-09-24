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

  server: {
    // Dev-only. In production FastAPI serves the built client from the
    // same origin on port 8000, so this proxy is not in the production path.
    port: 3000,
    proxy: {
      '/health': 'http://localhost:8000',
      '/summary': 'http://localhost:8000',
      '/airlines': 'http://localhost:8000',
      '/airports': 'http://localhost:8000',
      '/predict': 'http://localhost:8000',
      '/live-flights': 'http://localhost:8000',
      '/legacy': 'http://localhost:8000',
      '/routes': 'http://localhost:8000',
      '/flights': 'http://localhost:8000',
      '/analytics': 'http://localhost:8000',
      '/prediction-data': 'http://localhost:8000',
    },
  },

  build: {
    // Must stay in step with the FastAPI StaticFiles mount point.
    outDir: 'dist/client',
    emptyOutDir: true,
  },
});
