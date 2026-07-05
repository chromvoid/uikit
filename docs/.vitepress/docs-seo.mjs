export const defaultDocsSiteOrigin = 'https://uikit.chromvoid.com'

export function normalizeSiteOrigin(origin = defaultDocsSiteOrigin) {
  const trimmed = origin?.trim()
  return (trimmed || defaultDocsSiteOrigin).replace(/\/+$/u, '')
}

export const docsSiteOrigin = normalizeSiteOrigin(process.env.DOCS_SITE_ORIGIN)

export function canonicalPathFromMarkdownPath(markdownPath) {
  const normalized = markdownPath.replace(/\\/gu, '/').replace(/^\/+/u, '')

  if (normalized === 'index.md') return '/'
  if (normalized.endsWith('/index.md')) return `/${normalized.slice(0, -'index.md'.length)}`
  if (normalized.endsWith('.md')) return `/${normalized.slice(0, -'.md'.length)}.html`

  throw new Error(`Expected a Markdown page path, got ${markdownPath}`)
}

export function canonicalUrlFromMarkdownPath(markdownPath, siteOrigin = docsSiteOrigin) {
  return new URL(canonicalPathFromMarkdownPath(markdownPath), `${normalizeSiteOrigin(siteOrigin)}/`).href
}

export function escapeXml(value) {
  return value
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&apos;')
}

export function buildSitemapXml(urls) {
  const locs = [...new Set(urls)]
    .sort()
    .map((url) => `  <url>\n    <loc>${escapeXml(url)}</loc>\n  </url>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${locs}\n</urlset>\n`
}

export function buildRobotsTxt(siteOrigin = docsSiteOrigin) {
  const sitemapUrl = new URL('/sitemap.xml', `${normalizeSiteOrigin(siteOrigin)}/`).href
  return `User-agent: *\nAllow: /\nSitemap: ${sitemapUrl}\n`
}
