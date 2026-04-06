import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            if (id.includes('lucide-react')) {
              return 'ui-vendor';
            }
            if (id.includes('@stripe')) {
              return 'stripe';
            }
            if (id.includes('hls.js')) {
              return 'video';
            }
            return 'vendor';
          }
          if (id.includes('/pages/pricing/')) {
            return 'pricing-pages';
          }
          if (id.includes('/pages/support/')) {
            return 'support-pages';
          }
          if (id.includes('/pages/client/')) {
            return 'client-pages';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
    cssCodeSplit: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2,
      },
      mangle: {
        safari10: true,
      },
    },
    reportCompressedSize: true,
    sourcemap: false,
  },
  server: {
    headers: {
      'Cache-Control': 'public, max-age=31536000',
    },
  },
});