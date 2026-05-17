/**
 * Vite Configuration with Code Splitting and Performance Optimization
 * Optimizes bundle size, caching, and asset loading
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@types': path.resolve(__dirname, './src/types'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },

  build: {
    // Target modern browsers
    target: 'esnext',

    // Output directory
    outDir: 'build',

    // Source maps for production (can be disabled for smaller bundle)
    sourcemap: false,

    // Minify CSS and JS
    minify: 'terser',

    // Terser configuration for better compression
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
        pure_funcs: ['console.log', 'console.info'],
      },
      format: {
        comments: false, // Remove comments
      },
    },

    // Code splitting configuration
    rollupOptions: {
      output: {
        // Split vendor code into separate chunk
        manualChunks: {
          // React core libraries
          'react-vendor': [
            'react',
            'react-dom',
            'react-router-dom',
          ],

          // UI libraries
          'ui-vendor': [
            // Add any UI library dependencies here
          ],

          // Utilities
          'utils-vendor': [
            // Add utility library dependencies here
          ],

          // Large dependencies that benefit from separate chunking
          'charts': [
            // Add chart library if used
          ],

          'forms': [
            // Add form library if used
          ],
        },

        // Custom chunk naming pattern for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()
            : 'chunk';

          return `chunks/[name].[hash].js`;
        },

        // Asset naming pattern
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];

          if (/png|jpe?g|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name].[hash][extname]`;
          } else if (/woff|woff2|ttf|otf|eot/.test(ext)) {
            return `fonts/[name].[hash][extname]`;
          } else if (ext === 'css') {
            return `styles/[name].[hash][extname]`;
          } else {
            return `[name].[hash][extname]`;
          }
        },

        // Optimize main entry point naming
        entryFileNames: `js/[name].[hash].js`,
      },
    },

    // Compression threshold (bytes)
    reportCompressedSize: true,

    // Chunk size warning threshold (KB)
    chunkSizeWarningLimit: 500,
  },

  server: {
    // Development server configuration
    port: 3000,
    strictPort: false,
    host: true,

    // API proxy for development
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },

    // HMR configuration for hot module replacement
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
  },

  // Optimization configuration
  optimizeDeps: {
    // Pre-bundle these dependencies for faster loading
    include: [
      'react',
      'react-dom',
      'react-router-dom',
    ],

    // Exclude from pre-bundling if needed
    exclude: [],
  },

  // CSS configuration
  css: {
    postcss: {
      plugins: [
        {
          postcssPlugin: 'internal:charset-removal',
          AtRule: {
            charset: (atRule) => {
              if (atRule.name === 'charset') {
                atRule.remove();
              }
            },
          },
        },
      ],
    },
  },

  preview: {
    // Preview server configuration
    port: 4173,
    strictPort: false,
    host: true,
  },
});
