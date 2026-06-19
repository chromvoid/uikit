import {afterEach, describe, expect, it} from 'vitest'

import {CVPagination, type CVPaginationChangeEvent} from './cv-pagination'

CVPagination.define()

const settle = async (element: CVPagination) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
}

const createPagination = async (attrs?: Partial<CVPagination>) => {
  const element = document.createElement('cv-pagination') as CVPagination
  if (attrs) {
    Object.assign(element, attrs)
  }
  document.body.append(element)
  await settle(element)
  return element
}

const getButtons = (element: CVPagination) =>
  Array.from(element.shadowRoot!.querySelectorAll('[part~="button"]')) as HTMLButtonElement[]

afterEach(() => {
  document.body.innerHTML = ''
})

describe('cv-pagination', () => {
  it('renders navigation with current page semantics', async () => {
    const element = await createPagination({page: 2, pageCount: 3})
    const current = getButtons(element).find((button) => button.getAttribute('aria-current') === 'page')

    expect(element.shadowRoot!.querySelector('nav')!.getAttribute('aria-label')).toBe('Pagination')
    expect(current?.textContent?.trim()).toBe('2')
    expect(current?.disabled).toBe(true)
  })

  it('updates page and emits cv-page-change when a page button is clicked', async () => {
    const element = await createPagination({page: 1, pageCount: 3})
    const changes: Array<CVPaginationChangeEvent['detail']> = []
    element.addEventListener('cv-page-change', (event) => {
      changes.push((event as CVPaginationChangeEvent).detail)
    })

    const pageThree = getButtons(element).find((button) => button.dataset.page === '3')!
    pageThree.click()
    await settle(element)

    expect(element.page).toBe(3)
    expect(changes).toEqual([{page: 3, previousPage: 1}])
  })

  it('allows controlled page writes while disabled', async () => {
    const element = await createPagination({page: 1, pageCount: 3, disabled: true})

    element.page = 2
    await settle(element)

    expect(element.page).toBe(2)
    const current = getButtons(element).find((button) => button.getAttribute('aria-current') === 'page')
    expect(current?.textContent?.trim()).toBe('2')
  })
})
