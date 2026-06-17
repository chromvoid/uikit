import {afterEach, describe, expect, it} from 'vitest'

import {CVSkeleton} from './cv-skeleton'

CVSkeleton.define()

const settle = async (element: CVSkeleton) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
}

const createSkeleton = async (attrs?: Partial<CVSkeleton>) => {
  const element = document.createElement('cv-skeleton') as CVSkeleton
  if (attrs) Object.assign(element, attrs)
  document.body.append(element)
  await settle(element)
  return element
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('cv-skeleton', () => {
  it('renders non-decorative loading status by default', async () => {
    const element = await createSkeleton()
    const base = element.shadowRoot!.querySelector('[part="base"]') as HTMLElement

    expect(base.getAttribute('role')).toBe('status')
    expect(base.getAttribute('aria-label')).toBe('Loading')
    expect(base.hasAttribute('aria-hidden')).toBe(false)
    expect(element.shadowRoot!.querySelectorAll('[part="line"]')).toHaveLength(1)
  })

  it('supports decorative mode without status semantics', async () => {
    const element = await createSkeleton({decorative: true})
    const base = element.shadowRoot!.querySelector('[part="base"]') as HTMLElement

    expect(base.hasAttribute('role')).toBe(false)
    expect(base.hasAttribute('aria-label')).toBe(false)
    expect(base.getAttribute('aria-hidden')).toBe('true')
  })

  it('renders clamped text lines', async () => {
    const element = await createSkeleton({variant: 'text', lines: 3})
    expect(element.getAttribute('variant')).toBe('text')
    expect(element.shadowRoot!.querySelectorAll('[part="line"]')).toHaveLength(3)

    element.lines = -4
    await settle(element)
    expect(element.shadowRoot!.querySelectorAll('[part="line"]')).toHaveLength(1)
  })

  it('reflects animated and circle variant attributes', async () => {
    const element = await createSkeleton({variant: 'circle', animated: false})
    expect(element.getAttribute('variant')).toBe('circle')
    expect(element.hasAttribute('animated')).toBe(false)
  })
})
