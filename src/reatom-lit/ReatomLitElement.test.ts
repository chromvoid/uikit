import {atom} from '@reatom/core'
import {LitElement, css} from 'lit'
import {afterEach, describe, expect, it} from 'vitest'

import {ReatomLitElement} from './ReatomLitElement'
import {html} from './html'
import {watch} from './watch'
import {withReatomElement} from './withReatomElement'

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

class UtilityOverrideHostElement extends ReatomLitElement {
  static override styles = [
    css`
      [part='base'] {
        background: rebeccapurple;
        border: 1px solid red;
      }
    `,
  ]
}

class AtomTextHostElement extends ReatomLitElement {
  static {
    if (!customElements.get('test-reatom-text-host')) {
      customElements.define('test-reatom-text-host', this)
    }
  }

  readonly text$ = atom('alpha')

  protected override render() {
    return html`<span part="value">${this.text$}</span>`
  }
}

class WatchPartHostElement extends ReatomLitElement {
  static {
    if (!customElements.get('test-reatom-watch-host')) {
      customElements.define('test-reatom-watch-host', this)
    }
  }

  readonly value$ = atom('alpha')
  readonly checked$ = atom(false)
  readonly disabled$ = atom(false)
  renderCount = 0

  protected override render() {
    this.renderCount += 1

    return html`
      <input
        part="control"
        .value=${watch(this.value$)}
        .checked=${watch(this.checked$)}
        ?disabled=${watch(this.disabled$)}
      />
    `
  }
}

class LifecycleBaseElement extends LitElement {
  connectedCalls = 0
  disconnectedCalls = 0

  override connectedCallback(): void {
    this.connectedCalls += 1
    super.connectedCallback()
  }

  override disconnectedCallback(): void {
    this.disconnectedCalls += 1
    super.disconnectedCallback()
  }
}

class WrappedLifecycleElement extends withReatomElement(LifecycleBaseElement) {
  static {
    if (!customElements.get('test-reatom-wrapped-host')) {
      customElements.define('test-reatom-wrapped-host', this)
    }
  }

  readonly text$ = atom('alpha')

  override render() {
    return html`<span part="value">${this.text$}</span>`
  }
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

async function settle(element: LitElement): Promise<void> {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
}

afterEach(() => {
  document.body.innerHTML = ''
})

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

  it('includes bundled Uno utility styles by default', () => {
    const cssText = normalizeCss(getStyleText(BlockHostElement))
    const controlShellMatch = cssText.match(/\.cv-u-control-shell\{([^}]*)\}/)

    expect(cssText).toContain('.cv-u-control-shell{')
    expect(controlShellMatch?.[1]).toContain('display:flex;')
    expect(controlShellMatch?.[1]).not.toContain('background-color:')
    expect(controlShellMatch?.[1]).not.toContain('border-width:')
  })

  it('applies bundled utilities before component styles so local skin can override them', () => {
    const cssText = getStyleText(UtilityOverrideHostElement)
    const utilityIndex = cssText.indexOf('.cv-u-control-shell{')
    const componentIndex = cssText.indexOf("[part='base'] {")

    expect(utilityIndex).toBeGreaterThanOrEqual(0)
    expect(componentIndex).toBeGreaterThanOrEqual(0)
    expect(utilityIndex).toBeLessThan(componentIndex)
  })

  it('supports inline-block and inline-flex host overrides', () => {
    expect(normalizeCss(getStyleText(InlineBlockHostElement))).toContain(':host { display: inline-block; }')
    expect(normalizeCss(getStyleText(InlineFlexHostElement))).toContain(':host { display: inline-flex; }')
  })
})

describe('ReatomLitElement reactive rendering contract', () => {
  it('auto-wraps atom values in text parts via the local html helper', async () => {
    const element = document.createElement('test-reatom-text-host') as AtomTextHostElement
    document.body.append(element)
    await settle(element)

    const value = element.shadowRoot?.querySelector('[part="value"]')
    expect(value?.textContent?.trim()).toBe('alpha')

    element.text$.set('beta')
    await settle(element)

    expect(value?.textContent?.trim()).toBe('beta')
  })

  it('updates property bindings through explicit watch() without host rerender', async () => {
    const element = document.createElement('test-reatom-watch-host') as WatchPartHostElement
    document.body.append(element)
    await settle(element)

    const control = element.shadowRoot?.querySelector('[part="control"]') as HTMLInputElement | null
    expect(control).not.toBeNull()
    expect(control?.value).toBe('alpha')
    expect(control?.checked).toBe(false)
    expect(control?.disabled).toBe(false)
    expect(element.renderCount).toBe(1)

    element.value$.set('beta')
    element.checked$.set(true)
    element.disabled$.set(true)
    await Promise.resolve()

    expect(control?.value).toBe('beta')
    expect(control?.checked).toBe(true)
    expect(control?.disabled).toBe(true)
    expect(element.renderCount).toBe(1)
  })

  it('mounts and unmounts wrapped subscriptions while preserving base lifecycle hooks', async () => {
    const element = document.createElement('test-reatom-wrapped-host') as WrappedLifecycleElement
    document.body.append(element)
    await settle(element)

    const value = () => element.shadowRoot?.querySelector('[part="value"]')?.textContent?.trim()
    expect(value()).toBe('alpha')
    expect(element.connectedCalls).toBe(1)
    expect(element.disconnectedCalls).toBe(0)

    element.text$.set('beta')
    await settle(element)
    expect(value()).toBe('beta')

    document.body.removeChild(element)
    expect(element.disconnectedCalls).toBe(1)

    element.text$.set('gamma')
    await Promise.resolve()
    expect(value()).toBe('beta')

    document.body.append(element)
    await settle(element)
    expect(element.connectedCalls).toBe(2)
    expect(value()).toBe('gamma')
  })
})
