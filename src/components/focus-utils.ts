/**
 * True when the (shadow-piercing) active element is text-editable — i.e. the
 * software keyboard, if open, is attributable to a focused field.
 */
export function hasTextEditableFocus(): boolean {
  if (typeof document === 'undefined') return false

  let active: Element | null = document.activeElement
  while (active instanceof HTMLElement && active.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement
  }

  if (!(active instanceof HTMLElement)) return false
  if (active.isContentEditable) return true
  return active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement
}
