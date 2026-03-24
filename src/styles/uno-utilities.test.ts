import {readFileSync, readdirSync} from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {createGenerator} from 'unocss'
import {describe, expect, it} from 'vitest'

import unoConfig from '../../uno.config'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(currentDir, '../..')
const runtimeSrcDir = path.join(packageRoot, 'src')

function walk(dir: string): string[] {
  const entries = readdirSync(dir, {withFileTypes: true})
  const files: string[] = []

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

async function generateRuntimeUtilityCss(): Promise<string> {
  const runtimeFiles = walk(runtimeSrcDir)
    .filter((file) => file.endsWith('.ts'))
    .filter((file) => !file.endsWith('.test.ts'))
    .filter((file) => !file.endsWith('.d.ts'))
    .filter((file) => !file.includes(`${path.sep}src${path.sep}test${path.sep}`))

  const source = runtimeFiles.map((file) => readFileSync(file, 'utf8')).join('\n')
  const uno = await createGenerator(unoConfig)
  const result = await uno.generate(source)
  return result.css
}

describe('Uno utility generation', () => {
  it('only emits curated cv-u shortcut selectors for runtime sources', async () => {
    const css = await generateRuntimeUtilityCss()

    expect(css).toContain('.cv-u-control-shell{')
    expect(css).toContain('.cv-u-panel-shell{')
    expect(css).toContain('.cv-u-row-between{')
    expect(css).toContain('.cv-u-icon-slot{')
    expect(css).toContain('.cv-u-fill{')

    expect(css).not.toContain('.flex{')
    expect(css).not.toContain('.grid{')
    expect(css).not.toContain('.border{')
    expect(css).not.toContain('.inline-flex{')
    expect(css).not.toContain('.table{')
    expect(css).not.toContain('.sticky{')
    expect(css).not.toContain('.columns-2{')
    expect(css).not.toContain('.transition{')
    expect(css).not.toContain('.tabular-nums{')
  })
})
