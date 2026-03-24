import {access, readFile} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(scriptDir, '..')

async function assertReadable(label, targetUrl) {
  const filePath = fileURLToPath(targetUrl)
  await access(filePath)
  console.log(`[exports] ${label}: ${filePath}`)
}

async function main() {
  const rootModule = await import('@chromvoid/uikit')
  const registerModule = await import('@chromvoid/uikit/register')
  const buttonModule = await import('@chromvoid/uikit/components/cv-button')
  const reatomModule = await import('@chromvoid/uikit/reatom-lit')
  const dialogModule = await import('@chromvoid/uikit/dialog')
  const toastModule = await import('@chromvoid/uikit/toast')
  const themeModule = await import('@chromvoid/uikit/theme')

  if (typeof rootModule.CVButton !== 'function') {
    throw new Error('Root export smoke failed: CVButton export is missing')
  }
  if (typeof registerModule.registerUikit !== 'function') {
    throw new Error('Register export smoke failed: registerUikit export is missing')
  }
  if (typeof buttonModule.CVButton !== 'function') {
    throw new Error('Leaf export smoke failed: CVButton leaf export is missing')
  }
  if (typeof reatomModule.ReatomLitElement !== 'function' || typeof reatomModule.html !== 'function') {
    throw new Error('Reatom export smoke failed')
  }
  if (typeof dialogModule.createDialogController !== 'function') {
    throw new Error('Dialog export smoke failed')
  }
  if (typeof toastModule.createToastController !== 'function') {
    throw new Error('Toast export smoke failed')
  }
  if (typeof themeModule.defineTheme !== 'function') {
    throw new Error('Theme export smoke failed')
  }

  const packageJson = JSON.parse(await readFile(path.join(packageRoot, 'package.json'), 'utf8'))
  const cssTarget = packageJson.exports['./theme/tokens.css']
  await assertReadable('theme tokens css', new URL(cssTarget, `file://${packageRoot}/`))

  const typeTargets = [
    packageJson.exports['.'].types,
    packageJson.exports['./register'].types,
    packageJson.exports['./components'].types,
    packageJson.exports['./dialog'].types,
    packageJson.exports['./toast'].types,
    packageJson.exports['./theme'].types,
    packageJson.exports['./reatom-lit'].types,
    packageJson.exports['./html'].types,
  ]

  for (const target of typeTargets) {
    const fullPath = path.join(packageRoot, target)
    await access(fullPath)
    console.log(`[exports] types: ${fullPath}`)
  }

  console.log('[exports] package export smoke passed')
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
