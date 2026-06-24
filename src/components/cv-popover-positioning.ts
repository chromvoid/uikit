export type CVPopoverPlacement =
  | 'top-start'
  | 'top'
  | 'top-end'
  | 'right-start'
  | 'right'
  | 'right-end'
  | 'bottom-start'
  | 'bottom'
  | 'bottom-end'
  | 'left-start'
  | 'left'
  | 'left-end'

type PlacementSide = 'top' | 'right' | 'bottom' | 'left'
type PlacementAlign = 'start' | 'center' | 'end'

export interface CVPopoverRect {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
}

export interface CVPopoverViewport {
  width: number
  height: number
  padding: number
}

export interface CVPopoverResolvedPosition {
  left: number
  top: number
  placement: CVPopoverPlacement
}

export type CVPopoverArrowAxis = 'inline' | 'block'

export type CVPopoverLayoutClearOptions = {
  customProperties?: string[]
}

export type NativePopoverElement = HTMLElement & {
  showPopover?: (options?: {source?: HTMLElement}) => void
  hidePopover?: () => void
}

const mirrorSideMap: Record<PlacementSide, PlacementSide> = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
}

const orthogonalSidesMap: Record<PlacementSide, PlacementSide[]> = {
  top: ['right', 'left'],
  right: ['bottom', 'top'],
  bottom: ['right', 'left'],
  left: ['bottom', 'top'],
}

function parsePlacement(placement: CVPopoverPlacement): {
  side: PlacementSide
  align: PlacementAlign
} {
  const [side, align = 'center'] = placement.split('-') as [PlacementSide, PlacementAlign?]
  return {side, align}
}

function formatPlacement(side: PlacementSide, align: PlacementAlign): CVPopoverPlacement {
  if (align === 'center') {
    return side as CVPopoverPlacement
  }

  return `${side}-${align}` as CVPopoverPlacement
}

function computeCoords(
  anchorRect: CVPopoverRect,
  panelRect: CVPopoverRect,
  placement: CVPopoverPlacement,
  offset: number,
): CVPopoverResolvedPosition {
  const {side, align} = parsePlacement(placement)
  let left = 0
  let top = 0

  if (side === 'top' || side === 'bottom') {
    if (align === 'start') {
      left = anchorRect.left
    } else if (align === 'end') {
      left = anchorRect.right - panelRect.width
    } else {
      left = anchorRect.left + (anchorRect.width - panelRect.width) / 2
    }

    top = side === 'top' ? anchorRect.top - panelRect.height - offset : anchorRect.bottom + offset
  } else {
    if (align === 'start') {
      top = anchorRect.top
    } else if (align === 'end') {
      top = anchorRect.bottom - panelRect.height
    } else {
      top = anchorRect.top + (anchorRect.height - panelRect.height) / 2
    }

    left = side === 'left' ? anchorRect.left - panelRect.width - offset : anchorRect.right + offset
  }

  return {
    left: Math.round(left),
    top: Math.round(top),
    placement,
  }
}

function fitsViewport(
  position: CVPopoverResolvedPosition,
  panelRect: CVPopoverRect,
  viewport: CVPopoverViewport,
): boolean {
  return (
    position.left >= viewport.padding &&
    position.top >= viewport.padding &&
    position.left + panelRect.width <= viewport.width - viewport.padding &&
    position.top + panelRect.height <= viewport.height - viewport.padding
  )
}

function clampToViewport(
  position: CVPopoverResolvedPosition,
  panelRect: CVPopoverRect,
  viewport: CVPopoverViewport,
): CVPopoverResolvedPosition {
  const maxLeft = Math.max(viewport.padding, viewport.width - panelRect.width - viewport.padding)
  const maxTop = Math.max(viewport.padding, viewport.height - panelRect.height - viewport.padding)

  return {
    left: Math.min(Math.max(position.left, viewport.padding), maxLeft),
    top: Math.min(Math.max(position.top, viewport.padding), maxTop),
    placement: position.placement,
  }
}

function clampValue(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function getSideSpace(
  anchorRect: CVPopoverRect,
  placement: CVPopoverPlacement,
  offset: number,
  viewport: CVPopoverViewport,
): number {
  const {side} = parsePlacement(placement)

  switch (side) {
    case 'top':
      return Math.max(0, anchorRect.top - viewport.padding - offset)
    case 'right':
      return Math.max(0, viewport.width - anchorRect.right - viewport.padding - offset)
    case 'bottom':
      return Math.max(0, viewport.height - anchorRect.bottom - viewport.padding - offset)
    case 'left':
      return Math.max(0, anchorRect.left - viewport.padding - offset)
  }
}

function fitsPlacementAxis(
  position: CVPopoverResolvedPosition,
  panelRect: CVPopoverRect,
  viewport: CVPopoverViewport,
): boolean {
  const {side} = parsePlacement(position.placement)

  if (side === 'top' || side === 'bottom') {
    return (
      position.top >= viewport.padding &&
      position.top + panelRect.height <= viewport.height - viewport.padding
    )
  }

  return (
    position.left >= viewport.padding && position.left + panelRect.width <= viewport.width - viewport.padding
  )
}

export function supportsNativePopover(): boolean {
  return (
    typeof HTMLElement !== 'undefined' &&
    typeof HTMLElement.prototype.showPopover === 'function' &&
    typeof HTMLElement.prototype.hidePopover === 'function'
  )
}

export function supportsAnchorPositioning(): boolean {
  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') {
    return false
  }

  return (
    CSS.supports('anchor-name: --cv-popover-anchor') &&
    CSS.supports('position-anchor: --cv-popover-anchor') &&
    (CSS.supports('position-area: top left') || CSS.supports('position-area: top')) &&
    CSS.supports('top: anchor(bottom)')
  )
}

