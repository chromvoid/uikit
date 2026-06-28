import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {build} from 'esbuild'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(scriptDir, '..')
const tmpRoot = await mkdtemp(path.join(os.tmpdir(), 'uikit-bundle-contract-'))

const rootEntry = path.join(tmpRoot, 'root-entry.js')
const buttonLeafEntry = path.join(tmpRoot, 'button-leaf-entry.js')
const selectLeafEntry = path.join(tmpRoot, 'select-leaf-entry.js')
const rootOut = path.join(tmpRoot, 'root-out')
const buttonLeafOut = path.join(tmpRoot, 'button-leaf-out')
const selectLeafOut = path.join(tmpRoot, 'select-leaf-out')
const rootImportPath = path.join(packageRoot, 'dist', 'index.js').replaceAll(path.sep, '/')
const buttonLeafImportPath = path
  .join(packageRoot, 'dist', 'components', 'cv-button.js')
  .replaceAll(path.sep, '/')
const selectLeafImportPath = path
  .join(packageRoot, 'dist', 'components', 'cv-select.js')
  .replaceAll(path.sep, '/')
const unrelatedMarkers = [
  'cv-treegrid',
  'cv-window-splitter',
  'cv-date-picker',
  'cv-command-palette',
  'cv-tooltip',
]
const sizeBudgets = {
  buttonLeaf: 59000,
  selectLeaf: 63000,
}

const writeStdout = (message) => {
  process.stdout.write(`${message}\n`)
}

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

function assertBundleHasNoUnrelatedMarkers(bundle, label) {
  for (const marker of unrelatedMarkers) {
    if (bundle.includes(marker)) {
      throw new Error(`${label} pulled unrelated marker: ${marker}`)
    }
  }
}

function assertBundleContainsMarker(bundle, marker, label) {
  if (!bundle.includes(marker)) {
    throw new Error(`Expected ${label} to retain marker: ${marker}`)
  }
}

function assertBundleSizeWithinBudget(bundle, budget, label) {
  if (bundle.length > budget) {
    throw new Error(`${label} exceeded size budget (${bundle.length} > ${budget})`)
  }
}

await writeFile(
  rootEntry,
  `import {CVButton, CVSelect} from '${rootImportPath}';\nconsole.log(CVButton.elementName, CVSelect.elementName)\n`,
)
await writeFile(
  buttonLeafEntry,
  `import {CVButton} from '${buttonLeafImportPath}';\nconsole.log(CVButton.elementName)\n`,
)
await writeFile(
  selectLeafEntry,
  `import {CVSelect} from '${selectLeafImportPath}';\nconsole.log(CVSelect.elementName)\n`,
)

try {
  const rootBundle = await bundle(rootEntry, rootOut)
  const buttonLeafBundle = await bundle(buttonLeafEntry, buttonLeafOut)
  const selectLeafBundle = await bundle(selectLeafEntry, selectLeafOut)

  assertBundleHasNoUnrelatedMarkers(rootBundle, 'Root bundle')
  assertBundleHasNoUnrelatedMarkers(buttonLeafBundle, 'Button leaf bundle')
  assertBundleHasNoUnrelatedMarkers(selectLeafBundle, 'Select leaf bundle')

  assertBundleContainsMarker(rootBundle, 'cv-button', 'root bundle')
  assertBundleContainsMarker(rootBundle, 'cv-select', 'root bundle')
  assertBundleContainsMarker(buttonLeafBundle, 'cv-button', 'button leaf bundle')
  assertBundleContainsMarker(selectLeafBundle, 'cv-select', 'select leaf bundle')

  assertBundleSizeWithinBudget(buttonLeafBundle, sizeBudgets.buttonLeaf, 'Button leaf bundle')
  assertBundleSizeWithinBudget(selectLeafBundle, sizeBudgets.selectLeaf, 'Select leaf bundle')

  writeStdout('[bundle] bundle contract passed')
} finally {
  await rm(tmpRoot, {recursive: true, force: true})
}
