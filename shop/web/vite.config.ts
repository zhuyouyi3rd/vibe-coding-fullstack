import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          icons: ['lucide-react'],
        },
      },
    },
  },
  server: {
    port: 5284,
    strictPort: true,
    watch: { ignored: ['**/.*.tmpdir/**', '**/*.tmpdir/**'] },
    proxy: {
      '/api': { target: 'http://127.0.0.1:4201', changeOrigin: true },
    },
  },
});
