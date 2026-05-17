/**
 * Bundle Visualization Configuration
 * Analyzes and visualizes bundle size and composition
 * Run with: npm run build && npm run analyze
 */

import { defineConfig } from 'rollup';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    visualizer({
      // Output file name
      filename: 'build/bundle-analysis.html',

      // Include open in default browser
      open: true,

      // Show treemap visualization
      template: 'treemap',

      // Generate gzipped bundle sizes
      gzipSize: true,

      // Generate brotli bundle sizes
      brotliSize: true,

      // Exclude specific modules
      exclude: [],

      // Include dynamic imports
      sourcemap: true,

      // Show individual file sizes
      detail: true,
    }),
  ],
});

/**
 * Bundle Analysis Guide
 *
 * 1. Run build and analysis:
 *    npm run build
 *    npx rollup -c vite-plugin-visualizer.config.ts -i build/manifest.json
 *
 * 2. View the generated HTML file: build/bundle-analysis.html
 *
 * 3. Interpret the visualization:
 *    - Box size represents file size
 *    - Color represents bundle (red=vendor, blue=app, etc.)
 *    - Larger boxes = opportunities for optimization
 *
 * 4. Optimization strategies:
 *    - Move large dependencies to lazy-loaded chunks
 *    - Remove unused dependencies
 *    - Enable tree-shaking
 *    - Use dynamic imports for heavy modules
 *    - Consider code splitting for routes/features
 *
 * 5. Target bundle sizes:
 *    - Main bundle: < 200KB (gzipped < 60KB)
 *    - Vendor bundle: < 300KB (gzipped < 80KB)
 *    - Individual chunks: < 250KB (gzipped < 70KB)
 */

/**
 * Alternative: Using webpack-bundle-analyzer
 *
 * For projects using webpack, install and configure:
 * npm install --save-dev webpack-bundle-analyzer
 *
 * Then add to webpack config:
 *
 * const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
 *
 * plugins: [
 *   new BundleAnalyzerPlugin({
 *     analyzerMode: 'static',
 *     openAnalyzer: true,
 *     reportFilename: 'bundle-report.html',
 *     generateStatsFile: true,
 *     statsFilename: 'bundle-stats.json',
 *   }),
 * ]
 */
