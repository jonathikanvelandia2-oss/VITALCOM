import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'dist', 'prisma'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**/*.{ts,tsx}'],
      exclude: [
        'src/lib/**/*.test.{ts,tsx}',
        'src/lib/**/*.spec.{ts,tsx}',
        'src/lib/db/**',
        'src/lib/integrations/**',
      ],
    },
  },
})
