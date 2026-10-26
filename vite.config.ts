import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { loadApprovedAndroidApk } from './scripts/ks-android-release.mjs';
import { loadApprovedAndroidApk as loadImageTestApk } from './scripts/ks-android-image-test-release.mjs';

export default defineConfig({
  plugins: [react(), {
    name: 'approved-android-installer',
    apply: 'build',
    async generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'downloads/KristalStreams.apk', source: await loadApprovedAndroidApk() });
      this.emitFile({ type: 'asset', fileName: 'downloads/KristalStreams-Test.apk', source: await loadImageTestApk() });
    },
  }],
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
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
