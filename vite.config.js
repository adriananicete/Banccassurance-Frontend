import { fileURLToPath, URL } from 'node:url'

import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // The backend's CORS allowlist is CLIENT_URL, which defaults to
  // http://localhost:3000. Vite's own default of 5173 is not on it, so every
  // request fails before it reaches a route. strictPort makes that loud: we
  // want a failed start, not a silent shift to 3001 that fails on the first
  // fetch instead. See context/PROJECT.md section 3.
  server: {
    port: 3000,
    strictPort: true,
  },
})
