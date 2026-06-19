import fs from 'node:fs'
import path from 'node:path'

type ReviewEntry = {
  artifactDir: string
  metadataPath: string
  metadata: Record<string, unknown>
}

function walkMetadata(root: string, entries: ReviewEntry[] = []): ReviewEntry[] {
  if (!fs.existsSync(root)) return entries

  for (const entry of fs.readdirSync(root, {withFileTypes: true})) {
    const current = path.join(root, entry.name)
    if (entry.isDirectory()) {
      walkMetadata(current, entries)
      continue
    }

    if (entry.name !== 'metadata.json') continue

    try {
      entries.push({
        artifactDir: path.dirname(current),
        metadataPath: current,
        metadata: JSON.parse(fs.readFileSync(current, 'utf8')) as Record<string, unknown>,
      })
    } catch {
      entries.push({
        artifactDir: path.dirname(current),
        metadataPath: current,
        metadata: {status: 'unreadable-metadata'},
      })
    }
  }

  return entries
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function relativeLink(root: string, target: string): string {
  return path.relative(root, target).split(path.sep).join('/')
}

function diagnosticSeverity(metadata: Record<string, unknown>): 'error' | 'warning' | 'ok' {
  const diagnostics = metadata.diagnostics as
    | {
        emptyStage?: boolean
        horizontalOverflow?: unknown[]
        clippedText?: unknown[]
        outsideStage?: unknown[]
        stageViewportOverflow?: unknown
      }
    | undefined

  if (metadata.status === 'differs-from-baseline' || metadata.status === 'size-mismatch') {
    return 'error'
  }
  if (metadata.status === 'missing-baseline' || diagnostics?.emptyStage) return 'warning'
  if (
    diagnostics?.horizontalOverflow?.length ||
    diagnostics?.clippedText?.length ||
    diagnostics?.outsideStage?.length ||
    diagnostics?.stageViewportOverflow
  ) {
    return 'warning'
  }
  return 'ok'
}

export function writeUikitVisualReviewIndex(artifactRoot: string): string | null {
  const entries = walkMetadata(artifactRoot).sort((a, b) => {
    const left = `${a.metadata.component ?? a.metadata.suite ?? ''}/${a.metadata.name ?? ''}`
    const right = `${b.metadata.component ?? b.metadata.suite ?? ''}/${b.metadata.name ?? ''}`
    return left.localeCompare(right)
  })

  if (entries.length === 0) return null

  const rows = entries
    .map((entry) => {
      const actual = path.join(entry.artifactDir, 'actual.png')
      const diff = path.join(entry.artifactDir, 'diff.png')
      const severity = diagnosticSeverity(entry.metadata)
      const diagnostics = entry.metadata.diagnostics
        ? JSON.stringify(entry.metadata.diagnostics, null, 2)
        : ''
      return `
        <article class="entry entry--${severity}">
          <header>
            <strong>${escapeHtml(entry.metadata.component ?? entry.metadata.suite)}</strong>
            <span>${escapeHtml(entry.metadata.name)}</span>
            <mark>${escapeHtml(entry.metadata.status)}</mark>
          </header>
          <nav>
            ${fs.existsSync(actual) ? `<a href="${relativeLink(artifactRoot, actual)}">actual</a>` : ''}
            ${fs.existsSync(diff) ? `<a href="${relativeLink(artifactRoot, diff)}">diff</a>` : ''}
            <a href="${relativeLink(artifactRoot, entry.metadataPath)}">metadata</a>
          </nav>
          <div class="shots">
            ${fs.existsSync(actual) ? `<img src="${relativeLink(artifactRoot, actual)}" alt="">` : ''}
            ${fs.existsSync(diff) ? `<img src="${relativeLink(artifactRoot, diff)}" alt="">` : ''}
          </div>
          ${diagnostics ? `<details><summary>Diagnostics</summary><pre>${escapeHtml(diagnostics)}</pre></details>` : ''}
        </article>`
    })
    .join('\n')

  fs.mkdirSync(artifactRoot, {recursive: true})
  const indexPath = path.join(artifactRoot, 'review-index.html')
  fs.writeFileSync(
    indexPath,
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>UIKit Visual Review</title>
    <style>
      :root {
        color-scheme: dark;
        font: 14px/1.45 system-ui, sans-serif;
        background: Canvas;
        color: CanvasText;
      }
      body {
        margin: 0;
        padding: 24px;
      }
      h1 {
        margin: 0 0 20px;
        font-size: 24px;
      }
      .entry {
        border: 1px solid GrayText;
        border-radius: 8px;
        margin: 0 0 16px;
        padding: 14px;
        background: Canvas;
      }
      .entry--error {
        border-color: Mark;
      }
      .entry--warning {
        border-color: Highlight;
      }
      header,
      nav {
        display: flex;
        gap: 10px;
        align-items: center;
        flex-wrap: wrap;
      }
      header {
        justify-content: space-between;
      }
      mark {
        border-radius: 999px;
        padding: 2px 8px;
        background: ButtonFace;
        color: inherit;
      }
      a {
        color: LinkText;
      }
      .shots {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 12px;
        margin-top: 12px;
      }
      img {
        max-width: 100%;
        border: 1px solid GrayText;
        background: Canvas;
      }
      pre {
        overflow: auto;
        padding: 12px;
        border-radius: 6px;
        background: Canvas;
      }
    </style>
  </head>
  <body>
    <h1>UIKit Visual Review</h1>
    ${rows}
  </body>
</html>
`,
  )

  return indexPath
}
