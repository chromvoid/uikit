import {afterEach, describe, expect, it} from 'vitest'

import {CVShortcut} from './cv-shortcut'

CVShortcut.define()

const settle = async (element: CVShortcut) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
}

const createShortcut = async (attrs?: Partial<CVShortcut>, children = '') => {
  const element = document.createElement('cv-shortcut') as CVShortcut
  if (attrs) Object.assign(element, attrs)
  element.innerHTML = children
  document.body.append(element)
  await settle(element)
  return element
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('cv-shortcut', () => {
  it('renders label shortcuts as keycaps with separators', async () => {
    const element = await createShortcut({label: 'Ctrl + K'})
    const base = element.shadowRoot!.querySelector('[part="base"]') as HTMLElement

    expect(base.getAttribute('aria-label')).toBe('Ctrl + K')
    expect(element.shadowRoot!.querySelectorAll('cv-kbd[part="key"]')).toHaveLength(2)
    expect(element.shadowRoot!.querySelectorAll('[part="separator"]')).toHaveLength(1)
  })

  it('uses separator for label parsing and rendered separators', async () => {
    const element = await createShortcut({label: 'Shift / Enter', separator: '/'})

    expect(
      Array.from(element.shadowRoot!.querySelectorAll('cv-kbd')).map((node) => node.textContent),
    ).toEqual(['Shift', 'Enter'])
    expect(element.shadowRoot!.querySelector('[part="separator"]')?.textContent).toBe('/')
  })

  it('renders comma-separated keys attribute with custom separator', async () => {
    const host = document.createElement('div')
    host.innerHTML = '<cv-shortcut keys="Shift, Enter" separator="/"></cv-shortcut>'
    document.body.append(host)
    const element = host.querySelector('cv-shortcut') as CVShortcut
    await settle(element)

    expect(
      Array.from(element.shadowRoot!.querySelectorAll('cv-kbd')).map((node) => node.textContent),
    ).toEqual(['Shift', 'Enter'])
    expect(element.shadowRoot!.querySelector('[part="separator"]')?.textContent).toBe('/')
  })

  it('renders keys property before label parsing and supports aria label override', async () => {
    const element = await createShortcut({
      keys: ['⌘', 'Shift', 'P'],
      label: 'Ignored',
      ariaLabel: 'Open command palette',
      separator: ' ',
    })

    expect(element.shadowRoot!.querySelector('[part="base"]')?.getAttribute('aria-label')).toBe(
      'Open command palette',
    )
    expect(
      Array.from(element.shadowRoot!.querySelectorAll('cv-kbd')).map((node) => node.textContent),
    ).toEqual(['⌘', 'Shift', 'P'])
  })

  it('falls back to default slot when no label or keys are provided', async () => {
    const element = await createShortcut({}, '<span>Custom</span>')

    expect(element.shadowRoot!.querySelector('slot:not([name])')).not.toBeNull()
    expect(element.shadowRoot!.querySelectorAll('cv-kbd')).toHaveLength(0)
  })
})
