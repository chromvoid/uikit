import {afterEach, describe, expect, it} from 'vitest'

import {CVChip, type CVChipActionDetail, type CVChipRemoveDetail} from './cv-chip'

CVChip.define()

const settle = async (element: CVChip) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
}

const createChip = async (attrs?: Partial<CVChip>, text = 'Chip') => {
  const element = document.createElement('cv-chip') as CVChip
  if (attrs) Object.assign(element, attrs)
  element.textContent = text
  document.body.append(element)
  await settle(element)
  return element
}

const getBase = (element: CVChip) => element.shadowRoot!.querySelector('[part="base"]') as HTMLElement
const getRemoveButton = (element: CVChip) =>
  element.shadowRoot!.querySelector('[part="remove-button"]') as HTMLButtonElement | null
const getStylesText = () =>
  (CVChip.styles as Array<{cssText?: string}>).map((style) => style.cssText ?? '').join('\n')

afterEach(() => {
  document.body.innerHTML = ''
})

describe('cv-chip', () => {
  describe('style contract', () => {
    it('keeps long labels single-line inside constrained chips', () => {
      const stylesText = getStylesText()

      expect(stylesText).toMatch(/\[part='base'\]\s*{[\s\S]*min-inline-size:\s*0;/)
      expect(stylesText).toMatch(/\[part='base'\]\s*{[\s\S]*overflow:\s*hidden;/)
      expect(stylesText).toMatch(/\[part='base'\]\s*{[\s\S]*white-space:\s*nowrap;/)
      expect(stylesText).toMatch(/\[part='label'\]\s*{[\s\S]*min-inline-size:\s*0;/)
      expect(stylesText).toMatch(/\[part='label'\]\s*{[\s\S]*overflow:\s*hidden;/)
      expect(stylesText).toMatch(/\[part='label'\]\s*{[\s\S]*text-overflow:\s*ellipsis;/)
      expect(stylesText).toMatch(/\[part='label'\]\s*{[\s\S]*white-space:\s*nowrap;/)
      expect(stylesText).toContain("[part='remove-button']")
      expect(stylesText).toContain('flex: 0 0 auto;')
    })

    it('applies enhanced corner shaping as a progressive enhancement', () => {
      const stylesText = getStylesText()

      expect(stylesText).toMatch(/\[part='base'\]\s*{[\s\S]*border-radius:\s*var\(--cv-chip-radius,/)
      expect(stylesText).toContain('@supports (corner-shape: squircle)')
      expect(stylesText).toContain('corner-shape: var(--cv-chip-corner-shape, squircle);')
      expect(stylesText).toMatch(/:host\(\[pill\]\) \[part='base'\]\s*{[\s\S]*corner-shape:\s*round;/)
    })
  })

  it('renders action chip parts and accessibility state', async () => {
    const element = await createChip({value: 'alpha', selected: true, removable: true})
    const base = getBase(element)

    expect(base.getAttribute('role')).toBe('button')
    expect(base.getAttribute('tabindex')).toBe('0')
    expect(base.getAttribute('aria-pressed')).toBe('true')
    expect(element.shadowRoot!.querySelector('[part="prefix"] slot[name="prefix"]')).not.toBeNull()
    expect(element.shadowRoot!.querySelector('[part="label"] slot:not([name])')).not.toBeNull()
    expect(element.shadowRoot!.querySelector('[part="suffix"] slot[name="suffix"]')).not.toBeNull()
    expect(getRemoveButton(element)).not.toBeNull()
  })

  it('emits action details for click and keyboard activation', async () => {
    const element = await createChip({value: 'alpha'})
    const details: CVChipActionDetail[] = []
    element.addEventListener('cv-chip-action', (event) => {
      details.push((event as CustomEvent<CVChipActionDetail>).detail)
    })

    getBase(element).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    getBase(element).dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}))
    await settle(element)

    expect(details).toEqual([
      {value: 'alpha', source: 'click'},
      {value: 'alpha', source: 'keyboard'},
    ])
  })

  it('emits remove without also emitting action', async () => {
    const element = await createChip({value: 'alpha', removable: true})
    const removes: CVChipRemoveDetail[] = []
    let actionCount = 0
    element.addEventListener('cv-chip-remove', (event) => {
      removes.push((event as CustomEvent<CVChipRemoveDetail>).detail)
    })
    element.addEventListener('cv-chip-action', () => actionCount++)

    getRemoveButton(element)!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(element)

    expect(removes).toEqual([{value: 'alpha'}])
    expect(actionCount).toBe(0)
  })

  it('is inert when disabled', async () => {
    const element = await createChip({value: 'alpha', disabled: true, removable: true})
    let actionCount = 0
    let removeCount = 0
    element.addEventListener('cv-chip-action', () => actionCount++)
    element.addEventListener('cv-chip-remove', () => removeCount++)

    getBase(element).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    getRemoveButton(element)!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(element)

    expect(getBase(element).getAttribute('tabindex')).toBe('-1')
    expect(actionCount).toBe(0)
    expect(removeCount).toBe(0)
  })
})
