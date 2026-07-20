import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { loadEnv } from 'vite'
import { fileURLToPath, URL } from 'node:url'

const getEnvValue = (env: Record<string, string>, key: string) => process.env[key] ?? env[key]

const getFirstEnvValue = (env: Record<string, string>, keys: string[]) => {
  for (const key of keys) {
    const value = getEnvValue(env, key)

    if (value) {
      return value
    }
  }

  return undefined
}

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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const sentryAuthToken = getFirstEnvValue(env, ['SENTRY_AUTH_TOKEN'])
  const sentryOrg = getFirstEnvValue(env, ['SENTRY_ORG'])
  const sentryProject = getFirstEnvValue(env, ['SENTRY_PROJECT'])
  const sentryReleaseName =
    getFirstEnvValue(env, ['SENTRY_RELEASE']) ?? process.env.RENDER_GIT_COMMIT
  const shouldUploadSentrySourceMaps = Boolean(sentryAuthToken && sentryOrg && sentryProject)

  return {
    cacheDir: getEnvValue(env, 'VITE_CACHE_DIR') ?? 'node_modules/.vite',
    plugins: [
      react(),
      ...(shouldUploadSentrySourceMaps
        ? [
            sentryVitePlugin({
              authToken: sentryAuthToken,
              org: sentryOrg,
              project: sentryProject,
              ...(sentryReleaseName ? { release: { name: sentryReleaseName } } : {}),
              sourcemaps: {
                filesToDeleteAfterUpload: ['./dist/**/*.map'],
              },
              telemetry: false,
            }),
          ]
        : []),
    ],
    build: {
      sourcemap: shouldUploadSentrySourceMaps ? 'hidden' : false,
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
      env: {
        VITE_APP_DATA_SOURCE: 'mock',
      },
      exclude: ['**/node_modules/**', '**/dist/**', '**/src/test/e2e/**'],
      globals: true,
      setupFiles: './src/test/setup.ts',
    },
  }
})
