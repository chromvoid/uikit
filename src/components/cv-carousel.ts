import {createCarousel, type CarouselModel} from '@chromvoid/headless-ui/carousel'
import {css, nothing} from 'lit'
import type {PropertyValues} from 'lit'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'
import {CVCarouselSlide} from './cv-carousel-slide'
import {CVIcon} from './cv-icon'

export interface CVCarouselEventDetail {
  activeIndex: number
  activeValue: string | null
  paused: boolean
}

interface CarouselSlideRecord {
  id: string
  label: string
  element: CVCarouselSlide
}

interface CarouselSnapshot {
  activeIndex: number
  paused: boolean
}

const carouselKeysToPrevent = new Set(['ArrowLeft', 'ArrowRight', 'Home', 'End'])

let cvCarouselNonce = 0

export class CVCarousel extends ReatomLitElement {
  static elementName = 'cv-carousel'

  static get properties() {
    return {
      value: {type: String, reflect: true},
      activeIndex: {type: Number, attribute: 'active-index', reflect: true},
      autoplay: {type: Boolean, reflect: true},
      autoplayInterval: {type: Number, attribute: 'autoplay-interval', reflect: true},
      visibleSlides: {type: Number, attribute: 'visible-slides', reflect: true},
      paused: {type: Boolean, reflect: true},
      ariaLabel: {type: String, attribute: 'aria-label'},
      ariaLabelledBy: {type: String, attribute: 'aria-labelledby'},
    }
  }

  declare value: string
  declare activeIndex: number
  declare autoplay: boolean
  declare autoplayInterval: number
  declare visibleSlides: number
  declare paused: boolean
  declare ariaLabel: string
  declare ariaLabelledBy: string

  private readonly idBase = `cv-carousel-${++cvCarouselNonce}`
  private slideRecords: CarouselSlideRecord[] = []
  private model: CarouselModel
  private scrollSyncFrame: number | null = null
  private programmaticScrollReleaseTimer: ReturnType<typeof setTimeout> | null = null
  private isProgrammaticScroll = false
  private lastScrolledActiveIndex = -1

  constructor() {
    super()
    this.value = ''
    this.activeIndex = 0
    this.autoplay = false
    this.autoplayInterval = 5000
    this.visibleSlides = 1
    this.paused = false
    this.ariaLabel = ''
    this.ariaLabelledBy = ''
    this.model = createCarousel({
      idBase: this.idBase,
      slides: [],
    })
  }

