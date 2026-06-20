import {afterEach, describe, expect, it, vi} from 'vitest'

import {CVAccordion} from './cv-accordion'
import {CVAccordionItem} from './cv-accordion-item'

const settle = async (element: CVAccordion) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
}

const createItem = (value: string, label: string, content: string) => {
  const item = document.createElement('cv-accordion-item') as CVAccordionItem
  item.value = value

  const trigger = document.createElement('span')
  trigger.slot = 'trigger'
  trigger.textContent = label

  const panel = document.createElement('div')
  panel.textContent = content

  item.append(trigger, panel)
  return item
}

const createSvgIcon = (slot: 'expand-icon' | 'collapse-icon') => {
  const wrapper = document.createElement('span')
  wrapper.slot = slot

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '2')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', slot === 'expand-icon' ? 'M5 12h14M12 5v14' : 'M5 12h14')
  svg.append(path)

  wrapper.append(svg)
  return wrapper
}

const getTrigger = (item: CVAccordionItem) =>
  item.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement
const getPanel = (item: CVAccordionItem) => item.shadowRoot?.querySelector('[part="panel"]') as HTMLElement
const getIndicator = (item: CVAccordionItem) =>
  item.shadowRoot?.querySelector('[part~="indicator"]') as HTMLElement

const settleItem = async (item: CVAccordionItem) => {
  await item.updateComplete
  await Promise.resolve()
  await item.updateComplete
}

const mockReducedMotion = (matches: boolean) => {
  const originalMatchMedia = window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string): MediaQueryList => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
    }),
  })

  return () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: originalMatchMedia,
    })
  }
}

