import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// VITE_BASE_PATH lets staging build to /flora-collector/staging/ without
// affecting production. Defaults to the production GitHub Pages subpath.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.VITE_BASE_PATH || '/flora-collector/',
})
