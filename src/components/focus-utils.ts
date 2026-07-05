/**
 * Input `type`s that render an editable text field (and can therefore raise the
 * software keyboard). Non-text inputs (checkbox/radio/range/file/color/button…)
 * are deliberately excluded.
 */
const TEXT_EDITABLE_INPUT_TYPES: ReadonlySet<string> = new Set([
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

const TEXT_EDITABLE_HOST_TAGS: ReadonlySet<string> = new Set([
  'cv-input',
  'cv-number',
  'cv-textarea',
  'cv-combobox',
])

function isDisabledOrReadonly(element: HTMLElement): boolean {
  const formLikeElement = element as HTMLElement & {
    disabled?: boolean
    readonly?: boolean
    readOnly?: boolean
  }

  return (
    formLikeElement.disabled === true ||
    formLikeElement.readonly === true ||
    formLikeElement.readOnly === true ||
    element.matches('[disabled], [readonly], [aria-disabled="true"]')
  )
}

function isContentEditableTarget(element: HTMLElement): boolean {
  const contentEditable = element.getAttribute('contenteditable')
  return element.isContentEditable || contentEditable === 'true' || contentEditable === ''
}

export function isTextEditableFocusTarget(element: HTMLElement): boolean {
  if (isDisabledOrReadonly(element)) return false
  if (isContentEditableTarget(element)) return true
  if (TEXT_EDITABLE_HOST_TAGS.has(element.localName)) return true

  if (element instanceof HTMLTextAreaElement) {
    return true
  }

  if (element instanceof HTMLInputElement) {
    const type = element.type || 'text'
    return TEXT_EDITABLE_INPUT_TYPES.has(type)
  }

  return false
}

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
  return isTextEditableFocusTarget(active)
}
