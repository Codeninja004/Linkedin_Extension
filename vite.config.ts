import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/**
 * Main build: popup.html and dashboard.html as a classic multi-page app.
 * Background and content scripts are built separately (see
 * vite.config.background.ts / vite.config.content.ts) because they need
 * different output formats (ES module vs. classic IIFE script).
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, 'popup.html'),
        dashboard: path.resolve(__dirname, 'dashboard.html'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
