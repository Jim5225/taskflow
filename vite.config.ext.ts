import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Use relative base path for Chrome Extension
  base: './',
  build: {
    // Output to a separate directory to avoid conflicting with the web build
    outDir: 'dist-ext',
    emptyOutDir: true,
  },
  define: {
    // Define an environment variable so the app knows it's running as an extension
    'import.meta.env.VITE_IS_EXT': JSON.stringify(true),
  }
});
