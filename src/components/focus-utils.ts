/**
 * Input `type`s that render an editable text field (and can therefore raise the
 * software keyboard). Non-text inputs (checkbox/radio/range/file/color/button…)
 * are deliberately excluded.
 */
const TEXT_EDITABLE_INPUT_TYPES = new Set([
  'text',
  'search',
  'url',
  'tel',
  'email',
  'password',
  'number',
  'date',
  'datetime-local',
  'month',
  'week',
  'time',
])

/**
 * True when the (shadow-piercing) active element is text-editable — i.e. the
 * software keyboard, if open, is attributable to a focused field.
 *
 * Only text-like, non-readonly, non-disabled inputs (and contenteditable
 * elements / textareas) count: a focused checkbox/radio/range/file input must
 * NOT be treated as an open IME, otherwise consumers (cv-input, cv-textarea,
 * cv-number) wrongly hijack pointerdown.
 */
export function hasTextEditableFocus(): boolean {
  if (typeof document === 'undefined') return false

  let active: Element | null = document.activeElement
  while (active instanceof HTMLElement && active.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement
  }

  if (!(active instanceof HTMLElement)) return false
  if (active.isContentEditable) return true

  if (active instanceof HTMLTextAreaElement) {
    return !active.readOnly && !active.disabled
  }

  if (active instanceof HTMLInputElement) {
    if (active.readOnly || active.disabled) return false
    // `type` is lowercased by the platform; unknown types fall back to 'text'.
    const type = active.type || 'text'
    return TEXT_EDITABLE_INPUT_TYPES.has(type)
  }

  return false
}
