import {css} from 'lit'
import {describe, expect, it} from 'vitest'

import {ReatomLitElement} from './ReatomLitElement'

class BlockHostElement extends ReatomLitElement {
  static override styles = [css`
    [part='base'] {
      color: inherit;
    }
  `]
}

class InlineBlockHostElement extends ReatomLitElement {
  static override hostDisplay = 'inline-block' as const
}

class InlineFlexHostElement extends ReatomLitElement {
  static override hostDisplay = 'inline-flex' as const
}

function getStyleText(elementClass: typeof ReatomLitElement): string {
  const styles = (elementClass as unknown as {
    finalizeStyles: (styles?: unknown) => Array<{cssText?: string}>
    styles?: unknown
  }).finalizeStyles((elementClass as unknown as {styles?: unknown}).styles)

  return styles.map((style) => style.cssText ?? '').join('\n')
}

describe('ReatomLitElement styling contract', () => {
  it('always includes the shared component reset', () => {
    const cssText = getStyleText(BlockHostElement)

    expect(cssText).toContain(':host([hidden]),')
    expect(cssText).toContain('[hidden]')
    expect(cssText).toContain('button,')
    expect(cssText).toContain('input,')
    expect(cssText).toContain('a{')
    expect(cssText).toContain('::slotted(img)')
  })

  it('defaults host display to block', () => {
    const cssText = getStyleText(BlockHostElement)

    expect(cssText).toContain(':host{display:block;}')
  })

  it('supports inline-block and inline-flex host overrides', () => {
    expect(getStyleText(InlineBlockHostElement)).toContain(':host{display:inline-block;}')
    expect(getStyleText(InlineFlexHostElement)).toContain(':host{display:inline-flex;}')
  })
})
