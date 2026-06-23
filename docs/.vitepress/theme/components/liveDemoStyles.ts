const LIVE_DEMO_STYLES = import.meta.glob('../live-demo-examples/*.css', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>

const styleCache = new Map<string, Promise<string>>()

function styleKeyToModulePath(key: string): string {
  return `../live-demo-examples/${key}.css`
}

function warnMissingStyleChunk(key: string): void {
  if (!import.meta.env.DEV) return

  console.warn(`No live demo CSS chunk found for data-demo="${key}".`)
}

async function loadStyleChunk(key: string): Promise<string> {
  const cached = styleCache.get(key)
  if (cached) return cached

  const style = LIVE_DEMO_STYLES[styleKeyToModulePath(key)]
  if (!style) {
    warnMissingStyleChunk(key)
    return ''
  }

  const promise = Promise.resolve(style)
  styleCache.set(key, promise)
  return promise
}

export async function loadLiveDemoCss(keys: readonly string[]): Promise<string> {
  const chunks = await Promise.all(keys.map((key) => loadStyleChunk(key)))

  return chunks.filter(Boolean).join('\n\n')
}
