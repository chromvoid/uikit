const DATA_DEMO_RE = /\sdata-demo=(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi
const DEMO_SHELL_CLASS_RE =
  /\sclass=(?:"[^"]*\b[a-z0-9-]+-demo-(?:shell|surface|showcase|board)\b[^"]*"|'[^']*\b[a-z0-9-]+-demo-(?:shell|surface|showcase|board)\b[^']*')/i
const STYLE_KEY_RE = /^[a-z0-9-]+$/

function warnMissingStyleMetadata(html: string): void {
  if (!import.meta.env.DEV || !DEMO_SHELL_CLASS_RE.test(html)) return

  console.warn('Live demo contains demo shell classes without data-demo metadata.')
}

function warnInvalidStyleKey(key: string): void {
  if (!import.meta.env.DEV) return

  console.warn(`Ignoring invalid live demo style key "${key}".`)
}

export function extractLiveDemoStyleKeys(html: string): string[] {
  const keys = new Set<string>(['base'])
  let hasExplicitDemo = false

  DATA_DEMO_RE.lastIndex = 0
  for (;;) {
    const match = DATA_DEMO_RE.exec(html)
    if (!match) break

    hasExplicitDemo = true
    const key = match[1] ?? match[2] ?? match[3] ?? ''
    if (!STYLE_KEY_RE.test(key)) {
      warnInvalidStyleKey(key)
      continue
    }

    keys.add(key)
  }

  if (!hasExplicitDemo) {
    warnMissingStyleMetadata(html)
  }

  return [...keys]
}
