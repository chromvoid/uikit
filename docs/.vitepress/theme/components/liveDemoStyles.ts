const LIVE_DEMO_STYLE_URLS = import.meta.glob('../live-demo-examples/*.css', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>

const styleCache = new Map<string, Promise<string>>()

function warnMissingStyleChunk(key: string): void {
  if (!import.meta.env.DEV) return

  console.warn(`No live demo CSS chunk found for data-demo="${key}".`)
}

function getStyleModulePath(key: string): string {
  return `../live-demo-examples/${key}.css`
}

async function loadStyleChunk(key: string): Promise<string> {
  const cached = styleCache.get(key)
  if (cached) return cached

  const url = LIVE_DEMO_STYLE_URLS[getStyleModulePath(key)]
  if (!url) {
    warnMissingStyleChunk(key)
    return ''
  }

  const promise = fetch(url).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Failed to load live demo CSS chunk "${key}": ${response.status}`)
    }

    return response.text()
  })
  styleCache.set(key, promise)
  return promise
}

export async function loadLiveDemoCss(keys: readonly string[]): Promise<string> {
  const chunks = await Promise.all(keys.map((key) => loadStyleChunk(key)))

  return chunks.filter(Boolean).join('\n\n')
}
