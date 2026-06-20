import {afterEach, describe, expect, it} from 'vitest'

import {CVSidebarItem} from './cv-sidebar-item'

CVSidebarItem.define()

const settle = async (element: CVSidebarItem) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
}

const stylesToText = () =>
  (CVSidebarItem.styles as Array<{cssText?: string}>).map((style) => style.cssText ?? '').join('\n')

const transitionsToText = (cssText: string) =>
  (cssText.match(/transition(?:-[a-z-]+)?:[^;]+;/g) ?? []).join('\n')

const createItem = async (attrs?: Partial<CVSidebarItem>) => {
  const el = document.createElement('cv-sidebar-item') as CVSidebarItem
  if (attrs) Object.assign(el, attrs)
  document.body.append(el)
  await settle(el)
  return el
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('cv-sidebar-item', () => {
  it('renders anchor anatomy with prefix, label, and suffix parts', async () => {
    const el = await createItem({href: '#alpha'})
    const anchor = el.shadowRoot!.querySelector('[part="base"]') as HTMLAnchorElement

    expect(anchor.tagName).toBe('A')
    expect(el.shadowRoot!.querySelector('[part="prefix"]')).toBeTruthy()
    expect(el.shadowRoot!.querySelector('[part="label"]')).toBeTruthy()
    expect(el.shadowRoot!.querySelector('[part="suffix"]')).toBeTruthy()
    expect(anchor.getAttribute('href')).toBe('#alpha')
  })

  it('reflects active state as aria-current', async () => {
    const el = await createItem({href: '#alpha', active: true})
    const anchor = el.shadowRoot!.querySelector('[part="base"]') as HTMLAnchorElement

    expect(el.hasAttribute('active')).toBe(true)
    expect(anchor.getAttribute('aria-current')).toBe('location')
  })

  it('prevents interaction when disabled', async () => {
    const el = await createItem({href: '#alpha', disabled: true})
    const anchor = el.shadowRoot!.querySelector('[part="base"]') as HTMLAnchorElement
    let prevented = false

    anchor.addEventListener('click', (event) => {
      prevented = event.defaultPrevented
    })

    anchor.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true, composed: true}))
    await settle(el)

    expect(el.hasAttribute('disabled')).toBe(true)
    expect(anchor.hasAttribute('href')).toBe(false)
    expect(anchor.getAttribute('aria-disabled')).toBe('true')
    expect(prevented).toBe(true)
  })

  it('does not prevent clicks when enabled', async () => {
    const el = await createItem({href: '#alpha'})
    const anchor = el.shadowRoot!.querySelector('[part="base"]') as HTMLAnchorElement
    let prevented = false

    anchor.addEventListener('click', (event) => {
      prevented = event.defaultPrevented
    })

    anchor.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true, composed: true}))
    await settle(el)

    expect(prevented).toBe(false)
  })

  it('restores href, focusability, and aria state when re-enabled', async () => {
    const el = await createItem({href: '#alpha', disabled: true})
    const anchor = el.shadowRoot!.querySelector('[part="base"]') as HTMLAnchorElement

    expect(anchor.hasAttribute('href')).toBe(false)
    expect(anchor.getAttribute('tabindex')).toBe('-1')

    el.disabled = false
    await settle(el)

    expect(anchor.getAttribute('href')).toBe('#alpha')
    expect(anchor.hasAttribute('aria-disabled')).toBe(false)
    expect(anchor.hasAttribute('tabindex')).toBe(false)
  })

  it('omits aria-current when inactive and clears it when active is reset', async () => {
    const el = await createItem({href: '#alpha', active: true})
    const anchor = el.shadowRoot!.querySelector('[part="base"]') as HTMLAnchorElement
    expect(anchor.getAttribute('aria-current')).toBe('location')

    el.active = false
    await settle(el)

    expect(el.hasAttribute('active')).toBe(false)
    expect(anchor.hasAttribute('aria-current')).toBe(false)
  })

  it('renders no href attribute when href is empty', async () => {
    const el = await createItem()
    const anchor = el.shadowRoot!.querySelector('[part="base"]') as HTMLAnchorElement

    expect(anchor.hasAttribute('href')).toBe(false)
  })

  it('keeps label content available in collapsed rail mode', async () => {
    const el = await createItem({href: '#alpha'})
    el.textContent = 'Threats'
    el.setAttribute('data-sidebar-collapsed', '')
    await settle(el)

    expect(el.textContent).toContain('Threats')
    const slot = el.shadowRoot!.querySelector('[part="label"] slot') as HTMLSlotElement | null
    expect(
      slot
        ?.assignedNodes()
        .map((node) => node.textContent)
        .join(''),
    ).toContain('Threats')
  })

  it('stylesheet keeps collapsed rail labels visually hidden but accessible', () => {
    const cssText = stylesToText()
    const collapsedLabelRule =
      cssText.match(
        /:host\(\[data-sidebar-collapsed\]:not\(\[data-sidebar-mobile\]\)\) \[part='label'\]\s*{(?<body>[\s\S]*?)}/,
      )?.groups?.body ?? ''

    expect(collapsedLabelRule).toContain('clip: rect(0 0 0 0);')
    expect(collapsedLabelRule).toContain('white-space: nowrap;')
    expect(collapsedLabelRule).toContain('opacity: 0;')
    expect(collapsedLabelRule).toContain('transform: translateX(-8px);')
    expect(collapsedLabelRule).not.toMatch(/display:\s*none/)
  })

  it('stylesheet reveals labels and suffixes with non-layout motion', () => {
    const cssText = stylesToText()
    const transitionText = transitionsToText(cssText)

    expect(transitionText).not.toMatch(/\b(?:inline-size|width|grid-template-columns)\b/)
    expect(cssText).toMatch(/\[part='label'\]\s*{[\s\S]*transition:[\s\S]*opacity[\s\S]*transform/)
    expect(cssText).toMatch(
      /\[part='suffix'\]\s*{[\s\S]*transition:[\s\S]*opacity[\s\S]*transform[\s\S]*display/,
    )
    expect(cssText).toContain('transition-behavior: allow-discrete')
    expect(cssText).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*{[\s\S]*\[part='label'\],[\s\S]*\[part='suffix'\]\s*{[\s\S]*transition:\s*none;[\s\S]*transform:\s*none;/,
    )
  })
})
