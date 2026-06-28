import {afterEach, describe, expect, it, vi} from 'vitest'

import {CVCarousel} from './cv-carousel'
import {CVCarouselSlide} from './cv-carousel-slide'

CVCarousel.define()
CVCarouselSlide.define()

const settle = async (element: CVCarousel) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
  await Promise.resolve()
}

const createSlide = (value: string, label: string) => {
  const slide = document.createElement('cv-carousel-slide') as CVCarouselSlide
  slide.value = value
  slide.label = label
  slide.textContent = label
  return slide
}

type TestRect = Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>

const mockRect = (element: Element, rect: TestRect) => {
  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: () =>
      ({
        x: rect.left,
        y: rect.top,
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        right: rect.left + rect.width,
        bottom: rect.top + rect.height,
        toJSON: () => ({}),
      }) as DOMRect,
  })
}

const waitForFrame = async () =>
  new Promise<void>((resolve) => {
    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => resolve())
      return
    }

    resolve()
  })

async function mountCarousel(
  params: {
    autoplay?: boolean
    autoplayInterval?: number
    visibleSlides?: number
    ariaLabel?: string
    ariaLabelledBy?: string
    value?: string
    activeIndex?: number
    paused?: boolean
  } = {},
) {
  const carousel = document.createElement('cv-carousel') as CVCarousel

  if (params.autoplay != null) carousel.autoplay = params.autoplay
  if (params.autoplayInterval != null) carousel.autoplayInterval = params.autoplayInterval
  if (params.visibleSlides != null) carousel.visibleSlides = params.visibleSlides
  if (params.ariaLabel != null) carousel.ariaLabel = params.ariaLabel
  if (params.ariaLabelledBy != null) carousel.ariaLabelledBy = params.ariaLabelledBy
  if (params.value != null) carousel.value = params.value
  if (params.activeIndex != null) carousel.activeIndex = params.activeIndex
  if (params.paused != null) carousel.paused = params.paused

  carousel.append(createSlide('s1', 'Slide 1'), createSlide('s2', 'Slide 2'), createSlide('s3', 'Slide 3'))

  document.body.append(carousel)
  await settle(carousel)

  const root = carousel.shadowRoot?.querySelector('[part="base"]') as HTMLElement
  const controls = carousel.shadowRoot?.querySelector('[part="controls"]') as HTMLElement
  const slidesContainer = carousel.shadowRoot?.querySelector('[part="slides"]') as HTMLElement
  const indicatorsContainer = carousel.shadowRoot?.querySelector('[part="indicators"]') as HTMLElement
  const prev = carousel.shadowRoot?.querySelector('[part~="prev"]') as HTMLButtonElement
  const next = carousel.shadowRoot?.querySelector('[part~="next"]') as HTMLButtonElement
  const playPause = carousel.shadowRoot?.querySelector('[part~="play-pause"]') as HTMLButtonElement
  const indicators = Array.from(
    carousel.shadowRoot?.querySelectorAll('[part="indicator"]') ?? [],
  ) as HTMLButtonElement[]
  const slides = Array.from(carousel.querySelectorAll('cv-carousel-slide')) as CVCarouselSlide[]

  return {
    carousel,
    root,
    controls,
    slidesContainer,
    indicatorsContainer,
    prev,
    next,
    playPause,
    indicators,
    slides,
  }
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.useRealTimers()
})

