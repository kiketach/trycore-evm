/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The browser calls /api/... on the dev server, which forwards to FastAPI. Same origin for
// the browser, so the backend needs no CORS configuration.
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000'
const API_PREFIX = '/api'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      [API_PREFIX]: {
        target: BACKEND_URL,
        changeOrigin: true,
        rewrite: (path) => path.slice(API_PREFIX.length),
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
