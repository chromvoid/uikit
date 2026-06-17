import {build} from 'vitepress'

try {
  await build('docs')
  process.exit(0)
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`)
  process.exit(1)
}
