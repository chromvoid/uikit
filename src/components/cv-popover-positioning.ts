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

function parsePlacement(placement: CVPopoverPlacement): {side: PlacementSide; align: PlacementAlign} {
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

export function getPlacementFallbacks(placement: CVPopoverPlacement): CVPopoverPlacement[] {
  const {side, align} = parsePlacement(placement)
  const candidates = [
    placement,
    formatPlacement(mirrorSideMap[side], align),
    ...orthogonalSidesMap[side].map((nextSide) => formatPlacement(nextSide, align)),
  ]

  return Array.from(new Set(candidates))
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
