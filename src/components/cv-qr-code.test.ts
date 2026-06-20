import {afterEach, describe, expect, it} from 'vitest'

import {CVQrCode} from './cv-qr-code'

CVQrCode.define()

const stylesToText = () =>
  (CVQrCode.styles as Array<{cssText?: string}>).map((style) => style.cssText ?? '').join('\n')

const settle = async (element: CVQrCode) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
  await Promise.resolve()
}

const createQrCode = async (props?: Partial<CVQrCode>, attrs?: Record<string, string>, children?: Node[]) => {
  const element = document.createElement('cv-qr-code') as CVQrCode
  if (attrs) {
    for (const [name, value] of Object.entries(attrs)) {
      element.setAttribute(name, value)
    }
  }
  if (props) Object.assign(element, props)
  if (children) element.append(...children)
  document.body.append(element)
  await settle(element)
  return element
}

const getBase = (element: CVQrCode) =>
  element.shadowRoot!.querySelector('[part="base"]') as HTMLElement | null
const getSvg = (element: CVQrCode) => element.shadowRoot!.querySelector('[part="svg"]') as SVGElement | null
const getBackground = (element: CVQrCode) =>
  element.shadowRoot!.querySelector('[part="background"]') as SVGElement | null
const getModules = (element: CVQrCode) =>
  element.shadowRoot!.querySelector('[part="modules"]') as SVGElement | null
const getModuleParts = (element: CVQrCode) =>
  [...element.shadowRoot!.querySelectorAll('[part="module"]')] as SVGElement[]
const getLogo = (element: CVQrCode) =>
  element.shadowRoot!.querySelector('[part="logo"]') as HTMLElement | null
const getLogoBackdrop = (element: CVQrCode) =>
  element.shadowRoot!.querySelector('[part="logo-backdrop"]') as HTMLElement | null
const getLogoContent = (element: CVQrCode) =>
  element.shadowRoot!.querySelector('[part="logo-content"]') as HTMLElement | null
const getLogoSlot = (element: CVQrCode) =>
  element.shadowRoot!.querySelector('slot[name="logo"]') as HTMLSlotElement | null