const mockAnimationFrames = () => {
  const hadRequestAnimationFrame = 'requestAnimationFrame' in window
  const hadCancelAnimationFrame = 'cancelAnimationFrame' in window
  const originalRequestAnimationFrame = window.requestAnimationFrame
  const originalCancelAnimationFrame = window.cancelAnimationFrame
  const frames = new Map<number, FrameRequestCallback>()
  let nextHandle = 1

  Object.defineProperty(window, 'requestAnimationFrame', {
    configurable: true,
    value: vi.fn((callback: FrameRequestCallback) => {
      const handle = nextHandle++
      frames.set(handle, callback)
      return handle
    }),
  })

  Object.defineProperty(window, 'cancelAnimationFrame', {
    configurable: true,
    value: vi.fn((handle: number) => {
      frames.delete(handle)
    }),
  })

  return {
    flushNextFrame() {
      const next = frames.entries().next().value as [number, FrameRequestCallback] | undefined
      if (!next) {
        throw new Error('No animation frame queued')
      }

      const [handle, callback] = next
      frames.delete(handle)
      callback(window.performance.now())
    },
    restore() {
      if (hadRequestAnimationFrame) {
        Object.defineProperty(window, 'requestAnimationFrame', {
          configurable: true,
          value: originalRequestAnimationFrame,
        })
      } else {
        Reflect.deleteProperty(window, 'requestAnimationFrame')
      }

      if (hadCancelAnimationFrame) {
        Object.defineProperty(window, 'cancelAnimationFrame', {
          configurable: true,
          value: originalCancelAnimationFrame,
        })
      } else {
        Reflect.deleteProperty(window, 'cancelAnimationFrame')
      }
    },
  }
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('cv-accordion', () => {
  it('defines its item dependency from the host define method', () => {
    CVAccordion.define()

    expect(customElements.get(CVAccordionItem.elementName)).toBe(CVAccordionItem)
  })

  it('renders the public indicator part alias and expand/collapse icon slots', async () => {
    CVAccordionItem.define()
    CVAccordion.define()

    const accordion = document.createElement('cv-accordion') as CVAccordion
    const itemA = createItem('a', 'A', 'Panel A')

    accordion.append(itemA)
    document.body.append(accordion)
    await settle(accordion)
    await settleItem(itemA)

    const indicator = getIndicator(itemA)

    expect(indicator).not.toBeNull()
    expect(indicator.getAttribute('part')?.split(/\s+/)).toEqual(['indicator', 'trigger-icon'])
    expect(indicator.querySelector('slot[name="expand-icon"]')).not.toBeNull()
    expect(indicator.querySelector('slot[name="collapse-icon"]')).not.toBeNull()
    expect(indicator.querySelector('[part="default-expand-icon"]')).not.toBeNull()
    expect(indicator.querySelector('[part="default-collapse-icon"]')).not.toBeNull()
  })

  it('assigns custom expand and collapse icon slot content', async () => {
    CVAccordionItem.define()
    CVAccordion.define()

    const accordion = document.createElement('cv-accordion') as CVAccordion
    const itemA = createItem('a', 'A', 'Panel A')
    const expandIcon = createSvgIcon('expand-icon')
    const collapseIcon = createSvgIcon('collapse-icon')

    itemA.append(expandIcon, collapseIcon)
    accordion.append(itemA)
    document.body.append(accordion)
    await settle(accordion)
    await settleItem(itemA)

    const indicator = getIndicator(itemA)
    const expandSlot = indicator.querySelector('slot[name="expand-icon"]') as HTMLSlotElement
    const collapseSlot = indicator.querySelector('slot[name="collapse-icon"]') as HTMLSlotElement

    expect(expandSlot.assignedElements()).toEqual([expandIcon])
    expect(collapseSlot.assignedElements()).toEqual([collapseIcon])
  })

  it('toggles sections in single mode and emits change', async () => {
    CVAccordionItem.define()
    CVAccordion.define()

    const accordion = document.createElement('cv-accordion') as CVAccordion
    const itemA = createItem('a', 'A', 'Panel A')
    const itemB = createItem('b', 'B', 'Panel B')
    const changeValues: string[][] = []

    accordion.addEventListener('cv-change', (event) => {
      changeValues.push((event as CustomEvent<{values: string[]}>).detail.values)
    })

    accordion.append(itemA, itemB)
    document.body.append(accordion)
    await settle(accordion)

    getTrigger(itemA).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(accordion)

    expect(accordion.value).toBe('a')
    expect(accordion.expandedValues).toEqual(['a'])
    expect(itemA.expanded).toBe(true)
    expect(itemB.expanded).toBe(false)

    getTrigger(itemB).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(accordion)

    expect(accordion.value).toBe('b')
    expect(accordion.expandedValues).toEqual(['b'])
    expect(itemA.expanded).toBe(false)
    expect(itemB.expanded).toBe(true)
    expect(changeValues).toEqual([['a'], ['b']])
  })

  it('supports keyboard navigation and activation', async () => {
    CVAccordionItem.define()
    CVAccordion.define()

    const accordion = document.createElement('cv-accordion') as CVAccordion
    const itemA = createItem('a', 'A', 'Panel A')
    const itemB = createItem('b', 'B', 'Panel B')
    const itemC = createItem('c', 'C', 'Panel C')
    itemB.disabled = true

    accordion.append(itemA, itemB, itemC)
    document.body.append(accordion)
    await settle(accordion)

    getTrigger(itemA).dispatchEvent(
      new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true, composed: true}),
    )
    await settle(accordion)

    expect(itemA.active).toBe(false)
    expect(itemC.active).toBe(true)

    getTrigger(itemC).dispatchEvent(
      new KeyboardEvent('keydown', {key: 'Enter', bubbles: true, composed: true}),
    )
    await settle(accordion)

    expect(accordion.value).toBe('c')
    expect(accordion.expandedValues).toEqual(['c'])
    expect(itemC.expanded).toBe(true)
  })

  it('reveals a newly expanded item when revealExpanded is enabled', async () => {
    CVAccordionItem.define()
    CVAccordion.define()

    const accordion = document.createElement('cv-accordion') as CVAccordion
    accordion.revealExpanded = true

    const itemA = createItem('a', 'A', 'Panel A')
    const itemB = createItem('b', 'B', 'Panel B')
    const scrollIntoViewSpy = vi.fn()

    Object.defineProperty(itemB, 'scrollIntoView', {
      value: scrollIntoViewSpy,
      configurable: true,
    })

    accordion.append(itemA, itemB)
    document.body.append(accordion)
    await settle(accordion)

    getTrigger(itemB).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(accordion)
    await Promise.resolve()

    expect(scrollIntoViewSpy).toHaveBeenCalledWith({block: 'nearest', inline: 'nearest'})
  })

  it('does not reveal items for programmatic expandedValues changes', async () => {
    CVAccordionItem.define()
    CVAccordion.define()

    const accordion = document.createElement('cv-accordion') as CVAccordion
    accordion.allowMultiple = true
    accordion.revealExpanded = true

    const itemA = createItem('a', 'A', 'Panel A')
    const itemB = createItem('b', 'B', 'Panel B')
    const scrollIntoViewSpy = vi.fn()

    Object.defineProperty(itemB, 'scrollIntoView', {
      value: scrollIntoViewSpy,
      configurable: true,
    })

    accordion.append(itemA, itemB)
    document.body.append(accordion)
    await settle(accordion)

    accordion.expandedValues = ['b']
    await settle(accordion)
    await Promise.resolve()

    expect(scrollIntoViewSpy).not.toHaveBeenCalled()
  })

  it('supports allowMultiple with expandedValues control', async () => {
    CVAccordionItem.define()
    CVAccordion.define()

    const accordion = document.createElement('cv-accordion') as CVAccordion
    accordion.allowMultiple = true
    accordion.expandedValues = ['a', 'c']

    const itemA = createItem('a', 'A', 'Panel A')
    const itemB = createItem('b', 'B', 'Panel B')
    const itemC = createItem('c', 'C', 'Panel C')

    accordion.append(itemA, itemB, itemC)
    document.body.append(accordion)
    await settle(accordion)
    await Promise.all([itemA.updateComplete, itemB.updateComplete, itemC.updateComplete])

    expect(accordion.expandedValues).toEqual(['a', 'c'])
    expect(itemA.expanded).toBe(true)
    expect(itemB.expanded).toBe(false)
    expect(itemC.expanded).toBe(true)
    expect(getPanel(itemA).hidden).toBe(false)
    expect(getPanel(itemC).hidden).toBe(false)

    accordion.expandedValues = ['b']
    await settle(accordion)

    expect(accordion.expandedValues).toEqual(['b'])
    expect(itemA.expanded).toBe(false)
    expect(itemB.expanded).toBe(true)
    expect(itemC.expanded).toBe(false)
  })

  it('supports programmatic value control in single mode', async () => {
    CVAccordionItem.define()
    CVAccordion.define()

    const accordion = document.createElement('cv-accordion') as CVAccordion
    const itemA = createItem('a', 'A', 'Panel A')
    const itemB = createItem('b', 'B', 'Panel B')

    accordion.append(itemA, itemB)
    document.body.append(accordion)
    await settle(accordion)

    accordion.value = 'b'
    await settle(accordion)

    expect(accordion.value).toBe('b')
    expect(itemA.expanded).toBe(false)
    expect(itemB.expanded).toBe(true)

    accordion.value = ''
    await settle(accordion)

    expect(accordion.value).toBe('')
    expect(itemB.expanded).toBe(false)
  })

  it('keeps a collapsing panel mounted and hidden from interaction until transition ends', async () => {
    CVAccordionItem.define()
    CVAccordion.define()

    const accordion = document.createElement('cv-accordion') as CVAccordion
    accordion.value = 'a'
    const itemA = createItem('a', 'A', 'Panel A')

    accordion.append(itemA)
    document.body.append(accordion)
    await settle(accordion)
    await settleItem(itemA)

    expect(getPanel(itemA).hidden).toBe(false)

    accordion.value = ''
    await settle(accordion)
    await settleItem(itemA)

    const panel = getPanel(itemA)
    expect(itemA.expanded).toBe(false)
    expect(panel.hidden).toBe(false)
    expect(panel.getAttribute('aria-hidden')).toBe('true')
    expect(panel.hasAttribute('inert')).toBe(true)
    expect(panel.getAttribute('data-state')).toBe('closing')

    panel.dispatchEvent(new Event('transitionend', {bubbles: true}))
    await settle(accordion)
    await settleItem(itemA)

    expect(panel.hidden).toBe(true)
    expect(panel.hasAttribute('aria-hidden')).toBe(false)
    expect(panel.hasAttribute('inert')).toBe(false)
    expect(panel.getAttribute('data-state')).toBe('closed')
  })

  it('keeps an opening panel mounted for a paint before transitioning open', async () => {
    CVAccordionItem.define()
    CVAccordion.define()
    const animationFrames = mockAnimationFrames()

    try {
      const accordion = document.createElement('cv-accordion') as CVAccordion
      const itemA = createItem('a', 'A', 'Panel A')

      accordion.append(itemA)
      document.body.append(accordion)
      await settle(accordion)
      await settleItem(itemA)

      getTrigger(itemA).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(accordion)
      await settleItem(itemA)

      expect(itemA.expanded).toBe(true)
      expect(getPanel(itemA).hidden).toBe(false)
      expect(getPanel(itemA).getAttribute('data-state')).toBe('opening')

      animationFrames.flushNextFrame()
      await settleItem(itemA)

      expect(getPanel(itemA).getAttribute('data-state')).toBe('opening')

      animationFrames.flushNextFrame()
      await settleItem(itemA)

      expect(getPanel(itemA).getAttribute('data-state')).toBe('open')
    } finally {
      animationFrames.restore()
    }
  })

  it('ignores a stale close transition when the section reopens before transition end', async () => {
    CVAccordionItem.define()
    CVAccordion.define()

    const accordion = document.createElement('cv-accordion') as CVAccordion
    accordion.value = 'a'
    const itemA = createItem('a', 'A', 'Panel A')

    accordion.append(itemA)
    document.body.append(accordion)
    await settle(accordion)
    await settleItem(itemA)

    accordion.value = ''
    await settle(accordion)
    await settleItem(itemA)
    expect(getPanel(itemA).getAttribute('data-state')).toBe('closing')

    accordion.value = 'a'
    await settle(accordion)
    await settleItem(itemA)

    const panel = getPanel(itemA)
    panel.dispatchEvent(new Event('transitionend', {bubbles: true}))
    await settle(accordion)
    await settleItem(itemA)

    expect(itemA.expanded).toBe(true)
    expect(panel.hidden).toBe(false)
    expect(panel.hasAttribute('aria-hidden')).toBe(false)
    expect(panel.hasAttribute('inert')).toBe(false)
    expect(panel.getAttribute('data-state')).toBe('open')
  })

  it('closes immediately when reduced motion is requested', async () => {
    CVAccordionItem.define()
    CVAccordion.define()
    const restoreMatchMedia = mockReducedMotion(true)

    try {
      const accordion = document.createElement('cv-accordion') as CVAccordion
      accordion.value = 'a'
      const itemA = createItem('a', 'A', 'Panel A')

      accordion.append(itemA)
      document.body.append(accordion)
      await settle(accordion)
      await settleItem(itemA)

      accordion.value = ''
      await settle(accordion)
      await settleItem(itemA)

      const panel = getPanel(itemA)
      expect(itemA.expanded).toBe(false)
      expect(panel.hidden).toBe(true)
      expect(panel.hasAttribute('aria-hidden')).toBe(false)
      expect(panel.hasAttribute('inert')).toBe(false)
      expect(panel.getAttribute('data-state')).toBe('closed')
    } finally {
      restoreMatchMedia()
    }
  })

  it('assigns fallback section values to items without a value', async () => {
    CVAccordionItem.define()
    CVAccordion.define()

    const accordion = document.createElement('cv-accordion') as CVAccordion
    const itemA = createItem('', 'A', 'Panel A')
    const itemB = createItem('', 'B', 'Panel B')

    accordion.append(itemA, itemB)
    document.body.append(accordion)
    await settle(accordion)

    expect(itemA.value).toBe('section-1')
    expect(itemB.value).toBe('section-2')

    getTrigger(itemB).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(accordion)

    expect(accordion.value).toBe('section-2')
    expect(itemB.expanded).toBe(true)
  })

  it('ignores trigger clicks on disabled items', async () => {
    CVAccordionItem.define()
    CVAccordion.define()

    const accordion = document.createElement('cv-accordion') as CVAccordion
    const itemA = createItem('a', 'A', 'Panel A')
    const itemB = createItem('b', 'B', 'Panel B')
    itemB.disabled = true
    const changeValues: string[][] = []

    accordion.addEventListener('cv-change', (event) => {
      changeValues.push((event as CustomEvent<{values: string[]}>).detail.values)
    })

    accordion.append(itemA, itemB)
    document.body.append(accordion)
    await settle(accordion)

    getTrigger(itemB).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(accordion)

    expect(itemB.expanded).toBe(false)
    expect(accordion.value).toBe('')
    expect(changeValues).toEqual([])
  })

  it('collapses extra sections when allowMultiple switches off', async () => {
    CVAccordionItem.define()
    CVAccordion.define()

    const accordion = document.createElement('cv-accordion') as CVAccordion
    accordion.allowMultiple = true
    accordion.expandedValues = ['a', 'c']

    const itemA = createItem('a', 'A', 'Panel A')
    const itemB = createItem('b', 'B', 'Panel B')
    const itemC = createItem('c', 'C', 'Panel C')

    accordion.append(itemA, itemB, itemC)
    document.body.append(accordion)
    await settle(accordion)

    expect(accordion.expandedValues).toEqual(['a', 'c'])

    accordion.allowMultiple = false
    await settle(accordion)

    expect(accordion.expandedValues).toEqual(['a'])
    expect(accordion.value).toBe('a')
    expect(itemA.expanded).toBe(true)
    expect(itemC.expanded).toBe(false)
  })

  it('keeps the last expanded section when allowZeroExpanded is false', async () => {
    CVAccordionItem.define()
    CVAccordion.define()

    const accordion = document.createElement('cv-accordion') as CVAccordion
    accordion.allowZeroExpanded = false

    const itemA = createItem('a', 'A', 'Panel A')
    const itemB = createItem('b', 'B', 'Panel B')

    accordion.append(itemA, itemB)
    document.body.append(accordion)
    await settle(accordion)

    expect(accordion.value).toBe('a')
    expect(itemA.expanded).toBe(true)
    expect(getTrigger(itemA).getAttribute('aria-disabled')).toBe('true')

    getTrigger(itemA).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(accordion)

    expect(itemA.expanded).toBe(true)
    expect(accordion.value).toBe('a')
  })

  it('supports Home, End, and ArrowUp wrap-around keyboard navigation', async () => {
    CVAccordionItem.define()
    CVAccordion.define()

    const accordion = document.createElement('cv-accordion') as CVAccordion
    const itemA = createItem('a', 'A', 'Panel A')
    const itemB = createItem('b', 'B', 'Panel B')
    const itemC = createItem('c', 'C', 'Panel C')

    accordion.append(itemA, itemB, itemC)
    document.body.append(accordion)
    await settle(accordion)

    getTrigger(itemA).dispatchEvent(new KeyboardEvent('keydown', {key: 'End', bubbles: true, composed: true}))
    await settle(accordion)
    expect(itemC.active).toBe(true)

    getTrigger(itemC).dispatchEvent(
      new KeyboardEvent('keydown', {key: 'Home', bubbles: true, composed: true}),
    )
    await settle(accordion)
    expect(itemA.active).toBe(true)

    getTrigger(itemA).dispatchEvent(
      new KeyboardEvent('keydown', {key: 'ArrowUp', bubbles: true, composed: true}),
    )
    await settle(accordion)
    expect(itemC.active).toBe(true)
  })

  it('emits cv-input without cv-change when only the focused item changes', async () => {
    CVAccordionItem.define()
    CVAccordion.define()

    const accordion = document.createElement('cv-accordion') as CVAccordion
    const itemA = createItem('a', 'A', 'Panel A')
    const itemB = createItem('b', 'B', 'Panel B')
    const inputActiveIds: Array<string | null> = []
    let changeCount = 0

    accordion.addEventListener('cv-input', (event) => {
      inputActiveIds.push((event as CustomEvent<{activeId: string | null}>).detail.activeId)
    })
    accordion.addEventListener('cv-change', () => {
      changeCount += 1
    })

    accordion.append(itemA, itemB)
    document.body.append(accordion)
    await settle(accordion)

    getTrigger(itemA).dispatchEvent(
      new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true, composed: true}),
    )
    await settle(accordion)

    expect(itemB.active).toBe(true)
    expect(inputActiveIds).toEqual(['b'])
    expect(changeCount).toBe(0)
  })

  it('rebuilds on slotchange and preserves valid expanded state', async () => {
    CVAccordionItem.define()
    CVAccordion.define()

    const accordion = document.createElement('cv-accordion') as CVAccordion
    accordion.allowMultiple = true
    accordion.expandedValues = ['a', 'b']

    const itemA = createItem('a', 'A', 'Panel A')
    const itemB = createItem('b', 'B', 'Panel B')
    const itemC = createItem('c', 'C', 'Panel C')

    accordion.append(itemA, itemB, itemC)
    document.body.append(accordion)
    await settle(accordion)

    itemA.remove()
    await settle(accordion)

    expect(accordion.expandedValues).toEqual(['b'])
    expect(accordion.value).toBe('b')
    expect(itemB.expanded).toBe(true)
    expect(itemC.expanded).toBe(false)
  })

  it('re-applies a controlled value set before items are appended', async () => {
    CVAccordionItem.define()
    CVAccordion.define()

    const accordion = document.createElement('cv-accordion') as CVAccordion
    accordion.value = 'b'

    // Accordion connects before any items exist (the value would otherwise be
    // resolved against an empty section list and wiped).
    document.body.append(accordion)
    await settle(accordion)
    expect(accordion.value).toBe('b')

    const itemA = createItem('a', 'A', 'Panel A')
    const itemB = createItem('b', 'B', 'Panel B')
    accordion.append(itemA, itemB)
    await settle(accordion)
    await itemB.updateComplete

    expect(accordion.value).toBe('b')
    expect(itemB.expanded).toBe(true)
    expect(itemA.expanded).toBe(false)
    expect(getPanel(itemB).hidden).toBe(false)
  })

  it('honors an initially expanded slotted item on the first stable render', async () => {
    CVAccordionItem.define()
    CVAccordion.define()

    const accordion = document.createElement('cv-accordion') as CVAccordion
    const itemA = createItem('a', 'A', 'Panel A')
    const itemB = createItem('b', 'B', 'Panel B')
    itemB.expanded = true

    accordion.append(itemA, itemB)
    document.body.append(accordion)
    await settle(accordion)
    await itemB.updateComplete

    expect(accordion.value).toBe('b')
    expect(accordion.expandedValues).toEqual(['b'])
    expect(itemB.expanded).toBe(true)
    expect(getPanel(itemB).hidden).toBe(false)
  })

  it('re-applies controlled expandedValues set before items are appended', async () => {
    CVAccordionItem.define()
    CVAccordion.define()

    const accordion = document.createElement('cv-accordion') as CVAccordion
    accordion.allowMultiple = true
    accordion.expandedValues = ['a', 'c']

    document.body.append(accordion)
    await settle(accordion)

    const itemA = createItem('a', 'A', 'Panel A')
    const itemB = createItem('b', 'B', 'Panel B')
    const itemC = createItem('c', 'C', 'Panel C')
    accordion.append(itemA, itemB, itemC)
    await settle(accordion)

    expect(accordion.expandedValues).toEqual(['a', 'c'])
    expect(itemA.expanded).toBe(true)
    expect(itemB.expanded).toBe(false)
    expect(itemC.expanded).toBe(true)
  })

  it('does not crash when the value attribute is removed', async () => {
    CVAccordionItem.define()
    CVAccordion.define()

    const accordion = document.createElement('cv-accordion') as CVAccordion
    const itemA = createItem('a', 'A', 'Panel A')
    const itemB = createItem('b', 'B', 'Panel B')

    accordion.setAttribute('value', 'a')
    accordion.append(itemA, itemB)
    document.body.append(accordion)
    await settle(accordion)
    expect(itemA.expanded).toBe(true)

    // String converter turns removeAttribute into a null property value; the
    // willUpdate normalizer must guard against null.trim().
    expect(() => accordion.removeAttribute('value')).not.toThrow()
    await settle(accordion)

    expect(accordion.value).toBe('')
    expect(itemA.expanded).toBe(false)
  })

  it('honors heading-level on the rendered heading element', async () => {
    CVAccordionItem.define()
    CVAccordion.define()

    const accordion = document.createElement('cv-accordion') as CVAccordion
    accordion.headingLevel = 5
    const itemA = createItem('a', 'A', 'Panel A')

    accordion.append(itemA)
    document.body.append(accordion)
    await settle(accordion)
    await itemA.updateComplete

    const header = itemA.shadowRoot?.querySelector('[part="header"]') as HTMLElement
    expect(header.tagName.toLowerCase()).toBe('h5')

    accordion.headingLevel = 2
    await settle(accordion)
    await itemA.updateComplete

    const updatedHeader = itemA.shadowRoot?.querySelector('[part="header"]') as HTMLElement
    expect(updatedHeader.tagName.toLowerCase()).toBe('h2')
  })

  it('ignores keyboard navigation when a modifier key is held', async () => {
    CVAccordionItem.define()
    CVAccordion.define()

    const accordion = document.createElement('cv-accordion') as CVAccordion
    const itemA = createItem('a', 'A', 'Panel A')
    const itemB = createItem('b', 'B', 'Panel B')

    accordion.append(itemA, itemB)
    document.body.append(accordion)
    await settle(accordion)

    getTrigger(itemA).dispatchEvent(
      new KeyboardEvent('keydown', {key: 'Home', bubbles: true, composed: true}),
    )
    await settle(accordion)
    expect(itemA.active).toBe(true)

    const event = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      ctrlKey: true,
      bubbles: true,
      composed: true,
      cancelable: true,
    })
    getTrigger(itemA).dispatchEvent(event)
    await settle(accordion)

    // Ctrl+ArrowDown must not navigate nor preventDefault (browser shortcut).
    expect(event.defaultPrevented).toBe(false)
    expect(itemA.active).toBe(true)
    expect(itemB.active).toBe(false)
  })

  it('does not emit events for programmatic value writes', async () => {
    CVAccordionItem.define()
    CVAccordion.define()

    const accordion = document.createElement('cv-accordion') as CVAccordion
    const itemA = createItem('a', 'A', 'Panel A')
    const itemB = createItem('b', 'B', 'Panel B')
    let inputCount = 0
    let changeCount = 0

    accordion.append(itemA, itemB)
    document.body.append(accordion)
    await settle(accordion)

    accordion.addEventListener('cv-input', () => {
      inputCount += 1
    })
    accordion.addEventListener('cv-change', () => {
      changeCount += 1
    })

    accordion.value = 'b'
    await settle(accordion)

    expect(itemB.expanded).toBe(true)
    expect(inputCount).toBe(0)
    expect(changeCount).toBe(0)
  })

  it('does not emit events for programmatic expandedValues writes', async () => {
    CVAccordionItem.define()
    CVAccordion.define()

    const accordion = document.createElement('cv-accordion') as CVAccordion
    accordion.allowMultiple = true
    const itemA = createItem('a', 'A', 'Panel A')
    const itemB = createItem('b', 'B', 'Panel B')
    let inputCount = 0
    let changeCount = 0

    accordion.append(itemA, itemB)
    document.body.append(accordion)
    await settle(accordion)

    accordion.addEventListener('cv-input', () => {
      inputCount += 1
    })
    accordion.addEventListener('cv-change', () => {
      changeCount += 1
    })

    accordion.expandedValues = ['a', 'b']
    await settle(accordion)

    expect(itemA.expanded).toBe(true)
    expect(itemB.expanded).toBe(true)
    expect(inputCount).toBe(0)
    expect(changeCount).toBe(0)
  })
})
