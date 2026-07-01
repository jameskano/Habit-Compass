import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

const manualVendorChunks = (moduleId: string) => {
  const id = moduleId.replaceAll('\\', '/')

  if (!id.includes('/node_modules/')) {
    return undefined
  }

  if (
    id.includes('/node_modules/react/') ||
    id.includes('/node_modules/react-dom/') ||
    id.includes('/node_modules/scheduler/')
  ) {
    return 'vendor-react'
  }

  if (id.includes('/node_modules/@tanstack/')) {
    return 'vendor-tanstack'
  }

  if (
    id.includes('/node_modules/react-intl/') ||
    id.includes('/node_modules/@formatjs/') ||
    id.includes('/node_modules/intl-messageformat/')
  ) {
    return 'vendor-intl'
  }

  if (id.includes('/node_modules/@dnd-kit/')) {
    return 'vendor-dnd'
  }

  if (id.includes('/node_modules/zod/')) {
    return 'vendor-validation'
  }

  if (id.includes('/node_modules/@sentry/')) {
    return 'vendor-sentry'
  }

  if (id.includes('/node_modules/@supabase/')) {
    return 'vendor-supabase'
  }

  return undefined
}

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: manualVendorChunks,
      },
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    open: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    exclude: ['**/node_modules/**', '**/dist/**', '**/src/test/e2e/**'],
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