  static styles = [
    css`
      :host {
        display: block;
        box-sizing: border-box;
        max-inline-size: 100%;
        min-inline-size: 0;
        --cv-carousel-gap: var(--cv-space-3, 12px);
        --cv-carousel-control-size: 48px;
        --cv-carousel-control-radius: var(--cv-radius-md, 10px);
        --cv-carousel-indicator-size: 10px;
        --cv-carousel-indicator-target-size: var(--cv-carousel-control-size);
        --cv-carousel-scroll-padding: var(--cv-space-2, 8px);
        --cv-carousel-slide-inline-size: min(100%, 42rem);
        --cv-carousel-mobile-peek: 32px;
      }

      [part='base'] {
        box-sizing: border-box;
        display: grid;
        gap: var(--cv-carousel-gap);
        max-inline-size: 100%;
        min-inline-size: 0;
      }

      [part='controls'] {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: var(--cv-space-2, 8px);
      }

      [part='slides'] {
        box-sizing: border-box;
        display: flex;
        gap: var(--cv-carousel-gap);
        max-inline-size: 100%;
        min-inline-size: 0;
        overflow-x: auto;
        overscroll-behavior-inline: contain;
        padding-inline: var(--cv-carousel-scroll-padding);
        scroll-padding-inline: var(--cv-carousel-scroll-padding);
        scroll-snap-type: x mandatory;
        scrollbar-width: none;
        -webkit-overflow-scrolling: touch;
      }

      [part='slides']::-webkit-scrollbar {
        display: none;
      }

      [part='slides'] slot {
        display: contents;
      }

      [part='indicators'] {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: var(--cv-space-1, 4px);
      }

      button[part~='control'],
      button[part~='indicator'] {
        appearance: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        font: inherit;
        line-height: 1;
        border: 1px solid var(--cv-color-border, #2a3245);
        background: var(--cv-color-surface, #141923);
        color: var(--cv-color-text, #e8ecf6);
        cursor: pointer;
        transition:
          border-color 120ms ease,
          background 120ms ease,
          color 120ms ease,
          transform 120ms ease;
      }

      button[part~='control'] {
        min-block-size: var(--cv-carousel-control-size);
        min-inline-size: var(--cv-carousel-control-size);
        border-radius: var(--cv-carousel-control-radius);
      }

      button[part~='indicator'] {
        min-block-size: var(--cv-carousel-indicator-target-size);
        min-inline-size: var(--cv-carousel-indicator-target-size);
        border-color: transparent;
        background: transparent;
        border-radius: 999px;
      }

      button[part~='control']:hover,
      button[part~='indicator']:hover {
        border-color: var(--cv-color-primary, #65d7ff);
        color: var(--cv-color-primary, #65d7ff);
      }

      button[part~='control']:focus-visible,
      button[part~='indicator']:focus-visible {
        outline: 2px solid var(--cv-color-primary, #65d7ff);
        outline-offset: 2px;
      }

      [part='indicator-dot'] {
        display: block;
        inline-size: var(--cv-carousel-indicator-size);
        block-size: var(--cv-carousel-indicator-size);
        border-radius: 999px;
        background: var(--cv-color-border, #2a3245);
        transition:
          background 120ms ease,
          inline-size 120ms ease;
      }

      button[part~='indicator'][data-active='true'] [part='indicator-dot'] {
        inline-size: calc(var(--cv-carousel-indicator-size) * 2.4);
        background: var(--cv-color-primary, #65d7ff);
      }

      @media (max-width: 640px) {
        :host {
          --cv-carousel-scroll-padding: var(--cv-space-2, 8px);
          --cv-carousel-slide-inline-size: calc(100% - var(--cv-carousel-mobile-peek));
        }
      }
    `,
  ]

  static define() {
    CVIcon.define()
    if (!customElements.get(this.elementName)) {
      customElements.define(this.elementName, this)
    }
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this.rebuildModelFromSlot(false, false)
  }

  override disconnectedCallback(): void {
    // Stop the self-rescheduling autoplay timer chain so it does not keep
    // running (and rescheduling) after the element leaves the DOM.
    this.model.actions.pause()
    this.cancelPendingScrollSync()
    this.clearProgrammaticScrollReleaseTimer()
    super.disconnectedCallback()
  }

  override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    if (
      changedProperties.has('autoplay') ||
      changedProperties.has('autoplayInterval') ||
      changedProperties.has('visibleSlides') ||
      changedProperties.has('ariaLabel') ||
      changedProperties.has('ariaLabelledBy')
    ) {
      this.rebuildModelFromSlot(true, false)
      return
    }

    if (changedProperties.has('activeIndex') && this.activeIndex !== this.model.state.activeSlideIndex()) {
      const previous = this.captureSnapshot()
      this.model.actions.moveTo(this.activeIndex)
      this.applyInteractionResult(previous)
    }

    if (changedProperties.has('value')) {
      const normalized = this.value?.trim() ?? ''
      if (this.value !== normalized) {
        this.value = normalized
      }

      const index = this.slideRecords.findIndex((record) => record.id === normalized)
      if (index >= 0 && index !== this.model.state.activeSlideIndex()) {
        const previous = this.captureSnapshot()
        this.model.actions.moveTo(index)
        this.applyInteractionResult(previous)
      }
    }

