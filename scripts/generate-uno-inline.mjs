import {existsSync, readFileSync, readdirSync, rmSync, writeFileSync} from 'node:fs'
import path from 'node:path'
import {fileURLToPath, pathToFileURL} from 'node:url'

import {build} from 'esbuild'
import {createGenerator} from 'unocss'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(scriptDir, '..')
const runtimeSrcDir = path.join(packageRoot, 'src')
const tempConfigPath = path.join(packageRoot, '.tmp-uno-config.mjs')
const outputPath = path.join(runtimeSrcDir, 'styles', 'uno-generated.ts')

function walk(dir) {
  const entries = readdirSync(dir, {withFileTypes: true})
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walk(fullPath))
      continue
    }
    files.push(fullPath)
  }

  return files
}

function getRuntimeSource() {
  const runtimeFiles = walk(runtimeSrcDir)
    .filter((file) => file.endsWith('.ts'))
    .filter((file) => !file.endsWith('.test.ts'))
    .filter((file) => !file.endsWith('.d.ts'))
    .filter((file) => !file.endsWith(path.join('styles', 'uno-generated.ts')))
    .filter((file) => !file.includes(`${path.sep}src${path.sep}test${path.sep}`))

  return runtimeFiles.map((file) => readFileSync(file, 'utf8')).join('\n')
}

async function loadUnoConfig() {
  await build({
    absWorkingDir: packageRoot,
    entryPoints: [path.join(packageRoot, 'uno.config.ts')],
    format: 'esm',
    outfile: tempConfigPath,
    platform: 'node',
    target: 'node20',
    write: true,
  })

  try {
    const configModule = await import(`${pathToFileURL(tempConfigPath).href}?t=${Date.now()}`)
    return configModule.default
  } finally {
    rmSync(tempConfigPath, {force: true})
  }
}

async function main() {
  const unoConfig = await loadUnoConfig()
  const uno = await createGenerator(unoConfig)
  const result = await uno.generate(getRuntimeSource())
  const nextFile = `export default ${JSON.stringify(result.css)}\n`
  const currentFile = existsSync(outputPath) ? readFileSync(outputPath, 'utf8') : null

  if (currentFile !== nextFile) {
    writeFileSync(outputPath, nextFile, 'utf8')
  }
}

await main()
