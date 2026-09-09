import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2020',
    sourcemap: true,
    // Split the Supabase SDK into its own chunk so the main bundle
    // (parsed on every page view) stays small.
    rollupOptions: {
      output: {
        manualChunks: {
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  },
  server: {
    port: 5173
  }
});
