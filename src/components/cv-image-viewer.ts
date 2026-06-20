import {nothing, type PropertyValues} from 'lit'
import {keyed} from 'lit/directives/keyed.js'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'
import {CVButton} from './cv-button'
import {CVDialog} from './cv-dialog'
import {CVIcon} from './cv-icon'
import {cvImageViewerStyles} from './cv-image-viewer.styles'
import {CVMenuButton, type CVMenuButtonInputEvent} from './cv-menu-button'
import {CVMenuItem} from './cv-menu-item'
import {CVSpinner} from './cv-spinner'

export type CVImageViewerItem = {
  id: string | number
  title: string
  alt?: string
  meta?: readonly string[]
  src?: string | null
  thumbnailSrc?: string | null
  loading?: boolean
  error?: string | null
}

export type CVImageViewerAction = {
  value: string
  label: string
  icon?: string
  dangerous?: boolean
  disabled?: boolean
  loading?: boolean
}

export type CVImageViewerThumbnailWindow = {
  indices: number[]
  beforeCount: number
  afterCount: number
  thumbnailStepPx: number
}

export type CVImageViewerLayout = 'desktop' | 'mobile' | 'auto'
export type CVImageViewerCloseReason = 'control' | 'escape' | 'backdrop'
export type CVImageViewerNavigationDirection = 'forward' | 'backward' | 'none'
export type CVImageViewerNavigationSource = 'control' | 'gesture' | 'keyboard' | 'thumbnail' | 'programmatic'

export type CVImageViewerCloseDetail = {
  reason: CVImageViewerCloseReason
}

export type CVImageViewerNavigationDetail = {
  index: number
  itemId: string | number | null
  direction: CVImageViewerNavigationDirection
  source: CVImageViewerNavigationSource
}

export type CVImageViewerActionDetail = {
  value: string
  itemId: string | number | null
  index: number
}

export type CVImageViewerImageErrorDetail = {
  itemId: string | number | null
  index: number
  sourceUrl: string | null
}

export type CVImageViewerThumbnailMetricsDetail = {
  viewportWidth: number
  thumbnailStepPx: number
  centerIndex: number
}

export type CVImageViewerPrimeDetail = {
  index: number
  itemId: string | number | null
  reason: 'open' | 'navigation' | 'thumbnail'
}

export type CVImageViewerCloseEvent = CustomEvent<CVImageViewerCloseDetail>
export type CVImageViewerInputEvent = CustomEvent<CVImageViewerNavigationDetail>
export type CVImageViewerChangeEvent = CustomEvent<CVImageViewerNavigationDetail>
export type CVImageViewerActionEvent = CustomEvent<CVImageViewerActionDetail>
export type CVImageViewerImageErrorEvent = CustomEvent<CVImageViewerImageErrorDetail>
export type CVImageViewerThumbnailMetricsEvent = CustomEvent<CVImageViewerThumbnailMetricsDetail>
export type CVImageViewerPrimeEvent = CustomEvent<CVImageViewerPrimeDetail>

export interface CVImageViewerEventMap {
  'cv-close': CVImageViewerCloseEvent
  'cv-input': CVImageViewerInputEvent
  'cv-change': CVImageViewerChangeEvent
  'cv-action': CVImageViewerActionEvent
  'cv-image-error': CVImageViewerImageErrorEvent
  'cv-thumbnail-metrics': CVImageViewerThumbnailMetricsEvent
  'cv-prime': CVImageViewerPrimeEvent
}

const DEFAULT_THUMBNAIL_STEP_PX = 64
const IMAGE_TRANSITION_FALLBACK_MS = 360
const WHEEL_GESTURE_LINE_PX = 16
const WHEEL_GESTURE_PAGE_PX = 800
const WHEEL_GESTURE_DELTA_LINE = 1
const WHEEL_GESTURE_DELTA_PAGE = 2
const WHEEL_GESTURE_MIN_DELTA_PX = 8
const WHEEL_GESTURE_HORIZONTAL_RATIO = 1.35
const WHEEL_GESTURE_NAVIGATION_THRESHOLD_PX = 80
const WHEEL_GESTURE_RESET_MS = 220

