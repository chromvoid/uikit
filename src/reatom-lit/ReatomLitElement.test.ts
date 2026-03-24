import {css} from 'lit'
import {describe, expect, it} from 'vitest'

import {ReatomLitElement} from './ReatomLitElement'

class BlockHostElement extends ReatomLitElement {
  static override styles = [
    css`
      [part='base'] {
        color: inherit;
      }
    `,
  ]
}

class InlineBlockHostElement extends ReatomLitElement {
  static override hostDisplay = 'inline-block' as const
}

class InlineFlexHostElement extends ReatomLitElement {
  static override hostDisplay = 'inline-flex' as const
}

function getStyleText(elementClass: typeof ReatomLitElement): string {
  const styles = (
    elementClass as unknown as {
      finalizeStyles: (styles?: unknown) => Array<{cssText?: string}>
      styles?: unknown
    }
  ).finalizeStyles((elementClass as unknown as {styles?: unknown}).styles)

  return styles.map((style) => style.cssText ?? '').join('\n')
}

function normalizeCss(cssText: string): string {
  return cssText.replace(/\s+/g, ' ').trim()
}

describe('ReatomLitElement styling contract', () => {
  it('always includes the shared component reset', () => {
    const cssText = normalizeCss(getStyleText(BlockHostElement))

    expect(cssText).toContain(':host([hidden]), [hidden] { display: none !important; }')
    expect(cssText).toContain('button, input, textarea, select { font: inherit; color: inherit; }')
    expect(cssText).toContain('a { color: inherit; text-decoration: none; }')
    expect(cssText).toContain(':focus-visible { outline-offset: 2px; }')
    expect(cssText).toContain('::slotted(img),')
  })

  it('defaults host display to block', () => {
    const cssText = normalizeCss(getStyleText(BlockHostElement))

    expect(cssText).toContain(':host { display: block; }')
  })

  it('supports inline-block and inline-flex host overrides', () => {
    expect(normalizeCss(getStyleText(InlineBlockHostElement))).toContain(':host { display: inline-block; }')
    expect(normalizeCss(getStyleText(InlineFlexHostElement))).toContain(':host { display: inline-flex; }')
  })
})
