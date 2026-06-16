import {afterEach, describe, expect, it, vi} from 'vitest'

import {CVImageViewer, type CVImageViewerItem} from './cv-image-viewer'

CVImageViewer.define()

const ITEMS: CVImageViewerItem[] = [
  {
    id: 1,
    title: 'one.jpg',
    alt: 'First image',
    meta: ['image/jpeg'],
    src: 'blob:one',
    thumbnailSrc: 'blob:one-thumb',
  },
  {
    id: 2,
    title: 'two.jpg',
    src: 'blob:two',
    thumbnailSrc: 'blob:two-thumb',
  },
  {
    id: 3,
    title: 'three.jpg',
    src: 'blob:three',
    thumbnailSrc: 'blob:three-thumb',
  },
]

const settle = async (element: CVImageViewer) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
  await Promise.resolve()
}

async function mountViewer(options: Partial<CVImageViewer> = {}) {
  const viewer = document.createElement('cv-image-viewer') as CVImageViewer
  viewer.items = ITEMS
  viewer.open = true
  Object.assign(viewer, options)
  document.body.append(viewer)
  await settle(viewer)
  return viewer
}

function getBase(viewer: CVImageViewer) {
  const base = viewer.shadowRoot?.querySelector('[part="base"]') as HTMLElement | null
  expect(base).not.toBeNull()
  return base!
}

