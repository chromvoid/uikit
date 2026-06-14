import {readFileSync} from 'node:fs'

import {afterEach, describe, expect, it} from 'vitest'

import {CVGuidancePanel, type GuidancePanelDensity, type GuidancePanelVariant} from './cv-guidance-panel'

CVGuidancePanel.define()

const settle = async (element: CVGuidancePanel) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
}

const createGuidancePanel = async (attrs?: Partial<CVGuidancePanel>) => {
  const el = document.createElement('cv-guidance-panel') as CVGuidancePanel
  if (attrs) Object.assign(el, attrs)
  document.body.append(el)
  await settle(el)
  return el
}

const getBase = (el: CVGuidancePanel) => el.shadowRoot!.querySelector('[part="base"]') as HTMLElement

function stylesToText(styles: unknown): string {
  const values = Array.isArray(styles) ? styles : [styles]
  return values
    .map((value) => {
      if (value == null) return ''
      return typeof value === 'object' && 'cssText' in (value as object)
        ? String((value as {cssText: string}).cssText)
        : String(value)
    })
    .join('\n')
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('cv-guidance-panel', () => {
  it('has product-agnostic default properties', async () => {
    const el = await createGuidancePanel()

    expect(el.variant).toBe('coach-mark')
    expect(el.density).toBe('comfortable')
    expect(el.getAttribute('variant')).toBe('coach-mark')
    expect(el.getAttribute('density')).toBe('comfortable')
  })

  it('reflects supported variants and exposes them on the base part', async () => {
    const variants: GuidancePanelVariant[] = ['coach-mark', 'hint', 'warning', 'blocked']

    for (const variant of variants) {
      const el = await createGuidancePanel({variant})

      expect(el.variant).toBe(variant)
      expect(el.getAttribute('variant')).toBe(variant)
      expect(getBase(el).getAttribute('data-variant')).toBe(variant)

      el.remove()
    }
  })

  it('reflects supported densities and exposes them on the base part', async () => {
    const densities: GuidancePanelDensity[] = ['comfortable', 'compact']

    for (const density of densities) {
      const el = await createGuidancePanel({density})

      expect(el.density).toBe(density)
      expect(el.getAttribute('density')).toBe(density)
      expect(getBase(el).getAttribute('data-density')).toBe(density)

      el.remove()
    }
  })

  it('renders neutral accessible structure without overlay semantics', async () => {
    const el = await createGuidancePanel()
    const base = getBase(el)

    expect(base.tagName.toLowerCase()).toBe('section')
    expect(base.getAttribute('role')).toBe('note')
    expect(base.hasAttribute('aria-live')).toBe(false)
    expect(base.hasAttribute('aria-modal')).toBe(false)
    expect(base.hasAttribute('tabindex')).toBe(false)
  })

  it('renders stable slots and CSS parts for guidance content', async () => {
    const el = await createGuidancePanel()
    const expectedParts = ['base', 'header', 'icon', 'title', 'progress', 'body', 'actions']

    for (const part of expectedParts) {
      expect(el.shadowRoot!.querySelector(`[part="${part}"]`)).not.toBeNull()
    }

    expect(el.shadowRoot!.querySelector('[part="icon"] slot[name="icon"]')).not.toBeNull()
    expect(el.shadowRoot!.querySelector('[part="title"] slot[name="title"]')).not.toBeNull()
    expect(el.shadowRoot!.querySelector('[part="progress"] slot[name="progress"]')).not.toBeNull()
    expect(el.shadowRoot!.querySelector('[part="body"] slot:not([name])')).not.toBeNull()
    expect(el.shadowRoot!.querySelector('[part="actions"] slot[name="actions"]')).not.toBeNull()
  })

  it('projects slotted title, body, actions, and progress content', async () => {
    const el = await createGuidancePanel()
    const icon = document.createElement('span')
    icon.slot = 'icon'
    icon.textContent = 'i'
    const title = document.createElement('span')
    title.slot = 'title'
    title.textContent = 'Vault basics'
    const body = document.createElement('p')
    body.textContent = 'Create your first item.'
    const actions = document.createElement('button')
    actions.slot = 'actions'
    actions.textContent = 'Start'
    const progress = document.createElement('span')
    progress.slot = 'progress'
    progress.textContent = '1 / 4'

    el.append(icon, title, body, actions, progress)
    await settle(el)

    expect(
      (el.shadowRoot!.querySelector('[part="title"] slot') as HTMLSlotElement).assignedElements(),
    ).toEqual([title])
    expect(
      (el.shadowRoot!.querySelector('[part="body"] slot') as HTMLSlotElement).assignedElements(),
    ).toEqual([body])
    expect(
      (el.shadowRoot!.querySelector('[part="actions"] slot') as HTMLSlotElement).assignedElements(),
    ).toEqual([actions])
    expect(
      (el.shadowRoot!.querySelector('[part="progress"] slot') as HTMLSlotElement).assignedElements(),
    ).toEqual([progress])
    expect(el.hasIcon).toBe(true)
    expect(el.hasAttribute('has-icon')).toBe(true)
  })

  it('does not reserve the icon column when no icon is provided', async () => {
    const el = await createGuidancePanel()

    expect(el.hasIcon).toBe(false)
    expect(el.hasAttribute('has-icon')).toBe(false)
  })

  it('clears has-icon when the slotted icon content is removed', async () => {
    const el = await createGuidancePanel()
    const icon = document.createElement('span')
    icon.slot = 'icon'
    icon.textContent = 'i'
    el.append(icon)
    await settle(el)

    expect(el.hasIcon).toBe(true)
    expect(el.hasAttribute('has-icon')).toBe(true)

    icon.remove()
    await settle(el)

    expect(el.hasIcon).toBe(false)
    expect(el.hasAttribute('has-icon')).toBe(false)
  })

  it('updates data-variant and data-density when changed at runtime', async () => {
    const el = await createGuidancePanel()

    el.variant = 'warning'
    el.density = 'compact'
    await settle(el)

    expect(getBase(el).getAttribute('data-variant')).toBe('warning')
    expect(getBase(el).getAttribute('data-density')).toBe('compact')
    expect(el.getAttribute('variant')).toBe('warning')
    expect(el.getAttribute('density')).toBe('compact')
  })

  it('uses top-level host selectors for density and variant states', () => {
    const cssText = stylesToText(CVGuidancePanel.styles)

    expect(cssText).toContain(":host([density='compact']) [part='base']")
    expect(cssText).toContain(":host([variant='coach-mark']) [part='base']")
    expect(cssText).toContain(":host([variant='hint']) [part='base']")
    expect(cssText).toContain(":host([variant='warning']) [part='base']")
    expect(cssText).toContain(":host([variant='blocked']) [part='base']")
    expect(cssText).not.toContain('&:host')
    expect(cssText).not.toContain('&[variant=')
  })

  it('does not import app-layer guidance, routing, navigation, or i18n modules', () => {
    const source = readFileSync('src/components/cv-guidance-panel.ts', 'utf8')

    expect(source).not.toMatch(/apps\/webview|root\/|navigation|router|moduleAccessModel|guidanceModel|i18n/)
    expect(source).not.toMatch(/guidance\.(model|registry|types|constants|validation)/)
  })
})
