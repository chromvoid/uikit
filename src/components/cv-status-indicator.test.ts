import {afterEach, describe, expect, it} from 'vitest'

import {CVStatusIndicator} from './cv-status-indicator'

CVStatusIndicator.define()

const settle = async (element: CVStatusIndicator) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
}

const createStatusIndicator = async (attrs?: Partial<CVStatusIndicator>, children = '') => {
  const element = document.createElement('cv-status-indicator') as CVStatusIndicator
  if (attrs) Object.assign(element, attrs)
  element.innerHTML = children
  document.body.append(element)
  await settle(element)
  return element
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('cv-status-indicator', () => {
  it('renders marker, slots, and status semantics', async () => {
    const element = await createStatusIndicator({}, '<span>Online</span><span slot="suffix">2</span>')
    const base = element.shadowRoot!.querySelector('[part="base"]') as HTMLElement

    expect(base.getAttribute('role')).toBe('status')
    expect(element.shadowRoot!.querySelector('[part="marker"]')).not.toBeNull()
    expect(element.shadowRoot!.querySelector('slot:not([name])')).not.toBeNull()
    expect(element.shadowRoot!.querySelector('slot[name="suffix"]')).not.toBeNull()
  })

  it('reflects tone, size, and pulse', async () => {
    const element = await createStatusIndicator({tone: 'success', size: 'large', pulse: true})

    expect(element.getAttribute('tone')).toBe('success')
    expect(element.getAttribute('size')).toBe('large')
    expect(element.hasAttribute('pulse')).toBe(true)
  })

  it('supports decorative mode', async () => {
    const element = await createStatusIndicator({decorative: true})
    const base = element.shadowRoot!.querySelector('[part="base"]') as HTMLElement

    expect(base.hasAttribute('role')).toBe(false)
    expect(base.getAttribute('aria-hidden')).toBe('true')
  })
})
