import {afterEach, describe, expect, it} from 'vitest'

import {CVStatusPill} from './cv-status-pill'

CVStatusPill.define()

const settle = async (element: CVStatusPill) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
}

const createStatusPill = async (attrs?: Partial<CVStatusPill>, children = '') => {
  const element = document.createElement('cv-status-pill') as CVStatusPill
  if (attrs) Object.assign(element, attrs)
  element.innerHTML = children
  document.body.append(element)
  await settle(element)
  return element
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('cv-status-pill', () => {
  it('renders pill status structure with icon and suffix slots', async () => {
    const element = await createStatusPill(
      {tone: 'warning', size: 'small'},
      '<span slot="icon">!</span>Pending<span slot="suffix">3</span>',
    )
    const base = element.shadowRoot!.querySelector('[part="base"]') as HTMLElement

    expect(base.getAttribute('role')).toBe('status')
    expect(element.getAttribute('tone')).toBe('warning')
    expect(element.getAttribute('size')).toBe('small')
    expect(element.shadowRoot!.querySelector('[part="marker"]')).not.toBeNull()
    expect(element.shadowRoot!.querySelector('slot[name="icon"]')).not.toBeNull()
    expect(element.shadowRoot!.querySelector('slot[name="suffix"]')).not.toBeNull()
  })
})
