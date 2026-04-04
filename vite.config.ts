import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Replace 'colonization' with your actual GitHub repository name
export default defineConfig({
  plugins: [react()],
  base: "/webcol/",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    chunkSizeWarningLimit: 2500
  },
});