type PendingNavigation = {
  index: number
  direction: CVImageViewerNavigationDirection
  source: CVImageViewerNavigationSource
}

function getDeepActiveElement(): HTMLElement | null {
  let activeElement = document.activeElement
  while (
    activeElement instanceof HTMLElement &&
    activeElement.shadowRoot?.activeElement instanceof HTMLElement
  ) {
    activeElement = activeElement.shadowRoot.activeElement
  }

  return activeElement instanceof HTMLElement ? activeElement : null
}

function clampIndex(index: number, itemCount: number): number {
  if (itemCount <= 0) return 0
  if (!Number.isFinite(index)) return 0
  return Math.min(Math.max(Math.trunc(index), 0), itemCount - 1)
}

function getDirection(fromIndex: number, toIndex: number): CVImageViewerNavigationDirection {
  if (toIndex > fromIndex) return 'forward'
  if (toIndex < fromIndex) return 'backward'
  return 'none'
}

function isInteractiveTextInput(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tagName = target.tagName.toLowerCase()
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable
}

function normalizeWheelDelta(delta: number, deltaMode: number): number {
  if (deltaMode === WHEEL_GESTURE_DELTA_LINE) return delta * WHEEL_GESTURE_LINE_PX
  if (deltaMode === WHEEL_GESTURE_DELTA_PAGE) return delta * WHEEL_GESTURE_PAGE_PX
  return delta
}

export class CVImageViewer extends ReatomLitElement {
  static elementName = 'cv-image-viewer'

  static get properties() {
    return {
      open: {type: Boolean, reflect: true},
      items: {attribute: false},
      currentIndex: {type: Number, attribute: 'current-index', reflect: true},
      actions: {attribute: false},
      thumbnailWindow: {attribute: false},
      busy: {type: Boolean, reflect: true},
      busyLabel: {type: String, attribute: 'busy-label'},
      chromeVisible: {type: Boolean, attribute: 'chrome-visible', reflect: true},
      layout: {type: String, reflect: true},
      showThumbnails: {type: Boolean, attribute: 'show-thumbnails', reflect: true},
    }
  }

  declare open: boolean
  declare items: CVImageViewerItem[]
  declare currentIndex: number
  declare actions: CVImageViewerAction[]
  declare thumbnailWindow: CVImageViewerThumbnailWindow | null
  declare busy: boolean
  declare busyLabel: string
  declare chromeVisible: boolean
  declare layout: CVImageViewerLayout
  declare showThumbnails: boolean

  private focusRestoreTarget: HTMLElement | null = null
  private pendingNavigation: PendingNavigation | null = null
  private imageTransitionDirection: CVImageViewerNavigationDirection = 'none'
  private imageTransitionPreviousItem: CVImageViewerItem | null = null
  private imageTransitionTimer: ReturnType<typeof window.setTimeout> | null = null
  private imageTransitionCycle = 0
  private wheelGestureDeltaX = 0
  private wheelGestureLocked = false
  private wheelGestureTimer: ReturnType<typeof window.setTimeout> | null = null

  constructor() {
    super()
    this.open = false
    this.items = []
    this.currentIndex = 0
    this.actions = []
    this.thumbnailWindow = null
    this.busy = false
    this.busyLabel = 'Loading'
    this.chromeVisible = true
    this.layout = 'auto'
    this.showThumbnails = true
  }

  static styles = [cvImageViewerStyles]

  static define() {
    CVDialog.define()
    CVButton.define()
    CVIcon.define()
    CVMenuButton.define()
    CVMenuItem.define()
    CVSpinner.define()

    if (!customElements.get(this.elementName)) {
      customElements.define(this.elementName, this)
    }
  }

  override disconnectedCallback(): void {
    if (this.open) {
      this.restoreCapturedFocus()
    }

    this.resetImageTransition()
    this.resetWheelGesture()
    super.disconnectedCallback()
  }

