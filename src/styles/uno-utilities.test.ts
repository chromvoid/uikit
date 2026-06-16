import {readFileSync, readdirSync} from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {createGenerator} from 'unocss'
import {describe, expect, it} from 'vitest'

import unoConfig from '../../uno.config'
import generatedCss from './uno-generated'

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
    .filter((file) => !file.endsWith(path.join('styles', 'uno-generated.ts')))
    .filter((file) => !file.includes(`${path.sep}src${path.sep}test${path.sep}`))

  const source = runtimeFiles.map((file) => readFileSync(file, 'utf8')).join('\n')
  const uno = await createGenerator(unoConfig)
  const result = await uno.generate(source)
  return result.css
}

describe('Uno utility generation', () => {
  it('keeps the committed generated module in sync with runtime sources', async () => {
    const css = await generateRuntimeUtilityCss()
    const controlShellMatch = css.match(/\.cv-u-control-shell\{([^}]*)\}/)

    expect(css).toBe(generatedCss)
    expect(controlShellMatch?.[1]).toBeDefined()
    expect(css).toContain('.cv-u-control-shell{')
    expect(css).toContain('.cv-u-panel-shell{')
    expect(css).toContain('.cv-u-row-between{')
    expect(css).toContain('.cv-u-icon-slot{')
    expect(css).toContain('.cv-u-fill{')
    expect(controlShellMatch?.[1]).toContain('display:flex;')
    expect(controlShellMatch?.[1]).toContain('align-items:center;')
    expect(controlShellMatch?.[1]).toContain('gap:var(--cv-space-2);')
    expect(controlShellMatch?.[1]).not.toContain('background-color:')
    expect(controlShellMatch?.[1]).not.toContain('border-width:')
    expect(controlShellMatch?.[1]).not.toContain('border-radius:')

    expect(css).not.toContain('.flex{')
    expect(css).not.toContain('.grid{')
    expect(css).not.toContain('.border{')
    expect(css).not.toContain('.inline-flex{')
    expect(css).not.toContain('.table{')
    expect(css).not.toContain('.sticky{')
    expect(css).not.toContain('.columns-2{')
    expect(css).not.toContain('.transition{')
    expect(css).not.toContain('.tabular-nums{')
    expect(css).not.toContain('.backdrop-filter{')
  }, 15_000)
})