describe('cv-carousel', () => {
  // --- Shadow DOM structure ---

  describe('shadow DOM structure', () => {
    it('renders [part="base"] as a <section> element', async () => {
      const {root} = await mountCarousel()
      expect(root).not.toBeNull()
      expect(root.tagName.toLowerCase()).toBe('section')
    })

    it('renders [part="controls"] containing prev, next, and play-pause buttons', async () => {
      const {controls, prev, next, playPause} = await mountCarousel()
      expect(controls).not.toBeNull()
      expect(prev).not.toBeNull()
      expect(prev.tagName.toLowerCase()).toBe('button')
      expect(prev.querySelector('cv-icon')?.getAttribute('name')).toBe('chevron-left')
      expect(next).not.toBeNull()
      expect(next.tagName.toLowerCase()).toBe('button')
      expect(next.querySelector('cv-icon')?.getAttribute('name')).toBe('chevron-right')
      expect(playPause).not.toBeNull()
      expect(playPause.tagName.toLowerCase()).toBe('button')
      expect(playPause.querySelector('cv-icon')?.getAttribute('name')).toBe('pause-circle')
    })

    it('renders prev button with both "control" and "prev" parts', async () => {
      const {prev} = await mountCarousel()
      const partValue = prev.getAttribute('part')
      expect(partValue).toContain('control')
      expect(partValue).toContain('prev')
    })

    it('renders next button with both "control" and "next" parts', async () => {
      const {next} = await mountCarousel()
      const partValue = next.getAttribute('part')
      expect(partValue).toContain('control')
      expect(partValue).toContain('next')
    })

    it('renders play-pause button with both "control" and "play-pause" parts', async () => {
      const {playPause} = await mountCarousel()
      const partValue = playPause.getAttribute('part')
      expect(partValue).toContain('control')
      expect(partValue).toContain('play-pause')
    })

    it('renders [part="slides"] containing a default <slot>', async () => {
      const {slidesContainer} = await mountCarousel()
      expect(slidesContainer).not.toBeNull()
      const slot = slidesContainer.querySelector('slot:not([name])')
      expect(slot).not.toBeNull()
    })

    it('renders [part="indicators"] with one indicator button per slide', async () => {
      const {indicatorsContainer, indicators} = await mountCarousel()
      expect(indicatorsContainer).not.toBeNull()
      expect(indicators.length).toBe(3)
      for (const indicator of indicators) {
        expect(indicator.tagName.toLowerCase()).toBe('button')
        expect(indicator.getAttribute('part')).toBe('indicator')
        expect(indicator.textContent?.trim()).toBe('')
        expect(indicator.querySelector('[part="indicator-dot"]')).not.toBeNull()
      }
    })
  })

  // --- Default property values ---

  describe('default property values', () => {
    it('has correct defaults', async () => {
      const {carousel} = await mountCarousel()
      expect(carousel.value).toBe('s1')
      expect(carousel.activeIndex).toBe(0)
      expect(carousel.autoplay).toBe(false)
      expect(carousel.autoplayInterval).toBe(5000)
      expect(carousel.visibleSlides).toBe(1)
      expect(carousel.paused).toBe(false)
    })

    it('defaults ariaLabel and ariaLabelledBy to empty strings', async () => {
      const carousel = document.createElement('cv-carousel') as CVCarousel
      document.body.append(carousel)
      await settle(carousel)
      expect(carousel.ariaLabel).toBe('')
      expect(carousel.ariaLabelledBy).toBe('')
    })
  })

  // --- Attribute reflection ---

  describe('attribute reflection', () => {
    it('reflects boolean attributes: autoplay, paused', async () => {
      const {carousel} = await mountCarousel({autoplay: true})
      expect(carousel.hasAttribute('autoplay')).toBe(true)
      expect(carousel.hasAttribute('paused')).toBe(false)

      carousel.paused = true
      await settle(carousel)
      expect(carousel.hasAttribute('paused')).toBe(true)
    })

    it('reflects numeric attributes: active-index, autoplay-interval, visible-slides', async () => {
      const {carousel} = await mountCarousel({autoplayInterval: 3000, visibleSlides: 2})
      expect(carousel.getAttribute('active-index')).toBe('0')
      expect(carousel.getAttribute('autoplay-interval')).toBe('3000')
      expect(carousel.getAttribute('visible-slides')).toBe('2')
    })

    it('reflects value attribute', async () => {
      const {carousel} = await mountCarousel()
      expect(carousel.getAttribute('value')).toBe('s1')

      carousel.activeIndex = 1
      await settle(carousel)
      expect(carousel.getAttribute('value')).toBe('s2')
    })
  })

  // --- ARIA ---

  describe('ARIA', () => {
    it('[part="base"] has role="region" and aria-roledescription="carousel"', async () => {
      const {root} = await mountCarousel()
      expect(root.getAttribute('role')).toBe('region')
      expect(root.getAttribute('aria-roledescription')).toBe('carousel')
    })

    it('[part="base"] has aria-label when set', async () => {
      const {root} = await mountCarousel({ariaLabel: 'Product gallery'})
      expect(root.getAttribute('aria-label')).toBe('Product gallery')
    })

    it('[part="base"] has aria-live attribute', async () => {
      const {root} = await mountCarousel()
      expect(root.hasAttribute('aria-live')).toBe(true)
    })

    it('[part="base"] sets aria-live="off" during autoplay', async () => {
      const {root} = await mountCarousel({autoplay: true})
      expect(root.getAttribute('aria-live')).toBe('off')
    })

    it('[part="base"] sets aria-live="polite" when autoplay is off', async () => {
      const {root} = await mountCarousel({autoplay: false})
      expect(root.getAttribute('aria-live')).toBe('polite')
    })

    it('[part="base"] switches aria-live to "polite" after manual navigation during autoplay', async () => {
      const {carousel, root, next} = await mountCarousel({autoplay: true})
      expect(root.getAttribute('aria-live')).toBe('off')

      next.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(carousel)

      expect(root.getAttribute('aria-live')).toBe('polite')
    })

    it('[part="slides"] has role="group"', async () => {
      const {slidesContainer} = await mountCarousel()
      expect(slidesContainer.getAttribute('role')).toBe('group')
    })

    it('prev button has aria-label for previous slide', async () => {
      const {prev} = await mountCarousel()
      expect(prev.hasAttribute('aria-label')).toBe(true)
      expect(prev.getAttribute('aria-label')).toBeTruthy()
    })

    it('next button has aria-label for next slide', async () => {
      const {next} = await mountCarousel()
      expect(next.hasAttribute('aria-label')).toBe(true)
      expect(next.getAttribute('aria-label')).toBeTruthy()
    })

    it('play-pause button has aria-label', async () => {
      const {playPause} = await mountCarousel()
      expect(playPause.hasAttribute('aria-label')).toBe(true)
      expect(playPause.getAttribute('aria-label')).toBeTruthy()
    })

    it('play-pause button does NOT have aria-pressed', async () => {
      const {playPause} = await mountCarousel()
      expect(playPause.hasAttribute('aria-pressed')).toBe(false)

      const {playPause: pp2} = await mountCarousel({autoplay: true})
      expect(pp2.hasAttribute('aria-pressed')).toBe(false)
    })

    it('prev and next buttons have aria-controls referencing slides container', async () => {
      const {prev, next, slidesContainer} = await mountCarousel()
      const slidesId = slidesContainer.getAttribute('id')
      expect(slidesId).toBeTruthy()
      expect(prev.getAttribute('aria-controls')).toBe(slidesId)
      expect(next.getAttribute('aria-controls')).toBe(slidesId)
    })

    it('indicator buttons have aria-label', async () => {
      const {indicators} = await mountCarousel()
      for (const indicator of indicators) {
        expect(indicator.hasAttribute('aria-label')).toBe(true)
        expect(indicator.getAttribute('aria-label')).toBeTruthy()
      }
    })

    it('active indicator has aria-current="true" or data-active="true"', async () => {
      const {indicators} = await mountCarousel()
      expect(indicators[0]!.getAttribute('data-active')).toBe('true')
    })

    it('slides receive role and aria-roledescription from parent', async () => {
      const {slides} = await mountCarousel()
      for (const slide of slides) {
        expect(slide.getAttribute('role')).toBeTruthy()
        expect(slide.getAttribute('aria-roledescription')).toBeTruthy()
      }
    })

    it('slides receive aria-label from parent', async () => {
      const {slides} = await mountCarousel()
      for (const slide of slides) {
        expect(slide.hasAttribute('aria-label')).toBe(true)
      }
    })
  })

  // --- Events ---

  describe('events', () => {
    it('input event fires on active index change with correct detail shape', async () => {
      const {carousel, next} = await mountCarousel()
      let detail: unknown

      carousel.addEventListener('cv-input', (e) => {
        detail = (e as CustomEvent).detail
      })

      next.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(carousel)

      expect(detail).toEqual({
        activeIndex: 1,
        activeValue: 's2',
        paused: false,
      })
    })

    it('change event fires on active index change with correct detail shape', async () => {
      const {carousel, next} = await mountCarousel()
      let detail: unknown

      carousel.addEventListener('cv-change', (e) => {
        detail = (e as CustomEvent).detail
      })

      next.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(carousel)

      expect(detail).toEqual({
        activeIndex: 1,
        activeValue: 's2',
        paused: false,
      })
    })

    it('input event fires on pause state change', async () => {
      const {carousel, playPause} = await mountCarousel({autoplay: true})
      const inputDetails: Array<{activeIndex: number; activeValue: string | null; paused: boolean}> = []

      carousel.addEventListener('cv-input', (e) => {
        inputDetails.push((e as CustomEvent).detail)
      })

      playPause.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(carousel)

      expect(inputDetails.length).toBeGreaterThanOrEqual(1)
      const lastDetail = inputDetails[inputDetails.length - 1]!
      expect(lastDetail.paused).toBe(true)
    })

    it('change event does NOT fire when only paused state changes', async () => {
      const {carousel, playPause} = await mountCarousel({autoplay: true})
      let changeCount = 0

      carousel.addEventListener('cv-change', () => {
        changeCount++
      })

      playPause.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(carousel)

      expect(changeCount).toBe(0)
    })

    it('both events bubble and are composed', async () => {
      const {carousel, next} = await mountCarousel()
      let inputBubbles = false
      let inputComposed = false
      let changeBubbles = false
      let changeComposed = false

      carousel.addEventListener('cv-input', (e) => {
        inputBubbles = e.bubbles
        inputComposed = e.composed
      })
      carousel.addEventListener('cv-change', (e) => {
        changeBubbles = e.bubbles
        changeComposed = e.composed
      })

      next.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(carousel)

      expect(inputBubbles).toBe(true)
      expect(inputComposed).toBe(true)
      expect(changeBubbles).toBe(true)
      expect(changeComposed).toBe(true)
    })
  })

  // --- Navigation behavior ---

  describe('navigation behavior', () => {
    it('navigates with prev/next buttons and indicators', async () => {
      const {carousel, next, prev, indicators} = await mountCarousel()
      const changes: Array<number> = []

      carousel.addEventListener('cv-change', (event) => {
        changes.push((event as unknown as CustomEvent<{activeIndex: number}>).detail.activeIndex)
      })

      next.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(carousel)
      expect(carousel.activeIndex).toBe(1)
      expect(carousel.value).toBe('s2')

      prev.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(carousel)
      expect(carousel.activeIndex).toBe(0)

      indicators[2]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(carousel)
      expect(carousel.activeIndex).toBe(2)
      expect(changes).toContain(2)
    })

    it('value and active-index are synchronized', async () => {
      const {carousel} = await mountCarousel()

      carousel.value = 's2'
      await settle(carousel)
      expect(carousel.activeIndex).toBe(1)

      carousel.activeIndex = 2
      await settle(carousel)
      expect(carousel.value).toBe('s3')
    })

    it('setting value takes precedence over active-index', async () => {
      const {carousel} = await mountCarousel({value: 's3'})
      expect(carousel.activeIndex).toBe(2)
      expect(carousel.value).toBe('s3')
    })

    it('next wraps from the last slide back to the first', async () => {
      const {carousel, next} = await mountCarousel()

      carousel.activeIndex = 2
      await settle(carousel)

      next.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(carousel)

      expect(carousel.activeIndex).toBe(0)
      expect(carousel.value).toBe('s1')
    })

    it('prev wraps from the first slide to the last', async () => {
      const {carousel, prev} = await mountCarousel()

      prev.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(carousel)

      expect(carousel.activeIndex).toBe(2)
      expect(carousel.value).toBe('s3')
    })

    it('setting value to an unknown slide id does not move the active slide', async () => {
      const {carousel} = await mountCarousel()
      let changeCount = 0
      carousel.addEventListener('cv-change', () => changeCount++)

      carousel.value = 'does-not-exist'
      await settle(carousel)

      expect(carousel.activeIndex).toBe(0)
      expect(changeCount).toBe(0)
    })
  })

  // --- Keyboard interaction ---

  describe('keyboard interaction', () => {
    it('ArrowRight moves to next slide', async () => {
      const {carousel, root} = await mountCarousel()
      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight', bubbles: true}))
      await settle(carousel)
      expect(carousel.activeIndex).toBe(1)
    })

    it('ArrowLeft moves to previous slide', async () => {
      const {carousel, root} = await mountCarousel()

      carousel.activeIndex = 2
      await settle(carousel)

      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowLeft', bubbles: true}))
      await settle(carousel)
      expect(carousel.activeIndex).toBe(1)
    })

    it('Home moves to first slide', async () => {
      const {carousel, root} = await mountCarousel()

      carousel.activeIndex = 2
      await settle(carousel)

      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'Home', bubbles: true}))
      await settle(carousel)
      expect(carousel.activeIndex).toBe(0)
    })

    it('End moves to last slide', async () => {
      const {carousel, root} = await mountCarousel()
      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'End', bubbles: true}))
      await settle(carousel)
      expect(carousel.activeIndex).toBe(2)
    })
  })

  // --- Autoplay behavior ---

  describe('autoplay behavior', () => {
    it('advances slides automatically when autoplay is enabled', async () => {
      vi.useFakeTimers()
      const {carousel} = await mountCarousel({autoplay: true, autoplayInterval: 100})

      vi.advanceTimersByTime(100)
      await settle(carousel)
      expect(carousel.activeIndex).toBe(1)
    })

    it('pauses on hover and resumes on pointer leave', async () => {
      vi.useFakeTimers()
      const {carousel, root} = await mountCarousel({autoplay: true, autoplayInterval: 100})

      root.dispatchEvent(new Event('pointerenter', {bubbles: true}))
      await settle(carousel)
      expect(carousel.paused).toBe(true)

      vi.advanceTimersByTime(300)
      await settle(carousel)
      expect(carousel.activeIndex).toBe(0)

      root.dispatchEvent(new Event('pointerleave', {bubbles: true}))
      await settle(carousel)
      expect(carousel.paused).toBe(false)
    })

    it('supports autoplay pause/resume via play-pause button and hover', async () => {
      vi.useFakeTimers()
      const {carousel, playPause, root} = await mountCarousel({autoplay: true, autoplayInterval: 100})

      vi.advanceTimersByTime(100)
      await settle(carousel)
      expect(carousel.activeIndex).toBe(1)

      root.dispatchEvent(new Event('pointerenter', {bubbles: true}))
      await settle(carousel)
      expect(carousel.paused).toBe(true)

      vi.advanceTimersByTime(300)
      await settle(carousel)
      expect(carousel.activeIndex).toBe(1)

      playPause.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(carousel)
      expect(carousel.paused).toBe(true)

      root.dispatchEvent(new Event('pointerleave', {bubbles: true}))
      await settle(carousel)
      expect(carousel.paused).toBe(true)

      playPause.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(carousel)
      expect(carousel.paused).toBe(false)
    })
  })

  // --- Visible slides ---

  describe('visible slides', () => {
    it('maps visible slides by aria-hidden and data-active', async () => {
      const {carousel, slides} = await mountCarousel({visibleSlides: 1})

      expect(slides[0]!.getAttribute('aria-hidden')).toBe('false')
      expect(slides[0]!.active).toBe(true)
      expect(slides[0]!.hidden).toBe(false)
      expect(slides[0]!.hasAttribute('inert')).toBe(false)

      expect(slides[1]!.getAttribute('aria-hidden')).toBe('true')
      expect(slides[1]!.hidden).toBe(false)
      expect(slides[1]!.hasAttribute('inert')).toBe(true)
      expect(slides[2]!.getAttribute('aria-hidden')).toBe('true')
      expect(slides[2]!.hidden).toBe(false)
      expect(slides[2]!.hasAttribute('inert')).toBe(true)

      carousel.activeIndex = 2
      await settle(carousel)

      expect(slides[2]!.getAttribute('aria-hidden')).toBe('false')
      expect(slides[2]!.active).toBe(true)
      expect(slides[2]!.hasAttribute('inert')).toBe(false)
    })
  })

  // --- Edge cases: slide counts ---

  describe('slide count edge cases', () => {
    it('renders without slides and ignores keyboard navigation', async () => {
      const carousel = document.createElement('cv-carousel') as CVCarousel
      document.body.append(carousel)
      await settle(carousel)

      const root = carousel.shadowRoot?.querySelector('[part="base"]') as HTMLElement
      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'End', bubbles: true}))
      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight', bubbles: true}))
      await settle(carousel)

      expect(carousel.activeIndex).toBe(0)
      expect(carousel.value).toBe('')
      expect(carousel.shadowRoot?.querySelectorAll('[part="indicator"]').length).toBe(0)
    })

    it('single slide: next() stays on the only slide and emits no change', async () => {
      const carousel = document.createElement('cv-carousel') as CVCarousel
      carousel.append(createSlide('only', 'Only slide'))
      document.body.append(carousel)
      await settle(carousel)

      let changeCount = 0
      carousel.addEventListener('cv-change', () => changeCount++)

      carousel.next()
      await settle(carousel)
      carousel.prev()
      await settle(carousel)

      expect(carousel.activeIndex).toBe(0)
      expect(carousel.value).toBe('only')
      expect(changeCount).toBe(0)
    })
  })

  // --- Slot rebuild ---

  describe('slot rebuild', () => {
    it('uses slide value and label attributes when properties are not initialized yet', async () => {
      const carousel = document.createElement('cv-carousel') as CVCarousel
      const slide = document.createElement('div') as unknown as CVCarouselSlide
      Object.defineProperty(slide, 'tagName', {
        configurable: true,
        value: 'CV-CAROUSEL-SLIDE',
      })
      slide.value = ''
      slide.label = ''
      slide.setAttribute('value', 'attr-slide')
      slide.setAttribute('label', 'Attribute slide')
      slide.textContent = 'Fallback text'

      carousel.append(slide)
      document.body.append(carousel)
      await settle(carousel)

      expect(carousel.value).toBe('attr-slide')
      expect(slide.value).toBe('attr-slide')
      expect(slide.getAttribute('aria-label')).toBe('Attribute slide')
    })

    it('preserves valid active slide on slot rebuild', async () => {
      const {carousel, indicators} = await mountCarousel()

      indicators[1]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(carousel)
      expect(carousel.value).toBe('s2')

      const slide1 = carousel.querySelector('cv-carousel-slide[value="s1"]') as CVCarouselSlide
      slide1.remove()
      await settle(carousel)

      expect(carousel.value).toBe('s2')
      expect((carousel.querySelector('cv-carousel-slide[value="s2"]') as CVCarouselSlide).active).toBe(true)
    })

    it('falls back to the slide at the same index when the active slide is removed', async () => {
      const {carousel, indicators} = await mountCarousel()

      indicators[1]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(carousel)
      expect(carousel.value).toBe('s2')

      const slide2 = carousel.querySelector('cv-carousel-slide[value="s2"]') as CVCarouselSlide
      slide2.remove()
      await settle(carousel)

      expect(carousel.activeIndex).toBe(1)
      expect(carousel.value).toBe('s3')
      expect((carousel.querySelector('cv-carousel-slide[value="s3"]') as CVCarouselSlide).active).toBe(true)
    })
  })

  // --- Imperative API ---

  describe('imperative API', () => {
    it('next() advances to the next slide', async () => {
      const {carousel} = await mountCarousel()
      carousel.next()
      await settle(carousel)
      expect(carousel.activeIndex).toBe(1)
    })

    it('prev() goes to the previous slide', async () => {
      const {carousel} = await mountCarousel()
      carousel.activeIndex = 2
      await settle(carousel)

      carousel.prev()
      await settle(carousel)
      expect(carousel.activeIndex).toBe(1)
    })

    it('play() resumes autoplay', async () => {
      vi.useFakeTimers()
      const {carousel} = await mountCarousel({autoplay: true, autoplayInterval: 100})

      carousel.pause()
      await settle(carousel)
      expect(carousel.paused).toBe(true)

      carousel.play()
      await settle(carousel)
      expect(carousel.paused).toBe(false)
    })

    it('pause() pauses autoplay', async () => {
      vi.useFakeTimers()
      const {carousel} = await mountCarousel({autoplay: true, autoplayInterval: 100})

      carousel.pause()
      await settle(carousel)
      expect(carousel.paused).toBe(true)

      vi.advanceTimersByTime(300)
      await settle(carousel)
      expect(carousel.activeIndex).toBe(0)
    })
  })

  // --- Headless contract delegation ---

  describe('headless contract delegation', () => {
    it('root props from headless contract are spread onto [part="base"]', async () => {
      const {root} = await mountCarousel({ariaLabel: 'Gallery'})
      // These values come from headless getRootProps(), not hardcoded
      expect(root.getAttribute('role')).toBe('region')
      expect(root.getAttribute('aria-roledescription')).toBe('carousel')
      expect(root.getAttribute('aria-label')).toBe('Gallery')
      expect(root.hasAttribute('aria-live')).toBe(true)
    })

    it('slide group props from headless contract are spread onto [part="slides"]', async () => {
      const {slidesContainer} = await mountCarousel()
      expect(slidesContainer.getAttribute('role')).toBe('group')
      expect(slidesContainer.hasAttribute('id')).toBe(true)
    })

    it('slide props from headless contract are spread onto cv-carousel-slide elements', async () => {
      const {slides} = await mountCarousel()
      const firstSlide = slides[0]!
      // These come from getSlideProps(0), not hardcoded
      expect(firstSlide.hasAttribute('role')).toBe(true)
      expect(firstSlide.hasAttribute('aria-roledescription')).toBe(true)
      expect(firstSlide.hasAttribute('aria-label')).toBe(true)
      expect(firstSlide.hasAttribute('aria-hidden')).toBe(true)
      expect(firstSlide.hasAttribute('data-active')).toBe(true)
      expect(firstSlide.hasAttribute('id')).toBe(true)
    })

    it('prev button props from headless contract are spread onto [part="prev"]', async () => {
      const {prev} = await mountCarousel()
      expect(prev.hasAttribute('aria-controls')).toBe(true)
      expect(prev.hasAttribute('aria-label')).toBe(true)
      expect(prev.hasAttribute('id')).toBe(true)
    })

    it('next button props from headless contract are spread onto [part="next"]', async () => {
      const {next} = await mountCarousel()
      expect(next.hasAttribute('aria-controls')).toBe(true)
      expect(next.hasAttribute('aria-label')).toBe(true)
      expect(next.hasAttribute('id')).toBe(true)
    })

    it('play-pause button props from headless contract are spread (no aria-pressed)', async () => {
      const {playPause} = await mountCarousel()
      expect(playPause.hasAttribute('aria-controls')).toBe(true)
      expect(playPause.hasAttribute('aria-label')).toBe(true)
      expect(playPause.hasAttribute('id')).toBe(true)
      // W3C APG: no aria-pressed on play/pause
      expect(playPause.hasAttribute('aria-pressed')).toBe(false)
    })

    it('indicator props from headless contract are spread onto [part="indicator"]', async () => {
      const {indicators} = await mountCarousel()
      const firstIndicator = indicators[0]!
      expect(firstIndicator.hasAttribute('aria-controls')).toBe(true)
      expect(firstIndicator.hasAttribute('aria-label')).toBe(true)
      expect(firstIndicator.hasAttribute('data-active')).toBe(true)
      expect(firstIndicator.hasAttribute('id')).toBe(true)
    })

    it('ARIA attributes originate from headless contracts, not hardcoded strings', async () => {
      // Verify that the root id matches the pattern from the headless model
      const {root, slidesContainer, prev, next} = await mountCarousel()
      const rootId = root.getAttribute('id')
      expect(rootId).toBeTruthy()
      // prev/next aria-controls should reference the slides container id
      const slidesId = slidesContainer.getAttribute('id')
      expect(prev.getAttribute('aria-controls')).toBe(slidesId)
      expect(next.getAttribute('aria-controls')).toBe(slidesId)
    })
  })

  // --- Native scroll sync ---

  describe('native scroll sync', () => {
    it('scrolls the active slide into view after model-driven navigation', async () => {
      const {carousel, next, slides} = await mountCarousel()
      const scrollIntoView = vi.fn()
      Object.defineProperty(slides[1]!, 'scrollIntoView', {
        configurable: true,
        value: scrollIntoView,
      })

      next.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(carousel)

      expect(carousel.activeIndex).toBe(1)
      expect(scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({
          block: 'nearest',
          inline: 'center',
        }),
      )
    })

    it('updates active slide from the nearest native scroll-snap position', async () => {
      const {carousel, slidesContainer, slides} = await mountCarousel()
      const changes: number[] = []
      carousel.addEventListener('cv-change', (event) => {
        changes.push((event as unknown as CustomEvent<{activeIndex: number}>).detail.activeIndex)
      })

      mockRect(slidesContainer, {left: 0, top: 0, width: 300, height: 160})
      mockRect(slides[0]!, {left: -320, top: 0, width: 300, height: 160})
      mockRect(slides[1]!, {left: 0, top: 0, width: 300, height: 160})
      mockRect(slides[2]!, {left: 320, top: 0, width: 300, height: 160})

      slidesContainer.dispatchEvent(new Event('scroll', {bubbles: true}))
      await waitForFrame()
      await settle(carousel)

      expect(carousel.activeIndex).toBe(1)
      expect(carousel.value).toBe('s2')
      expect(changes).toEqual([1])
    })

    it('ignores native scroll events while a programmatic scroll is settling', async () => {
      const {carousel, slidesContainer, slides} = await mountCarousel()
      Object.defineProperty(slides[2]!, 'scrollIntoView', {
        configurable: true,
        value: vi.fn(),
      })

      carousel.activeIndex = 2
      await settle(carousel)

      mockRect(slidesContainer, {left: 0, top: 0, width: 300, height: 160})
      mockRect(slides[0]!, {left: 0, top: 0, width: 300, height: 160})
      mockRect(slides[1]!, {left: 320, top: 0, width: 300, height: 160})
      mockRect(slides[2]!, {left: 640, top: 0, width: 300, height: 160})

      slidesContainer.dispatchEvent(new Event('scroll', {bubbles: true}))
      await waitForFrame()
      await settle(carousel)

      expect(carousel.activeIndex).toBe(2)

      slidesContainer.dispatchEvent(new Event('scrollend', {bubbles: true}))
      slidesContainer.dispatchEvent(new Event('scroll', {bubbles: true}))
      await waitForFrame()
      await settle(carousel)

      expect(carousel.activeIndex).toBe(0)
    })
  })

  // --- Parent-child coordination ---

  describe('parent-child coordination', () => {
    it('parent sets ARIA attributes on child slide elements', async () => {
      const {slides} = await mountCarousel()
      // Active slide (index 0)
      expect(slides[0]!.getAttribute('aria-hidden')).toBe('false')
      expect(slides[0]!.getAttribute('data-active')).toBe('true')
      expect(slides[0]!.active).toBe(true)
      expect(slides[0]!.hidden).toBe(false)
      expect(slides[0]!.hasAttribute('inert')).toBe(false)

      // Inactive slides
      expect(slides[1]!.getAttribute('aria-hidden')).toBe('true')
      expect(slides[1]!.getAttribute('data-active')).toBe('false')
      expect(slides[1]!.active).toBe(false)
      expect(slides[1]!.hidden).toBe(false)
      expect(slides[1]!.hasAttribute('inert')).toBe(true)
    })

    it('child slides update when parent active index changes', async () => {
      const {carousel, slides} = await mountCarousel()

      carousel.activeIndex = 2
      await settle(carousel)

      expect(slides[0]!.active).toBe(false)
      expect(slides[0]!.getAttribute('data-active')).toBe('false')
      expect(slides[0]!.hasAttribute('inert')).toBe(true)
      expect(slides[2]!.active).toBe(true)
      expect(slides[2]!.getAttribute('data-active')).toBe('true')
      expect(slides[2]!.hasAttribute('inert')).toBe(false)
    })

    it('auto-generates slide values when omitted', async () => {
      const carousel = document.createElement('cv-carousel') as CVCarousel
      const slide = document.createElement('cv-carousel-slide') as CVCarouselSlide
      slide.textContent = 'No value slide'
      carousel.append(slide)
      document.body.append(carousel)
      await settle(carousel)

      expect(slide.value).toBeTruthy()
    })
  })
})

