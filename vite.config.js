import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './'  -> GitHub Pages alt klasorunde (/7ler_Demo/) calisabilmesi icin sart.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { host: true, port: 5173 }
})
