import {afterEach, describe, expect, it} from 'vitest'

import {CVOperationQueue} from './cv-operation-queue'

CVOperationQueue.define()

const settle = async (element: CVOperationQueue) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
}

const createOperationQueue = async (attrs?: Partial<CVOperationQueue>, children = '') => {
  const element = document.createElement('cv-operation-queue') as CVOperationQueue
  if (attrs) Object.assign(element, attrs)
  element.innerHTML = children
  document.body.append(element)
  await settle(element)
  return element
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('cv-operation-queue', () => {
  it('renders labelled queue shell with summary and actions slots', async () => {
    const element = await createOperationQueue(
      {label: 'Upload queue', busy: true, tone: 'info'},
      '<span slot="summary">2 active</span><button slot="actions">Cancel</button><div>Task</div>',
    )
    const base = element.shadowRoot!.querySelector('[part="base"]') as HTMLElement

    expect(base.getAttribute('aria-label')).toBe('Upload queue')
    expect(base.getAttribute('aria-busy')).toBe('true')
    expect(base.getAttribute('data-tone')).toBe('info')
    expect(element.shadowRoot!.querySelector('slot[name="summary"]')).not.toBeNull()
    expect(element.shadowRoot!.querySelector('[part="summary"]')).not.toBeNull()
    expect(element.shadowRoot!.querySelector('slot[name="actions"]')).not.toBeNull()
    expect(element.shadowRoot!.querySelector('[part="body"] slot:not([name])')).not.toBeNull()
  })

  it('renders empty slot when empty', async () => {
    const element = await createOperationQueue({empty: true}, '<span slot="empty">No operations</span>')

    expect(element.shadowRoot!.querySelector('[part="empty"] slot[name="empty"]')).not.toBeNull()
    expect(element.shadowRoot!.querySelector('[part="body"]')).toBeNull()
  })

  it('reflects density', async () => {
    const element = await createOperationQueue({density: 'compact'})
    expect(element.getAttribute('density')).toBe('compact')
  })
})
