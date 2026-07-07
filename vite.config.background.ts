import { defineConfig } from 'vite';
import path from 'node:path';

/**
 * Background service worker build.
 * MV3 allows "type": "module" for the service worker, so we can emit a
 * single ES module file and keep top-level static imports.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  // Defensive: library-mode builds skip Vite's usual automatic
  // process.env.NODE_ENV replacement (see vite.config.content.ts for where
  // this actually bit us).
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, 'src/background/index.ts'),
      formats: ['es'],
      fileName: () => 'background.js',
    },
    rollupOptions: {
      output: {
        entryFileNames: 'background.js',
      },
    },
  },
});