  override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    if (changedProperties.has('open') && this.open && changedProperties.get('open') !== true) {
      this.captureFocusRestoreTarget()
    }

    if (changedProperties.has('currentIndex')) {
      this.prepareImageTransition(changedProperties.get('currentIndex'))
    }
  }

  override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties)

    if (changedProperties.has('open') && this.open) {
      this.dispatchPrime(this.currentItemIndex, 'open')
      this.dispatchThumbnailMetrics()
      return
    }

    if (!this.open) {
      this.pendingNavigation = null
      this.resetImageTransition()
      this.resetWheelGesture()
      return
    }

    if (changedProperties.has('currentIndex')) {
      this.dispatchCommittedNavigation(changedProperties.get('currentIndex'))
    }
  }

  private captureFocusRestoreTarget(): void {
    const activeElement = getDeepActiveElement()
    if (!activeElement || activeElement === document.body || activeElement === document.documentElement) {
      this.focusRestoreTarget = null
      return
    }

    this.focusRestoreTarget = activeElement
  }

  private restoreCapturedFocus(): void {
    const target = this.focusRestoreTarget
    this.focusRestoreTarget = null

    if (!target?.isConnected) return

    try {
      target.focus({preventScroll: true})
    } catch {
      target.focus()
    }
  }

  next(source: CVImageViewerNavigationSource = 'programmatic'): void {
    this.navigateTo(this.currentItemIndex + 1, source)
  }

  previous(source: CVImageViewerNavigationSource = 'programmatic'): void {
    this.navigateTo(this.currentItemIndex - 1, source)
  }

  goTo(index: number, source: CVImageViewerNavigationSource = 'programmatic'): void {
    this.navigateTo(index, source)
  }

  private get currentItemIndex(): number {
    return clampIndex(this.currentIndex, this.items.length)
  }

  private get currentItem(): CVImageViewerItem | undefined {
    return this.items[this.currentItemIndex]
  }

  private get thumbnailIndices(): number[] {
    const source = this.thumbnailWindow?.indices ?? this.items.map((_, index) => index)
    const seen = new Set<number>()

    return source.filter((index) => {
      if (!Number.isInteger(index) || index < 0 || index >= this.items.length || seen.has(index)) {
        return false
      }
      seen.add(index)
      return true
    })
  }

  private navigateTo(index: number, source: CVImageViewerNavigationSource): void {
    const nextIndex = clampIndex(index, this.items.length)
    const previousIndex = this.currentItemIndex
    if (this.items.length === 0 || nextIndex === previousIndex) {
      return
    }

    const direction = getDirection(previousIndex, nextIndex)
    const detail = this.createNavigationDetail(nextIndex, direction, source)
    this.pendingNavigation = {
      index: nextIndex,
      direction,
      source,
    }
    this.dispatchViewerEvent('cv-input', detail)
    this.dispatchPrime(nextIndex, source === 'thumbnail' ? 'thumbnail' : 'navigation')
  }

  private dispatchCommittedNavigation(previousValue: unknown): void {
    if (!this.items.length) {
      this.pendingNavigation = null
      return
    }

    const nextIndex = this.currentItemIndex
    const previousIndex =
      typeof previousValue === 'number' ? clampIndex(previousValue, this.items.length) : nextIndex

    if (nextIndex === previousIndex) {
      return
    }

    const pending = this.pendingNavigation?.index === nextIndex ? this.pendingNavigation : null
    const direction = pending?.direction ?? getDirection(previousIndex, nextIndex)
    const source = pending?.source ?? 'programmatic'

    if (this.pendingNavigation) {
      this.pendingNavigation = null
    }

    this.dispatchViewerEvent('cv-change', this.createNavigationDetail(nextIndex, direction, source))

    if (!pending) {
      this.dispatchPrime(nextIndex, 'navigation')
    }
  }

  private createNavigationDetail(
    index: number,
    direction: CVImageViewerNavigationDirection,
    source: CVImageViewerNavigationSource,
  ): CVImageViewerNavigationDetail {
    return {
      index,
      itemId: this.items[index]?.id ?? null,
      direction,
      source,
    }
  }

  private dispatchViewerEvent<T>(name: keyof CVImageViewerEventMap, detail: T): void {
    this.dispatchEvent(new CustomEvent(name, {detail, bubbles: true, composed: true}))
  }

  private prepareImageTransition(previousValue: unknown): void {
    if (!this.open || typeof previousValue !== 'number' || this.items.length <= 1) {
      this.resetImageTransition()
      return
    }

    const nextIndex = this.currentItemIndex
    const previousIndex = clampIndex(previousValue, this.items.length)
    if (nextIndex === previousIndex) {
      this.resetImageTransition()
      return
    }

    const currentItem = this.items[nextIndex]
    const previousItem = this.items[previousIndex]
    if (!currentItem?.src || currentItem.loading || currentItem.error || !previousItem?.src) {
      this.resetImageTransition()
      return
    }

    this.clearImageTransitionTimer()
    this.imageTransitionCycle += 1
    this.imageTransitionDirection =
      this.pendingNavigation?.index === nextIndex
        ? this.pendingNavigation.direction
        : getDirection(previousIndex, nextIndex)
    this.imageTransitionPreviousItem = previousItem
    this.imageTransitionTimer = window.setTimeout(() => {
      this.finishImageTransition()
    }, IMAGE_TRANSITION_FALLBACK_MS)
  }

  private clearImageTransitionTimer(): void {
    if (!this.imageTransitionTimer) return
    window.clearTimeout(this.imageTransitionTimer)
    this.imageTransitionTimer = null
  }

  private resetImageTransition(): void {
    this.clearImageTransitionTimer()
    this.imageTransitionDirection = 'none'
    this.imageTransitionPreviousItem = null
  }

  private finishImageTransition(): void {
    if (this.imageTransitionDirection === 'none' && !this.imageTransitionPreviousItem) return
    this.resetImageTransition()
    this.requestUpdate()
  }

  private resetWheelGesture(): void {
    if (this.wheelGestureTimer) {
      window.clearTimeout(this.wheelGestureTimer)
      this.wheelGestureTimer = null
    }

    this.wheelGestureDeltaX = 0
    this.wheelGestureLocked = false
  }

  private scheduleWheelGestureReset(): void {
    if (this.wheelGestureTimer) {
      window.clearTimeout(this.wheelGestureTimer)
    }

    this.wheelGestureTimer = window.setTimeout(() => {
      this.resetWheelGesture()
    }, WHEEL_GESTURE_RESET_MS)
  }

  private dispatchClose(reason: CVImageViewerCloseReason): void {
    this.dispatchViewerEvent('cv-close', {reason})
  }

  private dispatchPrime(index: number, reason: CVImageViewerPrimeDetail['reason']): void {
    if (this.items.length === 0) return
    this.dispatchViewerEvent('cv-prime', {
      index,
      itemId: this.items[index]?.id ?? null,
      reason,
    })
  }

  private dispatchThumbnailMetrics(): void {
    const strip = this.shadowRoot?.querySelector('[part="thumbnails"]') as HTMLElement | null
    if (!strip) {
      return
    }

    this.dispatchViewerEvent('cv-thumbnail-metrics', {
      viewportWidth: strip.clientWidth,
      thumbnailStepPx: this.thumbnailWindow?.thumbnailStepPx ?? DEFAULT_THUMBNAIL_STEP_PX,
      centerIndex: this.currentItemIndex,
    })
  }

  private handleShellKeyDown(event: KeyboardEvent) {
    if (!this.open || event.defaultPrevented || isInteractiveTextInput(event.target)) return

    switch (event.key) {
      case 'Escape':
        event.preventDefault()
        event.stopPropagation()
        this.dispatchClose('escape')
        break
      case 'ArrowLeft':
        event.preventDefault()
        event.stopPropagation()
        this.previous('keyboard')
        break
      case 'ArrowRight':
        event.preventDefault()
        event.stopPropagation()
        this.next('keyboard')
        break
      case 'Home':
        event.preventDefault()
        event.stopPropagation()
        this.goTo(0, 'keyboard')
        break
      case 'End':
        event.preventDefault()
        event.stopPropagation()
        this.goTo(this.items.length - 1, 'keyboard')
        break
    }
  }

  private handleViewportBackdropClick(event: MouseEvent) {
    if (event.target !== event.currentTarget) return
    this.dispatchClose('backdrop')
  }

  private handleViewportWheel(event: WheelEvent) {
    if (!this.open || event.defaultPrevented || this.items.length <= 1) return
    if (event.ctrlKey || event.metaKey || event.altKey) return

    const deltaX = normalizeWheelDelta(event.deltaX, event.deltaMode)
    const deltaY = normalizeWheelDelta(event.deltaY, event.deltaMode)
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)
    const isHorizontalGesture =
      absX >= WHEEL_GESTURE_MIN_DELTA_PX && absX > absY * WHEEL_GESTURE_HORIZONTAL_RATIO

    if (!isHorizontalGesture) return

    event.preventDefault()
    event.stopPropagation()
    this.scheduleWheelGestureReset()

    if (this.wheelGestureLocked) return

    this.wheelGestureDeltaX += deltaX
    if (Math.abs(this.wheelGestureDeltaX) < WHEEL_GESTURE_NAVIGATION_THRESHOLD_PX) return

    const direction = this.wheelGestureDeltaX > 0 ? 'forward' : 'backward'
    this.wheelGestureDeltaX = 0
    this.wheelGestureLocked = true

    if (direction === 'forward') {
      this.next('gesture')
    } else {
      this.previous('gesture')
    }
  }

  private handleCloseClick() {
    this.dispatchClose('control')
  }

  private handlePreviousClick() {
    this.previous('control')
  }

  private handleNextClick() {
    this.next('control')
  }

  private handleThumbnailScroll() {
    this.dispatchThumbnailMetrics()
  }

  private handleThumbnailClick(event: Event) {
    const index = Number((event.currentTarget as HTMLElement | null)?.dataset['index'])
    if (!Number.isInteger(index)) return
    this.goTo(index, 'thumbnail')
  }

  private handleThumbnailPointerEnter(event: Event) {
    const index = Number((event.currentTarget as HTMLElement | null)?.dataset['index'])
    if (!Number.isInteger(index) || index < 0 || index >= this.items.length) return
    this.dispatchPrime(index, 'thumbnail')
  }

  private handleImageError(event: Event) {
    const image = event.currentTarget as HTMLImageElement
    this.dispatchViewerEvent('cv-image-error', {
      itemId: this.currentItem?.id ?? null,
      index: this.currentItemIndex,
      sourceUrl: image.currentSrc || image.src || null,
    })
  }

  private handleImageTransitionEnd(event: Event) {
    if (!(event.target instanceof HTMLImageElement)) return
    if (event.target.dataset['transitionPhase'] !== 'current') return
    this.finishImageTransition()
  }

  private handleActionClick(event: Event) {
    const value = (event.currentTarget as HTMLElement | null)?.dataset['action']
    this.dispatchAction(value)
  }

  private handleActionMenuInput(event: CVMenuButtonInputEvent) {
    const value = event.detail.value
    if (!value || event.detail.open) return
    ;(event.currentTarget as CVMenuButton).value = ''
    this.dispatchAction(value)
  }

  private dispatchAction(value: string | null | undefined): void {
    if (!value) return
    const action = this.actions.find((entry) => entry.value === value)
    if (!action || action.disabled || action.loading) return

    this.dispatchViewerEvent('cv-action', {
      value,
      itemId: this.currentItem?.id ?? null,
      index: this.currentItemIndex,
    })
  }

  private renderActionButton(action: CVImageViewerAction) {
    const label = action.loading ? this.busyLabel || action.label : action.label

    return html`
      <cv-button
        unstyled
        class="viewer-icon-button"
        data-action=${action.value}
        data-dangerous=${action.dangerous ? 'true' : nothing}
        ?disabled=${Boolean(action.disabled || action.loading)}
        .loading=${Boolean(action.loading)}
        aria-label=${label}
        title=${label}
        @click=${this.handleActionClick}
      >
        ${
          action.loading
            ? html`<cv-spinner label=${label}></cv-spinner>`
            : html`<cv-icon name=${action.icon || 'circle'} size="m"></cv-icon>`
        }
      </cv-button>
    `
  }

  private renderActionMenu(actions: CVImageViewerAction[]) {
    if (actions.length === 0) return nothing

    return html`
      <cv-menu-button
        class="viewer-menu-button"
        variant="ghost"
        preset="icon-overflow"
        aria-label="More actions"
        @cv-input=${this.handleActionMenuInput}
      >
        <cv-icon slot="prefix" name="three-dots" size="m"></cv-icon>
        ${actions.map((action) => {
          const label = action.loading ? this.busyLabel || action.label : action.label

          return html`
            <cv-menu-item
              slot="menu"
              value=${action.value}
              data-action=${action.value}
              data-dangerous=${action.dangerous ? 'true' : nothing}
              ?disabled=${Boolean(action.disabled || action.loading)}
            >
              ${
                action.loading
                  ? html`<cv-spinner slot="prefix" size="xs" label=${label}></cv-spinner>`
                  : action.icon
                    ? html`<cv-icon slot="prefix" name=${action.icon} size="s"></cv-icon>`
                    : nothing
              }
              ${label}
            </cv-menu-item>
          `
        })}
      </cv-menu-button>
    `
  }

  private renderActions() {
    const visible = this.actions.slice(0, 3)
    const overflow = this.actions.slice(3)

    return html`
      ${visible.map((action) => this.renderActionButton(action))}
      ${this.renderActionMenu(overflow)}
    `
  }

  private renderFallbackViewport(item: CVImageViewerItem | undefined) {
    if (!item) {
      return html`
        <div part="state" role="status">No image selected</div>
      `
    }

    if (item.loading) {
      return html`
        <div part="state" role="status" aria-live="polite">
          <cv-spinner label=${item.title || 'Loading image'}></cv-spinner>
        </div>
      `
    }

    if (item.error) {
      return html`<div part="state" role="status">${item.error}</div>`
    }

    if (!item.src) {
      return html`
        <div part="state" role="status">Image is not available</div>
      `
    }

    const transitionDirection = this.imageTransitionDirection
    const outgoingItem =
      transitionDirection !== 'none' && this.imageTransitionPreviousItem?.src
        ? this.imageTransitionPreviousItem
        : null

    return html`
      <div
        part="image-stage"
        data-transition-direction=${transitionDirection}
        @animationend=${this.handleImageTransitionEnd}
      >
        ${keyed(
          `current-${this.imageTransitionCycle}-${this.currentItemIndex}-${item.id}-${item.src}`,
          html`
            <img
              part="image"
              data-transition-phase="current"
              src=${item.src}
              alt=${item.alt ?? item.title}
              decoding="async"
              @error=${this.handleImageError}
            />
          `,
        )}
        ${
          outgoingItem
            ? keyed(
                `outgoing-${this.imageTransitionCycle}-${outgoingItem.id}-${outgoingItem.src}`,
                html`
                  <img
                    part="image"
                    data-transition-phase="outgoing"
                    src=${outgoingItem.src}
                    alt=""
                    aria-hidden="true"
                    decoding="async"
                  />
                `,
              )
            : nothing
        }
      </div>
    `
  }

  private renderBusyOverlay() {
    if (!this.busy) return nothing
    const label = this.busyLabel || 'Loading'

    return html`
      <div part="busy-overlay" role="status" aria-live="polite">
        <div part="busy-status">
          <cv-spinner label=${label}></cv-spinner>
          <span>${label}</span>
        </div>
      </div>
    `
  }

  private renderThumbnails() {
    if (!this.showThumbnails || this.items.length <= 1) return nothing
    const beforeCount = this.thumbnailWindow?.beforeCount ?? 0
    const afterCount = this.thumbnailWindow?.afterCount ?? 0

    return html`
      <div part="thumbnails" @scroll=${this.handleThumbnailScroll}>
        ${
          beforeCount > 0
            ? html`<span part="thumbnail-window-spacer" aria-hidden="true">+${beforeCount}</span>`
            : nothing
        }
        ${this.thumbnailIndices.map((index) => {
          const item = this.items[index]
          if (!item) return nothing

          return html`
            <button
              part="thumbnail"
              type="button"
              data-index=${index}
              aria-label=${item.title}
              aria-current=${index === this.currentItemIndex ? 'true' : 'false'}
              @click=${this.handleThumbnailClick}
              @pointerenter=${this.handleThumbnailPointerEnter}
            >
              ${
                item.thumbnailSrc
                  ? html`<img src=${item.thumbnailSrc} alt="" loading="lazy" />`
                  : html`<span part="thumbnail-placeholder">${index + 1}</span>`
              }
            </button>
          `
        })}
        ${
          afterCount > 0
            ? html`<span part="thumbnail-window-spacer" aria-hidden="true">+${afterCount}</span>`
            : nothing
        }
      </div>
    `
  }

  protected override render() {
    const currentIndex = this.currentItemIndex
    const currentItem = this.items[currentIndex]
    const itemCount = this.items.length
    const title = currentItem?.title || 'Image viewer'
    const meta = currentItem?.meta ?? []
    const hasPrevious = currentIndex > 0
    const hasNext = currentIndex < itemCount - 1

    return html`
      <cv-dialog
        .open=${this.open}
        .noHeader=${true}
        .closeOnEscape=${false}
        .closeOnOutsidePointer=${false}
        .closeOnOutsideFocus=${false}
        .modal=${true}
        @keydown=${this.handleShellKeyDown}
      >
        <span slot="title">${title}</span>
        <section part="base" @keydown=${this.handleShellKeyDown}>
          <header part="header">
            <div part="title-group">
              <div part="title">${title}</div>
              <div part="meta">
                ${itemCount > 0 ? html`<span>${currentIndex + 1} / ${itemCount}</span>` : nothing}
                ${meta.map((item) => html`<span>${item}</span>`)}
              </div>
            </div>
            <div part="header-actions">
              ${this.renderActions()}
              <cv-button
                unstyled
                class="viewer-icon-button"
                aria-label="Close"
                title="Close"
                @click=${this.handleCloseClick}
              >
                <cv-icon name="x" size="m"></cv-icon>
              </cv-button>
            </div>
          </header>

          <main
            part="viewport-region"
            aria-busy=${String(this.busy || Boolean(currentItem?.loading))}
            @click=${this.handleViewportBackdropClick}
          >
            <div part="viewport" @wheel=${this.handleViewportWheel}>
              <slot name="viewport">${this.renderFallbackViewport(currentItem)}</slot>
            </div>
            <cv-button
              unstyled
              class="viewer-icon-button nav-button"
              part="nav nav-previous"
              ?disabled=${!hasPrevious}
              aria-label="Previous image"
              title="Previous image"
              @click=${this.handlePreviousClick}
            >
              <cv-icon name="chevron-left" size="m"></cv-icon>
            </cv-button>
            <cv-button
              unstyled
              class="viewer-icon-button nav-button"
              part="nav nav-next"
              ?disabled=${!hasNext}
              aria-label="Next image"
              title="Next image"
              @click=${this.handleNextClick}
            >
              <cv-icon name="chevron-right" size="m"></cv-icon>
            </cv-button>
            ${this.renderBusyOverlay()}
            <div part="overlay">
              <slot name="overlay"></slot>
            </div>
          </main>

          <footer part="footer">
            <slot name="footer">${this.renderThumbnails()}</slot>
          </footer>
        </section>
      </cv-dialog>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cv-image-viewer': CVImageViewer
  }
}
