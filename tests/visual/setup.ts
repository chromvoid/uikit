import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {chromium, type Browser, type BrowserContext, type Page} from 'playwright'
import {createServer, type ViteDevServer} from 'vite'
import {afterAll, afterEach, beforeAll, beforeEach} from 'vitest'

import {UIKIT_VISUAL_ARTIFACT_ROOT} from './support/visual-snapshot'
import {writeUikitVisualReviewIndex} from './support/write-review-index'

declare global {
  // eslint-disable-next-line no-var
  var __UIKIT_VISUAL_BASE_URL__: string
  // eslint-disable-next-line no-var
  var __UIKIT_VISUAL_PAGE__: Page
}

const dirname = path.dirname(fileURLToPath(import.meta.url))
const harnessRoot = path.resolve(dirname, 'harness')
const packageRoot = path.resolve(dirname, '../..')
const repoRoot = path.resolve(packageRoot, '../..')

let server: ViteDevServer
let browser: Browser
let context: BrowserContext

beforeAll(async () => {
  server = await createServer({
    configFile: false,
    logLevel: 'error',
    root: harnessRoot,
    server: {
      fs: {
        allow: [packageRoot, repoRoot],
      },
      host: '127.0.0.1',
      port: Number(process.env.UIKIT_VISUAL_PORT ?? 4527),
      strictPort: false,
    },
  })
  await server.listen()

  const urls = server.resolvedUrls?.local ?? []
  globalThis.__UIKIT_VISUAL_BASE_URL__ = urls[0] ?? 'http://127.0.0.1:4527/'

  browser = await chromium.launch({
    headless: process.env.UIKIT_VISUAL_HEADED !== '1',
  })
})

beforeEach(async () => {
  context = await browser.newContext({
    colorScheme: 'dark',
    deviceScaleFactor: 1,
    locale: 'en-US',
    reducedMotion: 'reduce',
  })
  globalThis.__UIKIT_VISUAL_PAGE__ = await context.newPage()
})

afterEach(async () => {
  await context?.close()
})

afterAll(async () => {
  writeUikitVisualReviewIndex(UIKIT_VISUAL_ARTIFACT_ROOT)
  await browser?.close()
  await server?.close()
})
