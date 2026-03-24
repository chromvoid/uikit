import {cp, mkdir, readdir, readFile, stat, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(scriptDir, '..')
const srcDir = path.join(packageRoot, 'src')
const distDir = path.join(packageRoot, 'dist')

const RELATIVE_SPECIFIER_RE = /((?:import|export)\s[^'"]*?\sfrom\s*|import\s*\()(['"])(\.\.?\/[^'")]+)(\2)/g

async function walk(dir) {
  const entries = await readdir(dir, {withFileTypes: true})
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)))
      continue
    }
    files.push(fullPath)
  }

  return files
}

function needsJsExtension(specifier) {
  if (!specifier.startsWith('.')) return false
  return !/\.(?:[cm]?js|css|json|node)$/u.test(specifier)
}

async function rewriteRelativeSpecifiers(filePath) {
  const source = await readFile(filePath, 'utf8')
  const rewritten = source.replace(RELATIVE_SPECIFIER_RE, (match, prefix, quote, specifier, suffix) => {
    if (!needsJsExtension(specifier)) {
      return match
    }
    return `${prefix}${quote}${specifier}.js${suffix}`
  })

  if (rewritten !== source) {
    await writeFile(filePath, rewritten)
  }
}

async function copyCssAsset(relativePath) {
  const srcPath = path.join(srcDir, relativePath)
  const distPath = path.join(distDir, relativePath)
  await mkdir(path.dirname(distPath), {recursive: true})
  await cp(srcPath, distPath)
}

await copyCssAsset(path.join('theme', 'tokens.css'))

for (const filePath of await walk(distDir)) {
  const fileStat = await stat(filePath)
  if (!fileStat.isFile()) continue
  if (!/\.(?:js|d\.ts)$/u.test(filePath)) continue
  await rewriteRelativeSpecifiers(filePath)
}
