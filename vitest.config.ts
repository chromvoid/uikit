import {defineConfig} from 'vitest/config'

const nodeWebStorageArgs = process.allowedNodeEnvironmentFlags.has('--no-experimental-webstorage')
  ? ['--no-experimental-webstorage']
  : []

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    execArgv: nodeWebStorageArgs,
  },
})