// --- cv-carousel-slide ---

describe('cv-carousel-slide', () => {
  describe('shadow DOM structure', () => {
    it('renders [part="base"] containing a default slot', async () => {
      const slide = document.createElement('cv-carousel-slide') as CVCarouselSlide
      document.body.append(slide)
      await slide.updateComplete

      const base = slide.shadowRoot!.querySelector('[part="base"]')
      expect(base).not.toBeNull()
      expect(base!.tagName.toLowerCase()).toBe('div')

      const slot = base!.querySelector('slot:not([name])')
      expect(slot).not.toBeNull()
    })
  })

  describe('default property values', () => {
    it('has correct defaults', async () => {
      const slide = document.createElement('cv-carousel-slide') as CVCarouselSlide
      document.body.append(slide)
      await slide.updateComplete

      expect(slide.value).toBe('')
      expect(slide.label).toBe('')
      expect(slide.active).toBe(false)
    })
  })

  describe('attribute reflection', () => {
    it('reflects value attribute', async () => {
      const slide = document.createElement('cv-carousel-slide') as CVCarouselSlide
      slide.value = 'test-slide'
      document.body.append(slide)
      await slide.updateComplete

      expect(slide.getAttribute('value')).toBe('test-slide')
    })

    it('reflects label attribute', async () => {
      const slide = document.createElement('cv-carousel-slide') as CVCarouselSlide
      slide.label = 'Test Label'
      document.body.append(slide)
      await slide.updateComplete

      expect(slide.getAttribute('label')).toBe('Test Label')
    })

    it('reflects active boolean attribute', async () => {
      const slide = document.createElement('cv-carousel-slide') as CVCarouselSlide
      slide.active = true
      document.body.append(slide)
      await slide.updateComplete

      expect(slide.hasAttribute('active')).toBe(true)
    })
  })

  describe('visual states', () => {
    it('host has [active] attribute when active', async () => {
      const slide = document.createElement('cv-carousel-slide') as CVCarouselSlide
      slide.active = true
      document.body.append(slide)
      await slide.updateComplete

      expect(slide.hasAttribute('active')).toBe(true)
    })

    it('host has [hidden] attribute when hidden', async () => {
      const slide = document.createElement('cv-carousel-slide') as CVCarouselSlide
      slide.hidden = true
      document.body.append(slide)
      await slide.updateComplete

      expect(slide.hasAttribute('hidden')).toBe(true)
    })
  })

  // --- Regression: Batch 2 fixes ---

  describe('regression: autoplay timer teardown (Batch 2 #7)', () => {
    it('stops the autoplay timer chain on disconnect', async () => {
      vi.useFakeTimers()
      const {carousel} = await mountCarousel({autoplay: true, autoplayInterval: 100})

      vi.advanceTimersByTime(100)
      await settle(carousel)
      expect(carousel.activeIndex).toBe(1)

      carousel.remove()

      // No orphaned self-rescheduling timer should remain after removal.
      expect(vi.getTimerCount()).toBe(0)

      // Advancing further must not mutate the (detached) carousel.
      vi.advanceTimersByTime(1000)
      expect(carousel.activeIndex).toBe(1)
    })

    it('does not orphan the old model timer on property-driven rebuild', async () => {
      vi.useFakeTimers()
      const {carousel} = await mountCarousel({autoplay: true, autoplayInterval: 100})

      // Property changes that trigger rebuildModelFromSlot.
      carousel.ariaLabel = 'Gallery one'
      await settle(carousel)
      carousel.autoplayInterval = 200
      await settle(carousel)
      carousel.visibleSlides = 1
      await settle(carousel)

      // Exactly one live rotation timer (the current model's), no orphans.
      expect(vi.getTimerCount()).toBe(1)
    })
  })

  describe('regression: invalid numeric attributes (Batch 2 #9)', () => {
    it('falls back to a single visible slide when visible-slides is non-numeric', async () => {
      const carousel = document.createElement('cv-carousel') as CVCarousel
      carousel.setAttribute('visible-slides', 'oops')
      carousel.append(createSlide('s1', 'Slide 1'), createSlide('s2', 'Slide 2'))
      document.body.append(carousel)
      await settle(carousel)

      const slides = Array.from(carousel.querySelectorAll('cv-carousel-slide')) as CVCarouselSlide[]
      // Active slide must remain visible (not aria-hidden), not all-hidden via NaN.
      expect(slides[0]!.getAttribute('aria-hidden')).toBe('false')
      expect(slides[0]!.active).toBe(true)
    })

    it('falls back to default interval when autoplay-interval is non-numeric', async () => {
      vi.useFakeTimers()
      const carousel = document.createElement('cv-carousel') as CVCarousel
      carousel.autoplay = true
      carousel.setAttribute('autoplay-interval', 'nope')
      carousel.append(createSlide('s1', 'Slide 1'), createSlide('s2', 'Slide 2'))
      document.body.append(carousel)
      await settle(carousel)

      // Must NOT advance at ~0ms (which a setTimeout(NaN) would effectively do).
      vi.advanceTimersByTime(100)
      await settle(carousel)
      expect(carousel.activeIndex).toBe(0)

      // Advances at the default 5000ms fallback interval.
      vi.advanceTimersByTime(5000)
      await settle(carousel)
      expect(carousel.activeIndex).toBe(1)
    })
  })

  describe('regression: keyboard modifiers (Batch 2 #10)', () => {
    it('ignores navigation keys when a modifier is held', async () => {
      const {carousel, root} = await mountCarousel()

      const before = carousel.activeIndex
      const event = new KeyboardEvent('keydown', {key: 'End', bubbles: true, ctrlKey: true})
      let prevented = false
      Object.defineProperty(event, 'preventDefault', {
        value: () => {
          prevented = true
        },
      })
      root.dispatchEvent(event)
      await settle(carousel)

      // Ctrl+End must not be hijacked.
      expect(carousel.activeIndex).toBe(before)
      expect(prevented).toBe(false)
    })
  })

  describe('regression: removeAttribute("value") (Batch 2 #8)', () => {
    it('does not throw when the value attribute is removed', async () => {
      const {carousel} = await mountCarousel({value: 's2'})
      expect(carousel.activeIndex).toBe(1)

      expect(() => carousel.removeAttribute('value')).not.toThrow()
      await settle(carousel)
      // Clearing the value is a no-op for navigation: the active slide is kept.
      expect(carousel.activeIndex).toBe(1)
    })
  })

  describe('regression: programmatic scroll guard release', () => {
    it('clears programmatic scroll guard on scrollend so later native scroll can sync state', async () => {
      const {carousel, slidesContainer, slides} = await mountCarousel()
      Object.defineProperty(slides[1]!, 'scrollIntoView', {
        configurable: true,
        value: vi.fn(),
      })

      carousel.activeIndex = 1
      await settle(carousel)

      mockRect(slidesContainer, {left: 0, top: 0, width: 300, height: 160})
      mockRect(slides[0]!, {left: 320, top: 0, width: 300, height: 160})
      mockRect(slides[1]!, {left: -320, top: 0, width: 300, height: 160})
      mockRect(slides[2]!, {left: 0, top: 0, width: 300, height: 160})

      slidesContainer.dispatchEvent(new Event('scroll', {bubbles: true}))
      await waitForFrame()
      await settle(carousel)
      expect(carousel.activeIndex).toBe(1)

      slidesContainer.dispatchEvent(new Event('scrollend', {bubbles: true}))
      slidesContainer.dispatchEvent(new Event('scroll', {bubbles: true}))
      await waitForFrame()
      await settle(carousel)

      expect(carousel.activeIndex).toBe(2)
    })
  })
})
