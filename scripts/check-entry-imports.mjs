import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(scriptDir, '..')
const guardedFiles = ['docs/.vitepress/theme/index.ts']

const rootImportRe = /from ['"]@chromvoid\/uikit['"]/u
const offenders = []

for (const relativePath of guardedFiles) {
  const fullPath = path.join(packageRoot, relativePath)
  const source = await readFile(fullPath, 'utf8')
  if (rootImportRe.test(source)) {
    offenders.push(relativePath)
  }
}

if (offenders.length > 0) {
  console.error('[guardrail] bootstrap/entry files must use uikit subpaths:')
  for (const offender of offenders) {
    console.error(` - ${offender}`)
  }
  process.exit(1)
}

console.log('[guardrail] entry import contract passed')
