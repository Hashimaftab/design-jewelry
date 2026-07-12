import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiOrigin = env.VITE_API_ORIGIN || 'http://localhost:3000';

  const uploadsProxy = {
    '/uploads': {
      target: apiOrigin,
      changeOrigin: true,
    },
  };

  return {
    plugins: [react()],
    server: {
      proxy: uploadsProxy,
    },
    preview: {
      proxy: uploadsProxy,
    },
  };
});
