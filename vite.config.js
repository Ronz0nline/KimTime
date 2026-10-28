import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        exchange: resolve(__dirname, 'care-exchange.html'),
        passbook: resolve(__dirname, 'passbook.html'),
        sos: resolve(__dirname, 'emergency-sos.html'),
        dossier: resolve(__dirname, 'dossier.html'),
        auth: resolve(__dirname, 'auth.html'),
      },
    },
  },
});
