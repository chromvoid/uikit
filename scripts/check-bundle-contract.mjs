import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {build} from 'esbuild'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(scriptDir, '..')
const tmpRoot = await mkdtemp(path.join(os.tmpdir(), 'uikit-bundle-contract-'))

const rootEntry = path.join(tmpRoot, 'root-entry.js')
const leafEntry = path.join(tmpRoot, 'leaf-entry.js')
const rootOut = path.join(tmpRoot, 'root-out')
const leafOut = path.join(tmpRoot, 'leaf-out')
const rootImportPath = path.join(packageRoot, 'dist', 'index.js').replaceAll(path.sep, '/')
const leafImportPath = path.join(packageRoot, 'dist', 'components', 'cv-button.js').replaceAll(path.sep, '/')
const unrelatedMarkers = [
  'cv-treegrid',
  'cv-window-splitter',
  'cv-date-picker',
  'cv-command-palette',
  'cv-tooltip',
]

async function bundle(entryFile, outdir) {
  await mkdir(outdir, {recursive: true})
  const outfile = path.join(outdir, path.basename(entryFile))

  await build({
    absWorkingDir: packageRoot,
    bundle: true,
    entryPoints: [entryFile],
    format: 'esm',
    minify: true,
    outfile,
    platform: 'browser',
    target: 'es2022',
    treeShaking: true,
    write: true,
  })

  return readFile(outfile, 'utf8')
}

await writeFile(rootEntry, `import {CVButton} from '${rootImportPath}';\nconsole.log(CVButton.elementName)\n`)
await writeFile(leafEntry, `import {CVButton} from '${leafImportPath}';\nconsole.log(CVButton.elementName)\n`)

try {
  const rootBundle = await bundle(rootEntry, rootOut)
  const leafBundle = await bundle(leafEntry, leafOut)

  for (const marker of unrelatedMarkers) {
    if (rootBundle.includes(marker)) {
      throw new Error(`Root bundle pulled unrelated marker: ${marker}`)
    }
    if (leafBundle.includes(marker)) {
      throw new Error(`Leaf bundle pulled unrelated marker: ${marker}`)
    }
  }

  if (!rootBundle.includes('cv-button') || !leafBundle.includes('cv-button')) {
    throw new Error('Expected cv-button marker to stay in the bundled outputs')
  }

  console.log('[bundle] bundle contract passed')
} finally {
  await rm(tmpRoot, {recursive: true, force: true})
}
