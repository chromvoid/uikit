import {afterEach, describe, expect, it, vi} from 'vitest'

import {
  CVIcon,
  getIconBasePath,
  registerIconCollection,
  setIconBasePath,
  unregisterIconCollection,
} from './cv-icon'

CVIcon.define()

type TestableCVIconClass = {
  svgCache: Map<unknown, unknown>
  inFlight: Map<unknown, unknown>
}

const testableCVIcon = CVIcon as unknown as TestableCVIconClass

const settle = async (element: CVIcon) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
}

const createIcon = async (attrs?: Partial<CVIcon>) => {
  const el = document.createElement('cv-icon') as CVIcon
  if (attrs) Object.assign(el, attrs)
  document.body.append(el)
  await settle(el)
  return el
}

afterEach(() => {
  document.body.innerHTML = ''
  setIconBasePath('/assets/icons/lucide')
  unregisterIconCollection('brand')
  testableCVIcon.svgCache.clear()
  testableCVIcon.inFlight.clear()
  vi.unstubAllGlobals()
})

describe('cv-icon', () => {
  it('maps legacy bootstrap icon names to lucide assets', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => '<svg viewBox="0 0 24 24"></svg>',
    }))
    vi.stubGlobal('fetch', fetchMock)

    await createIcon({name: 'folder-fill'})

    expect(fetchMock).toHaveBeenCalledWith('/assets/icons/lucide/folder.svg')
  })

  it('maps check-lg to the lucide check asset', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => '<svg viewBox="0 0 24 24"></svg>',
    }))
    vi.stubGlobal('fetch', fetchMock)

    await createIcon({name: 'check-lg'})

    expect(fetchMock).toHaveBeenCalledWith('/assets/icons/lucide/check.svg')
  })

  it('uses the configured base path when loading icons by name', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => '<svg viewBox="0 0 24 24"></svg>',
    }))
    vi.stubGlobal('fetch', fetchMock)
    setIconBasePath('/custom/icons/')

    await createIcon({name: 'search'})

    expect(getIconBasePath()).toBe('/custom/icons')
    expect(fetchMock).toHaveBeenCalledWith('/custom/icons/search.svg')
  })

  it('loads a direct src URL without name mapping', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => '<svg viewBox="0 0 24 24"></svg>',
    }))
    vi.stubGlobal('fetch', fetchMock)

    await createIcon({src: '/icons/raw.svg'})

    expect(fetchMock).toHaveBeenCalledWith('/icons/raw.svg')
  })

  it('loads namespaced icons from a registered collection', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => '<svg viewBox="0 0 24 24"></svg>',
    }))
    vi.stubGlobal('fetch', fetchMock)
    registerIconCollection('brand', '/assets/icons/brand/')

    await createIcon({name: 'brand:transport'})

    expect(fetchMock).toHaveBeenCalledWith('/assets/icons/brand/transport.svg')
  })

  it('falls back to the default collection when a namespaced icon is missing', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        text: async () => '',
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => '<svg viewBox="0 0 24 24"></svg>',
      })
    vi.stubGlobal('fetch', fetchMock)
    registerIconCollection('brand', '/assets/icons/brand/')

    await createIcon({name: 'brand:search'})

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/assets/icons/brand/search.svg')
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/assets/icons/lucide/search.svg')
  })

  it('renders accessible label metadata when label is provided', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => '<svg viewBox="0 0 24 24"></svg>',
    }))
    vi.stubGlobal('fetch', fetchMock)

    const el = await createIcon({name: 'search', label: 'Search'})
    const wrapper = el.shadowRoot!.querySelector('.icon') as HTMLElement

    expect(wrapper.getAttribute('aria-hidden')).toBe('false')
    expect(wrapper.getAttribute('aria-label')).toBe('Search')
  })

  it('caches fetched SVG markup per URL', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => '<svg viewBox="0 0 24 24"></svg>',
    }))
    vi.stubGlobal('fetch', fetchMock)

    await createIcon({name: 'search'})
    await createIcon({name: 'search'})

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('ignores stale async loads when the icon name changes', async () => {
    let resolveFolderResponse: (() => void) | undefined
    let resolveImageResponse: (() => void) | undefined
    const fetchMock = vi.fn((url: string) => {
      if (url.endsWith('/folder.svg')) {
        return new Promise((resolve) => {
          resolveFolderResponse = () =>
            resolve({
              ok: false,
              text: async () => '',
            })
        })
      }

      if (url.endsWith('/file-image.svg')) {
        return new Promise((resolve) => {
          resolveImageResponse = () =>
            resolve({
              ok: true,
              text: async () => '<svg data-icon="image" viewBox="0 0 24 24"></svg>',
            })
        })
      }

      return Promise.resolve({
        ok: true,
        text: async () => '<svg viewBox="0 0 24 24"></svg>',
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const el = document.createElement('cv-icon') as CVIcon
    document.body.append(el)
    el.name = 'folder-fill'
    await el.updateComplete
    el.name = 'file-earmark-image'
    await el.updateComplete

    expect(resolveFolderResponse).toBeTypeOf('function')
    expect(resolveImageResponse).toBeTypeOf('function')

    resolveImageResponse?.()
    await vi.waitFor(() => {
      expect(el.shadowRoot?.querySelector('svg[data-icon=\"image\"]')).not.toBeNull()
    })

    resolveFolderResponse?.()
    await Promise.resolve()
    await el.updateComplete

    expect(el.shadowRoot?.querySelector('svg[data-icon=\"image\"]')).not.toBeNull()
  })

  it('ignores successful non-SVG responses instead of rendering arbitrary markup', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => '<!doctype html><html><body><chromvoid-app></chromvoid-app></body></html>',
    }))
    vi.stubGlobal('fetch', fetchMock)

    const el = await createIcon({name: 'check-lg'})

    expect(el.shadowRoot?.querySelector('chromvoid-app')).toBeNull()
    expect(el.shadowRoot?.querySelector('svg')).toBeNull()
  })
})