    if (changedProperties.has('paused') && this.paused !== this.model.state.isPaused()) {
      const previous = this.captureSnapshot()
      if (this.paused) {
        this.model.actions.pause()
      } else {
        this.model.actions.play()
      }

      this.applyInteractionResult(previous)
    }
  }

  override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties)

    const shouldSyncFromModel =
      !changedProperties.has('activeIndex') &&
      !changedProperties.has('value') &&
      !changedProperties.has('paused')

    if (shouldSyncFromModel) {
      const previous: CarouselSnapshot = {
        activeIndex: this.activeIndex,
        paused: this.paused,
      }

      this.syncControlledValuesFromModel()
      this.dispatchStateEvents(previous, this.captureSnapshot())
    }

    this.syncSlideElements()
    this.scrollActiveSlideIntoView()
  }

  next(): void {
    const previous = this.captureSnapshot()
    this.model.actions.moveNext()
    this.applyInteractionResult(previous)
  }

  prev(): void {
    const previous = this.captureSnapshot()
    this.model.actions.movePrev()
    this.applyInteractionResult(previous)
  }

  play(): void {
    const previous = this.captureSnapshot()
    this.model.actions.play()
    this.applyInteractionResult(previous)
  }

  pause(): void {
    const previous = this.captureSnapshot()
    this.model.actions.pause()
    this.applyInteractionResult(previous)
  }

  private getSlideElements(): CVCarouselSlide[] {
    return Array.from(this.children).filter(
      (element): element is CVCarouselSlide => element.tagName.toLowerCase() === CVCarouselSlide.elementName,
    )
  }

  private static readonly DEFAULT_AUTOPLAY_INTERVAL = 5000
  private static readonly DEFAULT_VISIBLE_SLIDES = 1

  // Guard against NaN/invalid numeric attributes: a non-numeric `visible-slides`
  // would otherwise yield NaN → empty visibleSlideIndices → every slide
  // (including the active one) hidden; a non-numeric `autoplay-interval` would
  // feed setTimeout(NaN) → an effectively 0ms rotation loop.
  private sanitizeVisibleSlides(): number {
    const value = this.visibleSlides
    if (!Number.isFinite(value) || value < 1) return CVCarousel.DEFAULT_VISIBLE_SLIDES
    return Math.floor(value)
  }

  private sanitizeAutoplayInterval(): number {
    const value = this.autoplayInterval
    if (!Number.isFinite(value) || value < 1) return CVCarousel.DEFAULT_AUTOPLAY_INTERVAL
    return value
  }

  private ensureSlideValue(slide: CVCarouselSlide, index: number): string {
    const normalized = slide.value?.trim()
    if (normalized) return normalized

    const fallback = `slide-${index + 1}`
    slide.value = fallback
    return fallback
  }

  private rebuildModelFromSlot(preserveState: boolean, requestRender = true): void {
    const previous = preserveState
      ? this.captureSnapshot()
      : {activeIndex: this.activeIndex, paused: this.paused}
    const previousActiveSlideId = preserveState ? (this.slideRecords[previous.activeIndex]?.id ?? null) : null

    this.slideRecords = this.getSlideElements().map((element, index) => ({
      id: this.ensureSlideValue(element, index),
      label: element.label || element.textContent?.trim() || `Slide ${index + 1}`,
      element,
    }))

    const activeIndexById =
      previousActiveSlideId == null
        ? -1
        : this.slideRecords.findIndex((record) => record.id === previousActiveSlideId)

    // When value is set, it takes precedence over activeIndex
    const valueNormalized = this.value?.trim()
    const activeIndexByValue =
      !preserveState && valueNormalized
        ? this.slideRecords.findIndex((record) => record.id === valueNormalized)
        : -1

    const initialActiveSlideIndex =
      activeIndexByValue >= 0
        ? activeIndexByValue
        : activeIndexById >= 0
          ? activeIndexById
          : previous.activeIndex

    // Stop the previous model's autoplay timer before replacing it, otherwise
    // its self-rescheduling setTimeout chain keeps firing against an orphaned
    // model (property-driven rebuilds would leak a live timer each time).
    this.model.actions.pause()

    this.model = createCarousel({
      idBase: this.idBase,
      slides: this.slideRecords.map((slide) => ({
        id: slide.id,
        label: slide.label,
      })),
      ariaLabel: this.ariaLabel || undefined,
      ariaLabelledBy: this.ariaLabelledBy || undefined,
      autoplay: this.autoplay,
      autoplayIntervalMs: this.sanitizeAutoplayInterval(),
      visibleSlides: this.sanitizeVisibleSlides(),
      initialActiveSlideIndex,
      initialPaused: previous.paused,
    })

    this.lastScrolledActiveIndex = -1
    this.syncSlideElements()
    this.syncControlledValuesFromModel()

    if (requestRender) {
      this.requestUpdate()
    }
  }

  private syncSlideElements(): void {
    for (const [index, record] of this.slideRecords.entries()) {
      const props = this.model.contracts.getSlideProps(index)

      record.element.id = props.id
      record.element.setAttribute('role', props.role)
      record.element.setAttribute('aria-roledescription', props['aria-roledescription'])
      record.element.setAttribute('aria-label', props['aria-label'])
      record.element.setAttribute('aria-hidden', props['aria-hidden'])
      record.element.setAttribute('data-active', props['data-active'])
      record.element.active = props['data-active'] === 'true'
      record.element.hidden = false
      record.element.toggleAttribute('inert', props['aria-hidden'] === 'true')
    }
  }

  private syncControlledValuesFromModel(): void {
    const index = this.model.state.activeSlideIndex()
    this.activeIndex = index
    this.value = this.slideRecords[index]?.id ?? ''
    this.paused = this.model.state.isPaused()
  }

  private captureSnapshot(): CarouselSnapshot {
    return {
      activeIndex: this.model.state.activeSlideIndex(),
      paused: this.model.state.isPaused(),
    }
  }

  private dispatchInput(detail: CVCarouselEventDetail): void {
    this.dispatchEvent(
      new CustomEvent('cv-input', {
        detail,
        bubbles: true,
        composed: true,
      }),
    )
  }

  private dispatchChange(detail: CVCarouselEventDetail): void {
    this.dispatchEvent(
      new CustomEvent('cv-change', {
        detail,
        bubbles: true,
        composed: true,
      }),
    )
  }

  private applyInteractionResult(previous: CarouselSnapshot): void {
    this.syncSlideElements()

    const next = this.captureSnapshot()
    this.syncControlledValuesFromModel()
    this.dispatchStateEvents(previous, next)
  }

  private dispatchStateEvents(previous: CarouselSnapshot, next: CarouselSnapshot): void {
    const indexChanged = previous.activeIndex !== next.activeIndex
    const pausedChanged = previous.paused !== next.paused
    if (!indexChanged && !pausedChanged) return

    const detail: CVCarouselEventDetail = {
      activeIndex: next.activeIndex,
      activeValue: this.value || null,
      paused: next.paused,
    }

    this.dispatchInput(detail)
    if (indexChanged) {
      this.dispatchChange(detail)
    }
  }

  private handleRootFocusIn() {
    const previous = this.captureSnapshot()
    this.model.contracts.getRootProps().onFocusIn()
    this.applyInteractionResult(previous)
  }

  private handleRootFocusOut() {
    const previous = this.captureSnapshot()
    this.model.contracts.getRootProps().onFocusOut()
    this.applyInteractionResult(previous)
  }

  private handleRootPointerEnter() {
    const previous = this.captureSnapshot()
    this.model.contracts.getRootProps().onPointerEnter()
    this.applyInteractionResult(previous)
  }

  private handleRootPointerLeave() {
    const previous = this.captureSnapshot()
    this.model.contracts.getRootProps().onPointerLeave()
    this.applyInteractionResult(previous)
  }

  private handleKeyDown(event: KeyboardEvent) {
    // Ignore modifier combinations (e.g. Ctrl+Home, Alt+ArrowLeft) so browser
    // shortcuts are not hijacked by the carousel.
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
      return
    }

    if (carouselKeysToPrevent.has(event.key)) {
      event.preventDefault()
    }

    const previous = this.captureSnapshot()
    this.model.actions.handleKeyDown({key: event.key})
    this.applyInteractionResult(previous)
  }

  private handlePrevClick() {
    const previous = this.captureSnapshot()
    this.model.contracts.getPrevButtonProps().onClick()
    this.applyInteractionResult(previous)
  }

  private handleNextClick() {
    const previous = this.captureSnapshot()
    this.model.contracts.getNextButtonProps().onClick()
    this.applyInteractionResult(previous)
  }

  private handlePlayPauseClick() {
    const previous = this.captureSnapshot()
    this.model.contracts.getPlayPauseButtonProps().onClick()
    this.applyInteractionResult(previous)
  }

  private handleIndicatorClick(event: Event) {
    const target = event.currentTarget as HTMLElement | null
    const index = Number(target?.dataset['index'])
    if (!Number.isInteger(index)) return

    const previous = this.captureSnapshot()
    this.model.contracts.getIndicatorProps(index).onClick()
    this.applyInteractionResult(previous)
  }

  private handleSlotChange() {
    this.rebuildModelFromSlot(true, true)
  }

  private handleSlidesScroll(event: Event) {
    if (this.isProgrammaticScroll) return
    const target = event.currentTarget
    if (!(target instanceof HTMLElement)) return
    this.scheduleScrollSync(target)
  }

  private handleSlidesScrollEnd() {
    this.clearProgrammaticScrollGuard()
  }

  private scheduleScrollSync(slidesContainer: HTMLElement): void {
    if (this.scrollSyncFrame != null) return

    this.scrollSyncFrame = this.requestAnimationFrame(() => {
      this.scrollSyncFrame = null
      this.syncActiveSlideFromScroll(slidesContainer)
    })
  }

  private syncActiveSlideFromScroll(slidesContainer: HTMLElement): void {
    const nearestIndex = this.findNearestSlideIndex(slidesContainer)
    if (nearestIndex == null || nearestIndex === this.model.state.activeSlideIndex()) return

    const previous = this.captureSnapshot()
    this.model.actions.moveTo(nearestIndex)
    this.applyInteractionResult(previous)
  }

  private findNearestSlideIndex(slidesContainer: HTMLElement): number | null {
    if (this.slideRecords.length === 0) return null

    const containerRect = slidesContainer.getBoundingClientRect()
    const containerCenter = containerRect.left + containerRect.width / 2
    let nearestIndex = 0
    let nearestDistance = Number.POSITIVE_INFINITY

    for (const [index, record] of this.slideRecords.entries()) {
      const rect = record.element.getBoundingClientRect()
      const slideCenter = rect.left + rect.width / 2
      const distance = Math.abs(slideCenter - containerCenter)

      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = index
      }
    }

    return Number.isFinite(nearestDistance) ? nearestIndex : null
  }

  private scrollActiveSlideIntoView(): void {
    const activeIndex = this.model.state.activeSlideIndex()
    if (activeIndex === this.lastScrolledActiveIndex) return

    const record = this.slideRecords[activeIndex]
    if (!record || typeof record.element.scrollIntoView !== 'function') return

    this.lastScrolledActiveIndex = activeIndex
    this.isProgrammaticScroll = true
    record.element.scrollIntoView({
      behavior: this.getScrollBehavior(),
      block: 'nearest',
      inline: 'center',
    })
    this.scheduleProgrammaticScrollRelease()
  }

  private getScrollBehavior(): ScrollBehavior {
    if (typeof window.matchMedia !== 'function') return 'auto'
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
  }

  private requestAnimationFrame(callback: FrameRequestCallback): number {
    if (typeof window.requestAnimationFrame === 'function') {
      return window.requestAnimationFrame(callback)
    }

    return window.setTimeout(() => callback(0), 0)
  }

  private cancelAnimationFrame(handle: number): void {
    if (typeof window.cancelAnimationFrame === 'function') {
      window.cancelAnimationFrame(handle)
      return
    }

    window.clearTimeout(handle)
  }

  private scheduleProgrammaticScrollRelease(): void {
    this.clearProgrammaticScrollReleaseTimer()
    this.programmaticScrollReleaseTimer = setTimeout(() => {
      this.clearProgrammaticScrollGuard()
    }, 400)
  }

  private clearProgrammaticScrollGuard(): void {
    this.clearProgrammaticScrollReleaseTimer()
    this.isProgrammaticScroll = false
  }

  private clearProgrammaticScrollReleaseTimer(): void {
    if (this.programmaticScrollReleaseTimer == null) return
    clearTimeout(this.programmaticScrollReleaseTimer)
    this.programmaticScrollReleaseTimer = null
  }

  private cancelPendingScrollSync(): void {
    if (this.scrollSyncFrame == null) return
    this.cancelAnimationFrame(this.scrollSyncFrame)
    this.scrollSyncFrame = null
  }

  protected override render() {
    const rootProps = this.model.contracts.getRootProps()
    const slideGroupProps = this.model.contracts.getSlideGroupProps()
    const prevProps = this.model.contracts.getPrevButtonProps()
    const nextProps = this.model.contracts.getNextButtonProps()
    const playPauseProps = this.model.contracts.getPlayPauseButtonProps()
    const playPauseIcon = this.model.state.isPaused() ? 'circle-play' : 'pause-circle'

    return html`
      <section
        id=${rootProps.id}
        role=${rootProps.role}
        aria-roledescription=${rootProps['aria-roledescription']}
        aria-label=${rootProps['aria-label'] ?? nothing}
        aria-labelledby=${rootProps['aria-labelledby'] ?? nothing}
        aria-live=${rootProps['aria-live']}
        tabindex="0"
        part="base"
        @keydown=${this.handleKeyDown}
        @focusin=${this.handleRootFocusIn}
        @focusout=${this.handleRootFocusOut}
        @pointerenter=${this.handleRootPointerEnter}
        @pointerleave=${this.handleRootPointerLeave}
      >
        <div part="controls">
          <button
            id=${prevProps.id}
            role=${prevProps.role}
            tabindex=${prevProps.tabindex}
            aria-controls=${prevProps['aria-controls']}
            aria-label=${prevProps['aria-label']}
            title=${prevProps['aria-label']}
            part="control prev"
            @click=${this.handlePrevClick}
          >
            <cv-icon name="chevron-left" size="m" aria-hidden="true"></cv-icon>
          </button>

          <button
            id=${nextProps.id}
            role=${nextProps.role}
            tabindex=${nextProps.tabindex}
            aria-controls=${nextProps['aria-controls']}
            aria-label=${nextProps['aria-label']}
            title=${nextProps['aria-label']}
            part="control next"
            @click=${this.handleNextClick}
          >
            <cv-icon name="chevron-right" size="m" aria-hidden="true"></cv-icon>
          </button>

          <button
            id=${playPauseProps.id}
            role=${playPauseProps.role}
            tabindex=${playPauseProps.tabindex}
            aria-controls=${playPauseProps['aria-controls']}
            aria-label=${playPauseProps['aria-label']}
            title=${playPauseProps['aria-label']}
            part="control play-pause"
            @click=${this.handlePlayPauseClick}
          >
            <cv-icon name=${playPauseIcon} size="m" aria-hidden="true"></cv-icon>
          </button>
        </div>

        <div
          id=${slideGroupProps.id}
          role=${slideGroupProps.role}
          aria-label=${slideGroupProps['aria-label'] ?? nothing}
          part="slides"
          @scroll=${this.handleSlidesScroll}
          @scrollend=${this.handleSlidesScrollEnd}
        >
          <slot @slotchange=${this.handleSlotChange}></slot>
        </div>

        <div part="indicators">
          ${this.slideRecords.map((_, index) => {
            const indicatorProps = this.model.contracts.getIndicatorProps(index)
            return html`
              <button
                id=${indicatorProps.id}
                role=${indicatorProps.role}
                tabindex=${indicatorProps.tabindex}
                aria-controls=${indicatorProps['aria-controls']}
                aria-label=${indicatorProps['aria-label']}
                aria-current=${indicatorProps['aria-current'] ?? nothing}
                data-active=${indicatorProps['data-active']}
                data-index=${index}
                part="indicator"
                @click=${this.handleIndicatorClick}
              >
                <span part="indicator-dot" aria-hidden="true"></span>
              </button>
            `
          })}
        </div>
      </section>
    `
  }
}
