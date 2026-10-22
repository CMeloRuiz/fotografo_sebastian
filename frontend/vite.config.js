import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    // El backend corre aparte en desarrollo; el proxy evita tocar CORS aqui
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_TARGET || 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },

  build: {
    target: 'es2020',
    cssCodeSplit: true,
    // Las fotos ya vienen optimizadas desde /public: nada debe pasar a base64
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        manualChunks: {
          // React y el router cambian poco: en su propio trozo se cachean
          // entre despliegues en lugar de volver a descargarse enteros.
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
