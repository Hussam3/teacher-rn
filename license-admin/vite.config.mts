import { defineConfig } from 'vite';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root,
  plugins: [react()],
  server: {
    host: true,
    port: 5175,
    strictPort: true,
  },
  build: {
    outDir: '../dist-license-admin',
    emptyOutDir: true,
  },
});
