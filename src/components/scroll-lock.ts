/**
 * Reentrant body scroll lock shared across overlay components (dialog, drawer,
 * alert-dialog, sidebar). Multiple overlays can be open at once; the underlying
 * `document.body` overflow is only mutated when the active-lock count crosses
 * 0↔1, so closing one overlay never unlocks scrolling while another is still
 * open, and the original overflow is restored only once the last lock releases.
 *
 * Each caller must pair exactly one {@link acquireBodyScrollLock} with one
 * {@link releaseBodyScrollLock}; callers already guard this with a per-instance
 * `lockScrollApplied` flag.
 */

let activeLockCount = 0
let savedOverflow = ''

export function acquireBodyScrollLock(): void {
  if (activeLockCount === 0) {
    savedOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }

  activeLockCount += 1
}

export function releaseBodyScrollLock(): void {
  if (activeLockCount === 0) return

  activeLockCount -= 1

  if (activeLockCount === 0) {
    document.body.style.overflow = savedOverflow
  }
}

/** Test-only escape hatch to reset the shared lock state between cases. */
export function resetBodyScrollLockForTesting(): void {
  activeLockCount = 0
  savedOverflow = ''
}
