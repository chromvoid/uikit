import type MarkdownIt from 'markdown-it'

const CV_TAG_RE = /<cv-[\w-]+/
const LIVE_DEMO_LANGS = new Set(['html', 'xml'])
// Explicit docs-only escape hatch for examples that should show source without a live preview.
const SOURCE_ONLY_DEMO_RE = /\sdata-live-demo-source-only(?:[\s=>]|$)/i
const SOURCE_ONLY_INFO_RE = /(?:^|\s)(?:source-only|live-demo-source-only)(?:\s|$)/i

export function liveDemoPlugin(md: MarkdownIt): void {
  const defaultFence =
    md.renderer.rules.fence || ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const info = token.info.trim()
    const lang = info.split(/\s+/)[0]
    const raw = token.content

    if (
      !LIVE_DEMO_LANGS.has(lang) ||
      !CV_TAG_RE.test(raw) ||
      SOURCE_ONLY_INFO_RE.test(info) ||
      SOURCE_ONLY_DEMO_RE.test(raw)
    ) {
      return defaultFence(tokens, idx, options, env, self)
    }

    const highlighted = defaultFence(tokens, idx, options, env, self)

    const codeB64 = Buffer.from(raw).toString('base64')
    const highlightedB64 = Buffer.from(highlighted).toString('base64')

    return `<LiveDemo code="${codeB64}" highlighted="${highlightedB64}" />\n`
  }
}
