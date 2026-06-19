import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    fileParallelism: false,
    hookTimeout: 60_000,
    include: ['tests/visual/**/*.test.ts'],
    maxWorkers: 1,
    minWorkers: 1,
    setupFiles: ['./tests/visual/setup.ts'],
    testTimeout: 60_000,
  },
})
