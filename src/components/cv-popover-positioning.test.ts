import {describe, expect, it} from 'vitest'

import {
  getPlacementFallbacks,
  getPositionAreaForPlacement,
  resolvePopoverPosition,
} from './cv-popover-positioning'

const anchorRect = {
  left: 100,
  top: 120,
  right: 180,
  bottom: 164,
  width: 80,
  height: 44,
}

const panelRect = {
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
  width: 140,
  height: 72,
}

describe('cv-popover positioning helpers', () => {
  it('maps placement to position-area syntax', () => {
    expect(getPositionAreaForPlacement('top-start')).toBe('top left')
    expect(getPositionAreaForPlacement('bottom')).toBe('bottom center')
    expect(getPositionAreaForPlacement('right-end')).toBe('bottom right')
    expect(getPositionAreaForPlacement('left')).toBe('center left')
  })

  it('prefers mirrored and orthogonal fallbacks after the requested placement', () => {
    expect(getPlacementFallbacks('right-end')).toEqual(['right-end', 'left-end', 'bottom-end', 'top-end'])
    expect(getPlacementFallbacks('top')).toEqual(['top', 'bottom', 'right', 'left'])
  })

  it('keeps right-end placement when it fits the viewport', () => {
    const resolved = resolvePopoverPosition(anchorRect, panelRect, 'right-end', 8, {
      width: 800,
      height: 600,
      padding: 8,
    })

    expect(resolved.placement).toBe('right-end')
    expect(resolved.left).toBe(188)
    expect(resolved.top).toBe(92)
  })

  it('falls back to left-end when right-end would overflow', () => {
    const resolved = resolvePopoverPosition(
      {
        ...anchorRect,
        left: 720,
        right: 780,
      },
      panelRect,
      'right-end',
      8,
      {
        width: 800,
        height: 600,
        padding: 8,
      },
    )

    expect(resolved.placement).toBe('left-end')
    expect(resolved.left).toBe(572)
  })

  it('falls back from bottom-end to top-end when there is no space below', () => {
    const resolved = resolvePopoverPosition(
      {
        ...anchorRect,
        top: 540,
        bottom: 584,
      },
      panelRect,
      'bottom-end',
      8,
      {
        width: 800,
        height: 600,
        padding: 8,
      },
    )

    expect(resolved.placement).toBe('top-end')
    expect(resolved.top).toBe(460)
  })

  it('maps side-only and start/end side placements to position-area syntax', () => {
    expect(getPositionAreaForPlacement('left-start')).toBe('top left')
    expect(getPositionAreaForPlacement('left-end')).toBe('bottom left')
    expect(getPositionAreaForPlacement('right-start')).toBe('top right')
    expect(getPositionAreaForPlacement('top-end')).toBe('top right')
    expect(getPositionAreaForPlacement('top')).toBe('top center')
  })

  it('returns center-aligned fallbacks for side-only left placement', () => {
    expect(getPlacementFallbacks('left')).toEqual(['left', 'right', 'bottom', 'top'])
  })

  it('centers vertically for side placements', () => {
    const resolved = resolvePopoverPosition(
      {
        ...anchorRect,
        left: 400,
        right: 480,
      },
      panelRect,
      'left',
      8,
      {
        width: 800,
        height: 600,
        padding: 8,
      },
    )

    expect(resolved.placement).toBe('left')
    expect(resolved.left).toBe(252)
    // anchor top 120 + (44 - 72) / 2 = 106
    expect(resolved.top).toBe(106)
  })

  it('produces finite integer coordinates for a zero-size anchor', () => {
    const resolved = resolvePopoverPosition(
      {
        left: 100,
        top: 100,
        right: 100,
        bottom: 100,
        width: 0,
        height: 0,
      },
      panelRect,
      'bottom',
      8,
      {
        width: 800,
        height: 600,
        padding: 8,
      },
    )

    expect(Number.isFinite(resolved.left)).toBe(true)
    expect(Number.isFinite(resolved.top)).toBe(true)
    expect(resolved.left).toBe(30)
    expect(resolved.top).toBe(108)
  })

  it('rounds fractional anchor coordinates to integers', () => {
    const resolved = resolvePopoverPosition(
      {
        left: 100.4,
        top: 120.6,
        right: 180.4,
        bottom: 164.6,
        width: 80,
        height: 44,
      },
      panelRect,
      'bottom-start',
      8,
      {
        width: 800,
        height: 600,
        padding: 8,
      },
    )

    expect(Number.isInteger(resolved.left)).toBe(true)
    expect(Number.isInteger(resolved.top)).toBe(true)
    expect(resolved.left).toBe(100)
    expect(resolved.top).toBe(173)
  })

  it('clamps the preferred placement into the viewport when nothing fully fits', () => {
    const resolved = resolvePopoverPosition(
      {
        left: 8,
        top: 8,
        right: 48,
        bottom: 48,
        width: 40,
        height: 40,
      },
      {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        width: 280,
        height: 220,
      },
      'top-start',
      8,
      {
        width: 240,
        height: 180,
        padding: 8,
      },
    )

    expect(resolved.placement).toBe('top-start')
    expect(resolved.left).toBe(8)
    expect(resolved.top).toBe(8)
  })
})
