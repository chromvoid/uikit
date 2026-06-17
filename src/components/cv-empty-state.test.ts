import {afterEach, describe, expect, it} from 'vitest'

import {CVEmptyState} from './cv-empty-state'

CVEmptyState.define()

const settle = async (element: CVEmptyState) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
}

const createEmptyState = async (attrs?: Partial<CVEmptyState>, children = '') => {
  const element = document.createElement('cv-empty-state') as CVEmptyState
  if (attrs) Object.assign(element, attrs)
  element.innerHTML = children
  document.body.append(element)
  await settle(element)
  return element
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('cv-empty-state', () => {
  it('renders status semantics and core parts', async () => {
    const element = await createEmptyState({headline: 'No files', description: 'Drop files here'})
    const base = element.shadowRoot!.querySelector('[part="base"]') as HTMLElement

    expect(base.getAttribute('role')).toBe('status')
    expect(element.shadowRoot!.querySelector('[part="title"]')?.textContent).toBe('No files')
    expect(element.shadowRoot!.querySelector('[part="description"]')?.textContent).toBe('Drop files here')
  })

  it('renders optional icon and reflects variant/icon fill', async () => {
    const element = await createEmptyState({
      icon: 'upload',
      iconFill: true,
      variant: 'dropzone',
    })
    const icon = element.shadowRoot!.querySelector('cv-icon')!

    expect(element.getAttribute('variant')).toBe('dropzone')
    expect(icon.getAttribute('name')).toBe('upload')
    expect(icon.hasAttribute('fill')).toBe(true)
    expect(icon.getAttribute('aria-hidden')).toBe('true')
  })

  it('hides optional description, body, and actions when empty', async () => {
    const element = await createEmptyState({headline: 'Empty'})

    expect(element.shadowRoot!.querySelector('[part="description"]')).toBeNull()
    expect((element.shadowRoot!.querySelector('[part="body"]') as HTMLElement).hidden).toBe(true)
    expect((element.shadowRoot!.querySelector('[part="actions"]') as HTMLElement).hidden).toBe(true)
  })

  it('shows default and actions slots when content is assigned', async () => {
    const element = await createEmptyState(
      {headline: 'Empty'},
      '<p>Body copy</p><button slot="actions">Create</button>',
    )

    expect((element.shadowRoot!.querySelector('[part="body"]') as HTMLElement).hidden).toBe(false)
    expect((element.shadowRoot!.querySelector('[part="actions"]') as HTMLElement).hidden).toBe(false)
  })
})
