import {afterEach, describe, expect, it} from 'vitest'

import {CVKbd} from './cv-kbd'

CVKbd.define()

const settle = async (element: CVKbd) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
}

const createKbd = async (attrs?: Partial<CVKbd>, text = 'K') => {
  const element = document.createElement('cv-kbd') as CVKbd
  if (attrs) Object.assign(element, attrs)
  element.textContent = text
  document.body.append(element)
  await settle(element)
  return element
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('cv-kbd', () => {
  it('renders a native kbd with default slot', async () => {
    const element = await createKbd({}, 'Enter')
    const base = element.shadowRoot!.querySelector('[part="base"]') as HTMLElement

    expect(base.tagName).toBe('KBD')
    expect(base.querySelector('slot')).not.toBeNull()
  })

  it('reflects size and tone', async () => {
    const element = await createKbd({size: 'large', tone: 'strong'})

    expect(element.getAttribute('size')).toBe('large')
    expect(element.getAttribute('tone')).toBe('strong')
  })
})