async function getDialogContent(viewer: CVImageViewer) {
  const dialog = viewer.shadowRoot?.querySelector('cv-dialog') as
    | (HTMLElement & {updateComplete?: Promise<unknown>})
    | null
  expect(dialog).not.toBeNull()
  await dialog!.updateComplete

  const content = dialog!.shadowRoot?.querySelector('[part="content"]') as HTMLElement | null
  expect(content).not.toBeNull()
  return content!
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('cv-image-viewer', () => {
  it('renders the modal shell, header, fallback image viewport, and controls', async () => {
    const viewer = await mountViewer({currentIndex: 1})
    const base = getBase(viewer)
    const dialogContent = await getDialogContent(viewer)
    const image = viewer.shadowRoot?.querySelector<HTMLImageElement>('[part="image"]')
    const labelledBy = dialogContent.getAttribute('aria-labelledby')
    const dialogRoot =
      dialogContent.getRootNode() instanceof ShadowRoot ? (dialogContent.getRootNode() as ShadowRoot) : null
    const titleSlot = dialogRoot?.querySelector<HTMLSlotElement>('slot[name="title"]')

    expect(dialogContent.getAttribute('role')).toBe('dialog')
    expect(dialogContent.getAttribute('aria-modal')).toBe('true')
    expect(dialogContent.shadowRoot).toBeNull()
    expect(labelledBy).toBeTruthy()
    expect(dialogRoot?.getElementById(labelledBy!)?.querySelector('slot[name="title"]')).toBe(titleSlot)
    expect(titleSlot?.assignedElements({flatten: true}).at(0)?.textContent).toContain('two.jpg')
    expect(base.hasAttribute('role')).toBe(false)
    expect(base.hasAttribute('aria-modal')).toBe(false)
    expect(base.hasAttribute('aria-label')).toBe(false)
    expect(viewer.shadowRoot?.querySelector('[part="title"]')?.textContent).toContain('two.jpg')
    expect(viewer.shadowRoot?.querySelector('[part="meta"]')?.textContent).toContain('2 / 3')
    expect(image?.getAttribute('src')).toBe('blob:two')
    expect(image?.getAttribute('alt')).toBe('two.jpg')
    expect(viewer.shadowRoot?.querySelector('[part~="nav-previous"]')).not.toBeNull()
    expect(viewer.shadowRoot?.querySelector('[part~="nav-next"]')).not.toBeNull()
  })

  it('emits typed navigation and close events from keyboard input', async () => {
    const viewer = await mountViewer()
    const inputs: unknown[] = []
    const changes: unknown[] = []
    const closes: unknown[] = []

    viewer.addEventListener('cv-input', (event) => inputs.push(event.detail))
    viewer.addEventListener('cv-change', (event) => changes.push(event.detail))
    viewer.addEventListener('cv-close', (event) => closes.push(event.detail))

    getBase(viewer).dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight', bubbles: true}))
    await settle(viewer)
    expect(viewer.currentIndex).toBe(0)
    expect(changes).toEqual([])
    viewer.currentIndex = 1
    await settle(viewer)
    getBase(viewer).dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))

    expect(inputs).toEqual([
      {
        index: 1,
        itemId: 2,
        direction: 'forward',
        source: 'keyboard',
      },
    ])
    expect(changes).toEqual(inputs)
    expect(closes).toEqual([{reason: 'escape'}])
  })

  it('emits programmatic committed changes without navigation input', async () => {
    const viewer = await mountViewer()
    const inputs: unknown[] = []
    const changes: unknown[] = []

    viewer.addEventListener('cv-input', (event) => inputs.push(event.detail))
    viewer.addEventListener('cv-change', (event) => changes.push(event.detail))

    viewer.currentIndex = 2
    await settle(viewer)

    expect(inputs).toEqual([])
    expect(changes).toEqual([
      {
        index: 2,
        itemId: 3,
        direction: 'forward',
        source: 'programmatic',
      },
    ])
  })

  it('emits action details and ignores disabled or loading actions', async () => {
    const viewer = await mountViewer({
      actions: [
        {value: 'download', label: 'Download', icon: 'download'},
        {value: 'share', label: 'Share', icon: 'share-2', loading: true},
        {value: 'delete', label: 'Delete', icon: 'trash', disabled: true},
      ],
    })
    const actions: unknown[] = []
    viewer.addEventListener('cv-action', (event) => actions.push(event.detail))

    ;(viewer.shadowRoot?.querySelector('[data-action="download"]') as HTMLElement | null)?.click()
    ;(viewer.shadowRoot?.querySelector('[data-action="share"]') as HTMLElement | null)?.click()
    ;(viewer.shadowRoot?.querySelector('[data-action="delete"]') as HTMLElement | null)?.click()

    expect(actions).toEqual([{value: 'download', itemId: 1, index: 0}])
  })

  it('marks dangerous direct and overflow actions', async () => {
    const viewer = await mountViewer({
      actions: [
        {value: 'download', label: 'Download', icon: 'download'},
        {value: 'delete', label: 'Delete', icon: 'trash', dangerous: true},
        {value: 'share', label: 'Share', icon: 'share-2'},
        {value: 'erase', label: 'Erase', icon: 'trash', dangerous: true},
      ],
    })

    expect(
      viewer.shadowRoot
        ?.querySelector<HTMLElement>('cv-button[data-action="delete"]')
        ?.getAttribute('data-dangerous'),
    ).toBe('true')
    expect(
      viewer.shadowRoot
        ?.querySelector<HTMLElement>('cv-menu-item[data-action="erase"]')
        ?.getAttribute('data-dangerous'),
    ).toBe('true')
  })

  it('renders bounded virtual thumbnails and emits thumbnail navigation', async () => {
    const viewer = await mountViewer({
      thumbnailWindow: {
        indices: [0, 2],
        beforeCount: 1,
        afterCount: 4,
        thumbnailStepPx: 64,
      },
    })
    const inputs: unknown[] = []
    const changes: unknown[] = []
    viewer.addEventListener('cv-input', (event) => inputs.push(event.detail))
    viewer.addEventListener('cv-change', (event) => changes.push(event.detail))

    const thumbnails = Array.from(
      viewer.shadowRoot?.querySelectorAll<HTMLButtonElement>('[part="thumbnail"]') ?? [],
    )
    expect(thumbnails.map((thumbnail) => thumbnail.dataset['index'])).toEqual(['0', '2'])
    expect(viewer.shadowRoot?.textContent).toContain('+1')
    expect(viewer.shadowRoot?.textContent).toContain('+4')

    thumbnails[1]?.click()
    await settle(viewer)
    expect(viewer.currentIndex).toBe(0)
    viewer.currentIndex = 2
    await settle(viewer)

    expect(inputs).toEqual([
      {
        index: 2,
        itemId: 3,
        direction: 'forward',
        source: 'thumbnail',
      },
    ])
    expect(changes).toEqual(inputs)
  })

  it('supports slotted viewport, footer, and overlay content', async () => {
    const viewport = document.createElement('div')
    viewport.slot = 'viewport'
    viewport.textContent = 'custom viewport'
    const footer = document.createElement('div')
    footer.slot = 'footer'
    footer.textContent = 'custom footer'
    const overlay = document.createElement('div')
    overlay.slot = 'overlay'
    overlay.textContent = 'custom overlay'

    const viewer = document.createElement('cv-image-viewer') as CVImageViewer
    viewer.items = ITEMS
    viewer.open = true
    viewer.append(viewport, footer, overlay)
    document.body.append(viewer)
    await settle(viewer)

    expect(
      (viewer.shadowRoot?.querySelector('slot[name="viewport"]') as HTMLSlotElement | null)
        ?.assignedElements()
        .at(0),
    ).toBe(viewport)
    expect(
      (viewer.shadowRoot?.querySelector('slot[name="footer"]') as HTMLSlotElement | null)
        ?.assignedElements()
        .at(0),
    ).toBe(footer)
    expect(
      (viewer.shadowRoot?.querySelector('slot[name="overlay"]') as HTMLSlotElement | null)
        ?.assignedElements()
        .at(0),
    ).toBe(overlay)
  })

  it('emits image render errors and prime/thumbnail metric requests', async () => {
    const primes: unknown[] = []
    const metrics: unknown[] = []
    const imageErrors: unknown[] = []
    const viewer = document.createElement('cv-image-viewer') as CVImageViewer
    viewer.items = ITEMS
    viewer.open = true
    viewer.addEventListener('cv-prime', (event) => primes.push(event.detail))
    viewer.addEventListener('cv-thumbnail-metrics', (event) => metrics.push(event.detail))
    viewer.addEventListener('cv-image-error', (event) => imageErrors.push(event.detail))
    document.body.append(viewer)
    await settle(viewer)

    const image = viewer.shadowRoot?.querySelector<HTMLImageElement>('[part="image"]')
    image?.dispatchEvent(new Event('error'))

    expect(primes).toContainEqual({index: 0, itemId: 1, reason: 'open'})
    expect(metrics).toContainEqual({viewportWidth: 0, thumbnailStepPx: 64, centerIndex: 0})
    expect(imageErrors).toEqual([{itemId: 1, index: 0, sourceUrl: 'blob:one'}])
  })

  it('does not emit built-in thumbnail metrics when thumbnails are slotted out', async () => {
    const metrics: unknown[] = []
    const footer = document.createElement('div')
    footer.slot = 'footer'
    footer.textContent = 'custom thumbnails'

    const viewer = document.createElement('cv-image-viewer') as CVImageViewer
    viewer.items = ITEMS
    viewer.open = true
    viewer.showThumbnails = false
    viewer.append(footer)
    viewer.addEventListener('cv-thumbnail-metrics', (event) => metrics.push(event.detail))
    document.body.append(viewer)
    await settle(viewer)

    expect(metrics).toEqual([])
  })

  it('renders loading, error, empty, and busy states', async () => {
    const loading = await mountViewer({
      items: [{id: 'loading', title: 'loading.jpg', loading: true}],
      busy: true,
      busyLabel: 'Preparing file',
    })
    expect(loading.shadowRoot?.querySelector('[part="state"] cv-spinner')).not.toBeNull()
    expect(loading.shadowRoot?.querySelector('[part="busy-overlay"]')).not.toBeNull()
    expect(loading.shadowRoot?.textContent).toContain('Preparing file')
    loading.remove()

    const error = await mountViewer({
      items: [{id: 'error', title: 'broken.jpg', error: 'Cannot render image'}],
    })
    expect(error.shadowRoot?.querySelector('[part="state"]')?.textContent).toContain('Cannot render image')
    error.remove()

    const empty = await mountViewer({items: []})
    expect(empty.shadowRoot?.querySelector('[part="state"]')?.textContent).toContain('No image selected')
  })
})
