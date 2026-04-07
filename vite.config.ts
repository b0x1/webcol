import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const ReactCompilerConfig = {
  target: '19',
};

export default defineConfig({
  plugins: [
    react({
      // @ts-expect-error - react-compiler is supported via babel but types might be outdated
      babel: {
        plugins: [['babel-plugin-react-compiler', ReactCompilerConfig]],
      },
    }),
    tailwindcss(),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  base: "/webcol/",  // GitHub repo name as base URL.
  preview: { port: 4173 },
  server: { port: 4173 },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    chunkSizeWarningLimit: 2500
  },
});
