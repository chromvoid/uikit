import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(scriptDir, '..')
const guardedFiles = ['docs/.vitepress/theme/index.ts']

const rootImportRe = /from ['"]@chromvoid\/uikit['"]/u
const offenders = []

const writeStdout = (message) => {
  process.stdout.write(`${message}\n`)
}

const writeStderr = (message) => {
  process.stderr.write(`${message}\n`)
}

for (const relativePath of guardedFiles) {
  const fullPath = path.join(packageRoot, relativePath)
  const source = await readFile(fullPath, 'utf8')
  if (rootImportRe.test(source)) {
    offenders.push(relativePath)
  }
}

if (offenders.length > 0) {
  writeStderr('[guardrail] bootstrap/entry files must use uikit subpaths:')
  for (const offender of offenders) {
    writeStderr(` - ${offender}`)
  }
  process.exit(1)
}

writeStdout('[guardrail] entry import contract passed')
