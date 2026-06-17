import {afterEach, describe, expect, it} from 'vitest'

import {CVTaskList} from './cv-task-list'

CVTaskList.define()

const settle = async (element: CVTaskList) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
}

const createTaskList = async (attrs?: Partial<CVTaskList>, children = '') => {
  const element = document.createElement('cv-task-list') as CVTaskList
  if (attrs) Object.assign(element, attrs)
  element.innerHTML = children
  document.body.append(element)
  await settle(element)
  return element
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('cv-task-list', () => {
  it('renders labelled list shell for slotted rows', async () => {
    const element = await createTaskList({label: 'Uploads', busy: true}, '<div role="listitem">A</div>')
    const base = element.shadowRoot!.querySelector('[part="base"]') as HTMLElement

    expect(base.getAttribute('aria-label')).toBe('Uploads')
    expect(base.getAttribute('aria-busy')).toBe('true')
    expect(element.shadowRoot!.querySelector('[part="list"]')?.getAttribute('role')).toBe('list')
    expect(element.shadowRoot!.querySelector('slot:not([name])')).not.toBeNull()
  })

  it('renders empty slot instead of list when empty', async () => {
    const element = await createTaskList({empty: true}, '<span slot="empty">Nothing queued</span>')

    expect(element.shadowRoot!.querySelector('[part="empty"] slot[name="empty"]')).not.toBeNull()
    expect(element.shadowRoot!.querySelector('[part="list"]')).toBeNull()
  })

  it('reflects density', async () => {
    const element = await createTaskList({density: 'compact'})
    expect(element.getAttribute('density')).toBe('compact')
  })
})
