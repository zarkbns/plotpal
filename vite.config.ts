import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { hydraApiPlugin } from './src/hydraApiMiddleware';

export default defineConfig({
  plugins: [react(), hydraApiPlugin()],
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
    host: '0.0.0.0'
  }
});
