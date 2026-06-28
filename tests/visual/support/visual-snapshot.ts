import fs from 'node:fs'
import {createRequire} from 'node:module'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {diff} from '@blazediff/core'
import type {Page} from 'playwright'

const require = createRequire(import.meta.url)
const {PNG} = require('pngjs') as {
  PNG: {
    sync: {
      read(buffer: Buffer): {data: Buffer; width: number; height: number}
      write(image: {data: Buffer; width: number; height: number}): Buffer
    }
  }
}

export type VisualSnapshotMetadata = Record<string, unknown>

type VisualSnapshotOptions = {
  suite: string
  baselineRoot: string
  artifactRoot: string
  viewport?: {width: number; height: number}
  clipSelector?: string
  fullPage?: boolean
  threshold?: number
  maxDiffRatio?: number
  auditMode?: boolean
  updateMode?: boolean
  metadata?: VisualSnapshotMetadata
}

type ClipRect = {
  x: number
  y: number
  width: number
  height: number
}

const dirname = path.dirname(fileURLToPath(import.meta.url))
const VISUAL_ROOT = path.resolve(dirname, '..')
export const UIKIT_VISUAL_BASELINE_ROOT = path.join(VISUAL_ROOT, '__visual-baselines__')
export const UIKIT_VISUAL_ARTIFACT_ROOT = path.resolve(dirname, '../../../.artifacts/visual')

export type UikitVisualSnapshotOptions = Omit<
  VisualSnapshotOptions,
  'artifactRoot' | 'baselineRoot'
> & {
  metadata?: VisualSnapshotMetadata
}

function sanitizeSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function waitForStableVisualState(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-delay: 0s !important;
        animation-duration: 0s !important;
        transition-delay: 0s !important;
        transition-duration: 0s !important;
        caret-color: transparent !important;
      }
    `,
  })
  await page.evaluate(async () => {
    await document.fonts?.ready
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  })
}

async function getDeepClip(page: Page, selector: string): Promise<ClipRect> {
  const rect = await page.evaluate((sel) => {
    function deepFind(root: Document | ShadowRoot, selector: string): Element | null {
      const found = root.querySelector(selector)
      if (found) return found
      for (const el of root.querySelectorAll('*')) {
        if (el.shadowRoot) {
          const inner = deepFind(el.shadowRoot, selector)
          if (inner) return inner
        }
      }
      return null
    }

    const element = deepFind(document, sel)
    const bounds = element?.getBoundingClientRect()
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return null

    return {
      x: Math.max(0, Math.floor(bounds.left)),
      y: Math.max(0, Math.floor(bounds.top)),
      width: Math.ceil(bounds.width),
      height: Math.ceil(bounds.height),
    }
  }, selector)

  if (!rect) {
    throw new Error(`visual snapshot clip target not found or empty: ${selector}`)
  }

  return rect
}

function writeArtifactFiles(
  suite: string,
  name: string,
  options: VisualSnapshotOptions,
  actual: Buffer,
  diffPng: Buffer | null,
  metadata: VisualSnapshotMetadata,
): {actualPath: string; diffPath: string | null; metadataPath: string} {
  const artifactDir = path.join(
    options.artifactRoot,
    sanitizeSegment(suite),
    sanitizeSegment(name),
  )
  fs.mkdirSync(artifactDir, {recursive: true})

  const actualPath = path.join(artifactDir, 'actual.png')
  fs.writeFileSync(actualPath, actual)

  const diffPath = diffPng ? path.join(artifactDir, 'diff.png') : null
  if (diffPng && diffPath) {
    fs.writeFileSync(diffPath, diffPng)
  }

  const metadataPath = path.join(artifactDir, 'metadata.json')
  fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`)

  return {actualPath, diffPath, metadataPath}
}

function buildMetadata(
  name: string,
  options: VisualSnapshotOptions,
  extra: VisualSnapshotMetadata,
): VisualSnapshotMetadata {
  return {
    suite: options.suite,
    name,
    viewport: options.viewport ?? null,
    clipSelector: options.clipSelector ?? null,
    fullPage: options.fullPage ?? false,
    threshold: options.threshold ?? 0.12,
    maxDiffRatio: options.maxDiffRatio ?? 0.003,
    auditMode: options.auditMode ?? false,
    updateMode: options.updateMode ?? false,
    ...options.metadata,
    ...extra,
  }
}

function comparePngs(
  expected: Buffer,
  actual: Buffer,
  options: VisualSnapshotOptions,
): {
  expectedPng: {data: Buffer; width: number; height: number}
  actualPng: {data: Buffer; width: number; height: number}
  differentPixels: number | null
  diffRatio: number | null
  diffPng: Buffer | null
} {
  const expectedPng = PNG.sync.read(expected)
  const actualPng = PNG.sync.read(actual)

  if (actualPng.width !== expectedPng.width || actualPng.height !== expectedPng.height) {
    return {expectedPng, actualPng, differentPixels: null, diffRatio: null, diffPng: null}
  }

  const diffData = Buffer.alloc(actualPng.width * actualPng.height * 4)
  const differentPixels = diff(
    expectedPng.data,
    actualPng.data,
    diffData,
    actualPng.width,
    actualPng.height,
    {
      threshold: options.threshold ?? 0.12,
      includeAA: false,
      diffColor: [255, 0, 0],
      aaColor: [255, 255, 0],
    },
  )
  const totalPixels = actualPng.width * actualPng.height
  const diffRatio = differentPixels / totalPixels
  const diffPng =
    differentPixels > 0
      ? PNG.sync.write({data: diffData, width: actualPng.width, height: actualPng.height})
      : null

  return {expectedPng, actualPng, differentPixels, diffRatio, diffPng}
}

