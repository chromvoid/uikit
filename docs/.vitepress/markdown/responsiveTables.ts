import type MarkdownIt from 'markdown-it'

export function responsiveTablesPlugin(md: MarkdownIt): void {
  const defaultTableOpen =
    md.renderer.rules.table_open ||
    ((tokens, idx, options, _env, self) =>
      self.renderToken(tokens, idx, options))
  const defaultTableClose =
    md.renderer.rules.table_close ||
    ((tokens, idx, options, _env, self) =>
      self.renderToken(tokens, idx, options))

  md.renderer.rules.table_open = (tokens, idx, options, env, self) => {
    tokens[idx].attrJoin('class', 'docs-table')

    return `<div class="docs-table-shell"><div class="docs-table-scroll">${defaultTableOpen(tokens, idx, options, env, self)}`
  }

  md.renderer.rules.table_close = (tokens, idx, options, env, self) =>
    `${defaultTableClose(tokens, idx, options, env, self)}</div></div>\n`
}