export function supportsAnchorTryFallbacks(): boolean {
  return (
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('position-try-fallbacks: flip-block')
  )
}

export function supportsNativeAnchoredAutoplacement(): boolean {
  return supportsNativePopover() && supportsAnchorPositioning() && supportsAnchorTryFallbacks()
}

export function isPopoverOpen(element: HTMLElement): boolean {
  try {
    return element.matches(':popover-open')
  } catch {
    return false
  }
}

export function toPopoverRect(rect: DOMRect): CVPopoverRect {
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
  }
}

export function clearPopoverLayout(element: HTMLElement, options: CVPopoverLayoutClearOptions = {}): void {
  element.style.position = ''
  element.style.top = ''
  element.style.left = ''
  element.style.right = ''
  element.style.bottom = ''
  element.style.inset = ''
  element.style.insetInlineStart = ''
  element.style.insetBlockStart = ''
  element.style.insetInlineEnd = ''
  element.style.insetBlockEnd = ''
  element.style.transform = ''
  element.style.translate = ''
  element.style.margin = ''
  element.style.marginTop = ''
  element.style.marginRight = ''
  element.style.marginBottom = ''
  element.style.marginLeft = ''
  element.style.removeProperty('position-area')
  element.style.removeProperty('position-try-fallbacks')

  for (const property of options.customProperties ?? []) {
    element.style.removeProperty(property)
  }
}

export function getPlacementFallbacks(placement: CVPopoverPlacement): CVPopoverPlacement[] {
  const {side, align} = parsePlacement(placement)
  const candidates = [
    placement,
    formatPlacement(mirrorSideMap[side], align),
    ...orthogonalSidesMap[side].map((nextSide) => formatPlacement(nextSide, align)),
  ]

  return Array.from(new Set(candidates))
}

export function getBlockPlacementFallbacks(placement: CVPopoverPlacement): CVPopoverPlacement[] {
  const {side, align} = parsePlacement(placement)
  return [placement, formatPlacement(mirrorSideMap[side], align)]
}

export function getPositionAreaForPlacement(placement: CVPopoverPlacement): string {
  const {side, align} = parsePlacement(placement)
  const row =
    side === 'top'
      ? 'top'
      : side === 'bottom'
        ? 'bottom'
        : align === 'start'
          ? 'top'
          : align === 'end'
            ? 'bottom'
            : 'center'
  const column =
    side === 'left'
      ? 'left'
      : side === 'right'
        ? 'right'
        : align === 'start'
          ? 'left'
          : align === 'end'
            ? 'right'
            : 'center'

  return `${row} ${column}`
}

export function resolvePopoverArrowOffset(
  anchorRect: CVPopoverRect,
  panelRect: CVPopoverRect,
  arrowSize: number,
  axis: CVPopoverArrowAxis,
  padding = 8,
): number {
  const anchorCenter =
    axis === 'inline' ? anchorRect.left + anchorRect.width / 2 : anchorRect.top + anchorRect.height / 2
  const panelStart = axis === 'inline' ? panelRect.left : panelRect.top
  const panelSize = axis === 'inline' ? panelRect.width : panelRect.height
  const arrowOffset = anchorCenter - panelStart - arrowSize / 2
  const maxOffset = Math.max(padding, panelSize - arrowSize - padding)

  return Math.round(clampValue(arrowOffset, padding, maxOffset))
}

export function resolvePopoverPosition(
  anchorRect: CVPopoverRect,
  panelRect: CVPopoverRect,
  placement: CVPopoverPlacement,
  offset: number,
  viewport: CVPopoverViewport,
): CVPopoverResolvedPosition {
  const candidates = getPlacementFallbacks(placement)

  for (const candidate of candidates) {
    const position = computeCoords(anchorRect, panelRect, candidate, offset)
    if (fitsViewport(position, panelRect, viewport)) {
      return position
    }
  }

  return clampToViewport(computeCoords(anchorRect, panelRect, placement, offset), panelRect, viewport)
}

export function resolvePopoverBlockPosition(
  anchorRect: CVPopoverRect,
  panelRect: CVPopoverRect,
  placement: CVPopoverPlacement,
  offset: number,
  viewport: CVPopoverViewport,
): CVPopoverResolvedPosition {
  const candidates = getBlockPlacementFallbacks(placement)

  for (const candidate of candidates) {
    const position = computeCoords(anchorRect, panelRect, candidate, offset)
    if (fitsPlacementAxis(position, panelRect, viewport)) {
      return clampToViewport(position, panelRect, viewport)
    }
  }

  const bestCandidate = candidates.reduce((best, candidate) => {
    const bestSpace = getSideSpace(anchorRect, best, offset, viewport)
    const candidateSpace = getSideSpace(anchorRect, candidate, offset, viewport)
    return candidateSpace > bestSpace ? candidate : best
  }, candidates[0]!)

  return clampToViewport(computeCoords(anchorRect, panelRect, bestCandidate, offset), panelRect, viewport)
}