const createLogo = () => {
  const logo = document.createElement('img')
  logo.slot = 'logo'
  logo.alt = ''
  return logo
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('cv-qr-code', () => {
  it('has correct defaults', async () => {
    const element = await createQrCode()

    expect(element.value).toBe('')
    expect(element.errorCorrection).toBe('M')
    expect(element.quietZone).toBe(4)
    expect(element.moduleShape).toBe('square')
    expect(element.logoSize).toBe('medium')
    expect(element.decorative).toBe(false)
    expect(element.ariaLabel).toBe('QR code')
    expect(element.hasAttribute('empty')).toBe(true)
    expect(element.hasAttribute('invalid')).toBe(false)
    expect(element.hasAttribute('has-logo')).toBe(false)
  })

  it('uses scanner-safe default color tokens independent of theme text colors', () => {
    const cssText = stylesToText()

    expect(cssText).toContain('--cv-qr-code-background: var(--cv-color-qr-background);')
    expect(cssText).toContain('--cv-qr-code-foreground: var(--cv-color-qr-foreground);')
    expect(cssText).not.toContain('--cv-qr-code-background: var(--cv-color-text-strongest);')
  })

  it('does not reflect property-set value to the host attribute', async () => {
    const element = await createQrCode({value: 'otpauth://totp/ChromVoid?secret=ABC'})

    expect(element.getAttribute('value')).toBeNull()
    expect(getModules(element)?.getAttribute('d')).toBeTruthy()
  })

  it('supports value attribute for non-secret declarative usage', async () => {
    const element = await createQrCode(undefined, {value: 'https://chromvoid.com'})

    expect(element.value).toBe('https://chromvoid.com')
    expect(getModules(element)?.getAttribute('d')).toBeTruthy()
  })

  it('renders SVG QR anatomy for a valid value', async () => {
    const element = await createQrCode({value: 'Hi!'})
    const svg = getSvg(element)

    expect(getBase(element)).not.toBeNull()
    expect(svg).not.toBeNull()
    expect(svg!.tagName.toLowerCase()).toBe('svg')
    expect(svg!.getAttribute('viewBox')).toBe('0 0 29 29')
    expect(svg!.getAttribute('role')).toBe('img')
    expect(svg!.getAttribute('aria-label')).toBe('QR code')
    expect(getBackground(element)).not.toBeNull()
    expect(getBackground(element)!.getAttribute('width')).toBe('29')
    expect(getBackground(element)!.getAttribute('height')).toBe('29')
    expect(getModules(element)).not.toBeNull()
    expect(getModules(element)!.tagName.toLowerCase()).toBe('path')
    expect(getModules(element)!.getAttribute('d')).toContain('M')
  })

  it('reflects error-correction and quiet-zone attributes and updates viewBox', async () => {
    const element = await createQrCode({value: 'Hi!', errorCorrection: 'H', quietZone: 2})

    expect(element.getAttribute('error-correction')).toBe('H')
    expect(element.getAttribute('quiet-zone')).toBe('2')
    expect(getSvg(element)!.getAttribute('viewBox')).toBe('0 0 25 25')

    element.quietZone = 0
    await settle(element)

    expect(element.getAttribute('quiet-zone')).toBe('0')
    expect(getSvg(element)!.getAttribute('viewBox')).toBe('0 0 21 21')
  })

  it('falls back to M for unknown runtime error-correction values', async () => {
    const fallback = await createQrCode({value: 'Hi!', errorCorrection: 'M'})
    const fallbackPath = getModules(fallback)!.getAttribute('d')

    document.body.innerHTML = ''

    const invalidRuntimeValue = await createQrCode(undefined, {
      value: 'Hi!',
      'error-correction': 'Z',
    })

    expect(invalidRuntimeValue.errorCorrection).toBe('Z')
    expect(invalidRuntimeValue.hasAttribute('invalid')).toBe(false)
    expect(getModules(invalidRuntimeValue)!.getAttribute('d')).toBe(fallbackPath)
  })

  it('reflects module-shape and renders rounded and dot modules', async () => {
    const element = await createQrCode({value: 'Hi!', moduleShape: 'rounded'})

    expect(element.getAttribute('module-shape')).toBe('rounded')
    expect(getModules(element)!.tagName.toLowerCase()).toBe('g')
    expect(getModuleParts(element).length).toBeGreaterThan(0)
    expect(getModuleParts(element)[0]!.tagName.toLowerCase()).toBe('rect')
    expect(getModuleParts(element)[0]!.getAttribute('rx')).toBe('0.22')

    element.moduleShape = 'dot'
    await settle(element)

    expect(element.getAttribute('module-shape')).toBe('dot')
    expect(getModules(element)!.tagName.toLowerCase()).toBe('g')
    expect(getModuleParts(element).length).toBeGreaterThan(0)
    expect(getModuleParts(element)[0]!.tagName.toLowerCase()).toBe('circle')
    expect(getModuleParts(element)[0]!.getAttribute('r')).toBe('0.5')
  })

  it('falls back to square rendering for unknown runtime module-shape values', async () => {
    const fallback = await createQrCode({value: 'Hi!', moduleShape: 'square'})
    const fallbackPath = getModules(fallback)!.getAttribute('d')

    document.body.innerHTML = ''

    const invalidRuntimeValue = await createQrCode(undefined, {
      value: 'Hi!',
      'module-shape': 'triangle',
    })

    expect(invalidRuntimeValue.moduleShape).toBe('triangle')
    expect(invalidRuntimeValue.getAttribute('module-shape')).toBe('triangle')
    expect(invalidRuntimeValue.hasAttribute('invalid')).toBe(false)
    expect(getModules(invalidRuntimeValue)!.tagName.toLowerCase()).toBe('path')
    expect(getModules(invalidRuntimeValue)!.getAttribute('d')).toBe(fallbackPath)
  })

  it('reflects logo-size and tolerates unknown runtime values', async () => {
    const element = await createQrCode({value: 'Hi!', logoSize: 'large'})

    expect(element.getAttribute('logo-size')).toBe('large')

    element.logoSize = 'small'
    await settle(element)

    expect(element.getAttribute('logo-size')).toBe('small')

    document.body.innerHTML = ''

    const invalidRuntimeValue = await createQrCode(undefined, {
      value: 'Hi!',
      'logo-size': 'huge',
    })

    expect(invalidRuntimeValue.logoSize).toBe('huge')
    expect(invalidRuntimeValue.getAttribute('logo-size')).toBe('huge')
    expect(invalidRuntimeValue.hasAttribute('invalid')).toBe(false)
    expect(getSvg(invalidRuntimeValue)).not.toBeNull()
  })

  it('sets empty state and renders no modules when value is empty', async () => {
    const element = await createQrCode()

    expect(element.hasAttribute('empty')).toBe(true)
    expect(element.hasAttribute('invalid')).toBe(false)
    expect(getSvg(element)).toBeNull()
    expect(getModules(element)).toBeNull()
    expect(element.shadowRoot!.querySelector('[part="placeholder"]')).not.toBeNull()
  })

  it('sets invalid state and renders no modules when value exceeds QR capacity', async () => {
    const element = await createQrCode({value: 'x'.repeat(5000)})

    expect(element.hasAttribute('empty')).toBe(false)
    expect(element.hasAttribute('invalid')).toBe(true)
    expect(getSvg(element)).toBeNull()
    expect(getModules(element)).toBeNull()
  })

  it('renders a centered logo slot for valid QR output', async () => {
    const logo = createLogo()
    const element = await createQrCode({value: 'Hi!', errorCorrection: 'H'}, undefined, [logo])
    const slot = getLogoSlot(element)!

    expect(element.hasAttribute('has-logo')).toBe(true)
    expect(getLogo(element)).not.toBeNull()
    expect(getLogo(element)!.getAttribute('aria-hidden')).toBe('true')
    expect(getLogoBackdrop(element)).not.toBeNull()
    expect(getLogoContent(element)).not.toBeNull()
    expect(slot.assignedElements()).toContain(logo)

    element.value = ''
    await settle(element)

    expect(element.hasAttribute('has-logo')).toBe(false)
    expect(getLogo(element)).toBeNull()
  })

  it('does not render the logo overlay for empty or invalid QR output', async () => {
    const empty = await createQrCode(undefined, undefined, [createLogo()])

    expect(empty.hasAttribute('empty')).toBe(true)
    expect(empty.hasAttribute('has-logo')).toBe(false)
    expect(getLogo(empty)).toBeNull()
    expect(getLogoSlot(empty)).toBeNull()

    document.body.innerHTML = ''

    const invalid = await createQrCode({value: 'x'.repeat(5000)}, undefined, [createLogo()])

    expect(invalid.hasAttribute('invalid')).toBe(true)
    expect(invalid.hasAttribute('has-logo')).toBe(false)
    expect(getLogo(invalid)).toBeNull()
    expect(getLogoSlot(invalid)).toBeNull()
  })

  it('supports decorative mode', async () => {
    const element = await createQrCode({value: 'Hi!', decorative: true}, undefined, [createLogo()])
    const svg = getSvg(element)!

    expect(svg.hasAttribute('role')).toBe(false)
    expect(svg.hasAttribute('aria-label')).toBe(false)
    expect(svg.getAttribute('aria-hidden')).toBe('true')
    expect(getLogo(element)!.getAttribute('aria-hidden')).toBe('true')
  })
})
