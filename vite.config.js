import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Root base ('/') is correct for a Cloudflare Pages project served at the apex.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
