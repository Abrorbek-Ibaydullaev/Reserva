import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const syncLocales = () => ({
  name: 'sync-locales',
  buildStart() {
    fs.copySync(
      path.resolve(__dirname, '../shared/locales'),
      path.resolve(__dirname, 'public/locales')
    );
  },
  configureServer(server) {
    fs.copySync(
      path.resolve(__dirname, '../shared/locales'),
      path.resolve(__dirname, 'public/locales')
    );
    // Watch shared/locales for changes and re-copy
    server.watcher.add(path.resolve(__dirname, '../shared/locales'));
    server.watcher.on('change', (file) => {
      if (file.includes('shared/locales')) {
        fs.copySync(
          path.resolve(__dirname, '../shared/locales'),
          path.resolve(__dirname, 'public/locales')
        );
      }
    });
  },
});

export default defineConfig({
  plugins: [
    react(),
    syncLocales(),
  ],
});
