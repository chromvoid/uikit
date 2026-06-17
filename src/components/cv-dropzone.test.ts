import {afterEach, describe, expect, it} from 'vitest'

import {CVDropzone} from './cv-dropzone'

CVDropzone.define()

const settle = async (element: CVDropzone) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
}

const createDropzone = async (attrs?: Partial<CVDropzone>, children = '') => {
  const element = document.createElement('cv-dropzone') as CVDropzone
  if (attrs) Object.assign(element, attrs)
  element.innerHTML = children
  document.body.append(element)
  await settle(element)
  return element
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('cv-dropzone', () => {
  it('renders controlled content and overlay shell', async () => {
    const element = await createDropzone({active: true, message: 'Drop files'}, '<div>Files</div>')
    const base = element.shadowRoot!.querySelector('[part="base"]') as HTMLElement

    expect(element.hasAttribute('active')).toBe(true)
    expect(base.getAttribute('aria-busy')).toBe('false')
    expect(base.getAttribute('aria-disabled')).toBe('false')
    expect(element.shadowRoot!.querySelector('[part="content"] slot')).not.toBeNull()
    expect(element.shadowRoot!.querySelector('[part="overlay"]')?.textContent?.trim()).toBe('Drop files')
  })

  it('renders loading overlay with status semantics', async () => {
    const element = await createDropzone({loading: true, loadingLabel: 'Uploading'})
    const overlay = element.shadowRoot!.querySelector('[part="loading-overlay"]') as HTMLElement

    expect(element.shadowRoot!.querySelector('[part="base"]')?.getAttribute('aria-busy')).toBe('true')
    expect(overlay.getAttribute('role')).toBe('status')
    expect(overlay.textContent).toContain('Uploading')
  })

  it('reflects disabled state without owning drag events', async () => {
    const element = await createDropzone({disabled: true})
    const base = element.shadowRoot!.querySelector('[part="base"]') as HTMLElement

    expect(element.hasAttribute('disabled')).toBe(true)
    expect(base.getAttribute('aria-disabled')).toBe('true')
  })
})
