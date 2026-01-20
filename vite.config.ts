import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // REQUIRED for GitHub Pages project sites
  base: '/In-Browser-Art-Gallery/',

  build: {
    outDir: 'dist',
    sourcemap: false,
  },

  server: {
    open: true,
  },

  preview: {
    port: 4173,
  },
})
