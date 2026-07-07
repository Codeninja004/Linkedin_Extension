import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/**
 * Content script build.
 * Content scripts registered via manifest.json's "content_scripts" are
 * always executed as classic (non-module) scripts, so this must be a
 * single self-contained IIFE bundle. Tailwind CSS for the injected sidebar
 * is imported with the `?inline` query and injected into a Shadow DOM at
 * runtime (see src/content/mount.ts), so no separate CSS asset is emitted.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  // Library-mode builds don't get Vite's usual automatic
  // process.env.NODE_ENV replacement, and React reads that at import time —
  // without this define, the content script throws "process is not defined"
  // immediately on injection into a real page.
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    cssCodeSplit: false,
    lib: {
      entry: path.resolve(__dirname, 'src/content/index.tsx'),
      formats: ['iife'],
      name: 'LinkedInCRMContentScript',
      fileName: () => 'content.js',
    },
    rollupOptions: {
      output: {
        entryFileNames: 'content.js',
        extend: true,
      },
    },
  },
});
