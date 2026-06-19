import path from 'node:path'
import {fileURLToPath} from 'node:url'

import type {Page} from 'playwright'

import {
  assertVisualSnapshot,
  type VisualSnapshotMetadata,
  type VisualSnapshotOptions,
} from '../../../../../scripts/testing/visual-snapshot'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const VISUAL_ROOT = path.resolve(dirname, '..')
export const UIKIT_VISUAL_BASELINE_ROOT = path.join(VISUAL_ROOT, '__visual-baselines__')
export const UIKIT_VISUAL_ARTIFACT_ROOT = path.resolve(
  dirname,
  '../../../.artifacts/visual',
)

export type UikitVisualSnapshotOptions = Omit<
  VisualSnapshotOptions,
  'artifactRoot' | 'baselineRoot'
> & {
  metadata?: VisualSnapshotMetadata
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
