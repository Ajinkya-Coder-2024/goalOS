import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
    ].filter(Boolean) as any[],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        // Add aliases for jspdf and jspdf-autotable
        'jspdf': path.resolve(__dirname, 'node_modules/jspdf/dist/jspdf.es.js'),
      },
    },
    define: {
      // Fix for jspdf
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
      'process.env.DEBUG': 'false',
    },
    optimizeDeps: {
      include: ['jspdf'],
      esbuildOptions: {
        // Enable esbuild polyfill for Node.js globals
        define: {
          global: 'globalThis',
        },
      },
    },
    build: {
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        // Make sure to mark jspdf as external
        external: ['jspdf'],
      },
    },
  };
});