async function assertVisualSnapshot(
  page: Page,
  name: string,
  options: VisualSnapshotOptions,
): Promise<void> {
  if (options.viewport) {
    await page.setViewportSize(options.viewport)
  }

  await waitForStableVisualState(page)

  const suite = sanitizeSegment(options.suite)
  const snapshotName = sanitizeSegment(name)
  const baselinePath = path.join(options.baselineRoot, suite, `${snapshotName}.png`)
  const clip = options.clipSelector ? await getDeepClip(page, options.clipSelector) : undefined
  const actual = await page.screenshot({
    animations: 'disabled',
    caret: 'hide',
    clip,
    fullPage: options.fullPage ?? false,
    scale: 'css',
  })

  const baselineExists = fs.existsSync(baselinePath)

  if (!baselineExists) {
    if (options.updateMode) {
      fs.mkdirSync(path.dirname(baselinePath), {recursive: true})
      fs.writeFileSync(baselinePath, actual)
      return
    }

    const metadata = buildMetadata(name, options, {
      status: 'missing-baseline',
      baselinePath,
    })
    const {actualPath, metadataPath} = writeArtifactFiles(
      options.suite,
      name,
      options,
      actual,
      null,
      metadata,
    )

    if (options.auditMode) return

    throw new Error(
      `Missing visual baseline: ${baselinePath}. Actual screenshot written to ${actualPath}. Metadata: ${metadataPath}.`,
    )
  }

  const expected = fs.readFileSync(baselinePath)
  const comparison = comparePngs(expected, actual, options)
  const totalPixels = comparison.actualPng.width * comparison.actualPng.height

  if (
    comparison.actualPng.width !== comparison.expectedPng.width ||
    comparison.actualPng.height !== comparison.expectedPng.height
  ) {
    if (options.updateMode) {
      fs.writeFileSync(baselinePath, actual)
      return
    }

    const metadata = buildMetadata(name, options, {
      status: 'size-mismatch',
      baselinePath,
      expectedSize: {
        width: comparison.expectedPng.width,
        height: comparison.expectedPng.height,
      },
      actualSize: {
        width: comparison.actualPng.width,
        height: comparison.actualPng.height,
      },
    })
    const {actualPath, metadataPath} = writeArtifactFiles(
      options.suite,
      name,
      options,
      actual,
      null,
      metadata,
    )

    if (options.auditMode) return

    throw new Error(
      `Visual baseline size mismatch for ${options.suite}/${name}: expected ${comparison.expectedPng.width}x${comparison.expectedPng.height}, got ${comparison.actualPng.width}x${comparison.actualPng.height}. Actual: ${actualPath}. Metadata: ${metadataPath}.`,
    )
  }

  const diffRatio = comparison.diffRatio ?? 0
  const differentPixels = comparison.differentPixels ?? 0
  const withinThreshold = diffRatio <= (options.maxDiffRatio ?? 0.003)

  if (options.auditMode) {
    const metadata = buildMetadata(name, options, {
      status: withinThreshold ? 'matched-baseline' : 'differs-from-baseline',
      baselinePath,
      differentPixels,
      totalPixels,
      diffRatio,
    })
    writeArtifactFiles(options.suite, name, options, actual, comparison.diffPng, metadata)
    return
  }

  if (withinThreshold) {
    return
  }

  if (options.updateMode) {
    fs.writeFileSync(baselinePath, actual)
    return
  }

  const metadata = buildMetadata(name, options, {
    status: 'differs-from-baseline',
    baselinePath,
    differentPixels,
    totalPixels,
    diffRatio,
  })
  const {actualPath, diffPath, metadataPath} = writeArtifactFiles(
    options.suite,
    name,
    options,
    actual,
    comparison.diffPng,
    metadata,
  )

  throw new Error(
    `Visual snapshot mismatch for ${options.suite}/${name}: ${differentPixels}/${totalPixels} pixels differ (${(diffRatio * 100).toFixed(3)}%). Actual: ${actualPath}. Diff: ${diffPath}. Metadata: ${metadataPath}.`,
  )
}

export async function assertUikitVisualSnapshot(
  page: Page,
  name: string,
  options: UikitVisualSnapshotOptions,
): Promise<void> {
  await assertVisualSnapshot(page, name, {
    ...options,
    artifactRoot: UIKIT_VISUAL_ARTIFACT_ROOT,
    auditMode: options.auditMode ?? process.env.UIKIT_VISUAL_AUDIT === '1',
    baselineRoot: UIKIT_VISUAL_BASELINE_ROOT,
    updateMode: options.updateMode ?? process.env.UPDATE_VISUAL_SNAPSHOTS === '1',
  })
}
