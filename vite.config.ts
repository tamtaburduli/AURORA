import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' produces relative asset paths, so the built site works at
// https://<user>.github.io/<repo>/ without knowing the repository name.
// Routing uses HashRouter, so no server-side rewrites are needed.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          katex: ['katex'],
          motion: ['framer-motion'],
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
} as any);
