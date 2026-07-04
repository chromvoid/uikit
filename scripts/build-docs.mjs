import {readdir, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {build} from 'vitepress'

import {
  buildRobotsTxt,
  buildSitemapXml,
  canonicalUrlFromMarkdownPath,
  docsSiteOrigin,
} from './docs-seo.mjs'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(scriptDir, '..')
const docsDir = path.join(rootDir, 'docs')
const outDir = path.join(docsDir, '.vitepress', 'dist')

async function collectMarkdownPages(dir = docsDir) {
  const entries = await readdir(dir, {withFileTypes: true})
  const pages = []

  for (const entry of entries) {
    if (entry.name === '.vitepress') continue

    const absolutePath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      pages.push(...(await collectMarkdownPages(absolutePath)))
      continue
    }

    if (!entry.isFile() || !entry.name.endsWith('.md')) continue

    pages.push(path.relative(docsDir, absolutePath))
  }

  return pages
}

async function writeSeoFiles() {
  const pages = await collectMarkdownPages()
  const urls = pages.map((page) => canonicalUrlFromMarkdownPath(page, docsSiteOrigin))

  await writeFile(path.join(outDir, 'sitemap.xml'), buildSitemapXml(urls), 'utf8')
  await writeFile(path.join(outDir, 'robots.txt'), buildRobotsTxt(docsSiteOrigin), 'utf8')
}

try {
  await build('docs')
  await writeSeoFiles()
  process.exit(0)
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`)
  process.exit(1)
}
