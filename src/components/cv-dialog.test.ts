import {afterEach, describe, expect, it, vi} from 'vitest'

import {CVDialog} from './cv-dialog'
import {resetBodyScrollLockForTesting} from './scroll-lock'

CVDialog.define()

const settle = async (element: CVDialog) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
}

const createDialog = async (attrs?: Partial<CVDialog>) => {
  const el = document.createElement('cv-dialog') as CVDialog
  if (attrs) Object.assign(el, attrs)
  document.body.append(el)
  await settle(el)
  return el
}

const openDialog = async (el: CVDialog) => {
  el.open = true
  await settle(el)
}

const getContent = (el: CVDialog) => el.shadowRoot!.querySelector('[part="content"]') as HTMLElement
const getOverlay = (el: CVDialog) => el.shadowRoot!.querySelector('[part="overlay"]') as HTMLElement
const getModalShell = (el: CVDialog) =>
  el.shadowRoot!.querySelector('dialog.portal-shell') as HTMLDialogElement | null
const getPopoverShell = (el: CVDialog) => el.shadowRoot!.querySelector('.popover-shell') as HTMLElement | null
const getStylesText = () =>
  (CVDialog.styles as Array<{cssText?: string}>).map((style) => style.cssText ?? '').join('\n')

const setPresenceTransitionDuration = (el: CVDialog, duration: string) => {
  getOverlay(el).style.transitionDuration = duration
  getContent(el).style.transitionDuration = duration
}

const advancePresenceTimers = async (el: CVDialog, ms: number) => {
  vi.advanceTimersByTime(ms)
  await settle(el)
}

afterEach(() => {
  document.body.innerHTML = ''
  document.body.style.overflow = ''
  resetBodyScrollLockForTesting()
  vi.useRealTimers()
})

describe('cv-dialog', () => {
  describe('style contract', () => {
    it('keeps visual viewport keyboard inset in the dialog viewport bottom inset', () => {
      const stylesText = getStylesText()

      expect(stylesText).toMatch(
        /--cv-dialog-viewport-inset-bottom:\s*calc\([\s\S]*--visual-viewport-bottom-inset,\s*0px/,
      )
    })

    it('allows header, body, and footer grid items to shrink when content has long unbroken tokens', () => {
      const stylesText = getStylesText()

      expect(stylesText).toMatch(
        /\[part='header'\],\s*\[part='body'\],\s*\[part='footer'\]\s*\{\s*min-inline-size:\s*0;/,
      )
    })

    it('defines token-based dialog presence motion for shell, overlay, and content', () => {
      const stylesText = getStylesText()

      expect(stylesText).toContain('--cv-dialog-transition-duration: var(--cv-duration-fast, 120ms);')
      expect(stylesText).toContain('--cv-dialog-transition-easing-open: var(')
      expect(stylesText).toContain('--cv-dialog-transition-easing-close: var(')
      expect(stylesText).toContain('--cv-dialog-content-transition-property: opacity, transform;')
      expect(stylesText).toContain(
        '--cv-dialog-content-closed-transform: translate3d(0, 8px, 0) scale(0.98);',
      )
      expect(stylesText).toContain('--cv-dialog-content-open-transform: translate3d(0, 0, 0) scale(1);')
      expect(stylesText).toMatch(/\.portal-shell[\s\S]*transition:[\s\S]*display[\s\S]*allow-discrete/)
      expect(stylesText).toMatch(/\.portal-shell[\s\S]*transition:[\s\S]*overlay[\s\S]*allow-discrete/)
      expect(stylesText).toMatch(/\[part='overlay'\][\s\S]*transition:[\s\S]*display[\s\S]*allow-discrete/)
      expect(stylesText).toMatch(/transition-behavior:\s*allow-discrete/)
      expect(stylesText).toMatch(
        /\[part='overlay'\]::before[\s\S]*background:\s*var\(--cv-dialog-overlay-color/,
      )
      expect(stylesText).toMatch(/\[part='overlay'\]::before[\s\S]*transition:\s*opacity/)
      expect(stylesText).toMatch(
        /\[part='content'\][\s\S]*transition-property:\s*var\(--cv-dialog-content-transition-property/,
      )
      expect(stylesText).toMatch(
        /\[part='content'\]\[data-state='opening'\],\s*\[part='content'\]\[data-state='open'\]\s*\{[\s\S]*opacity:\s*1;[\s\S]*transform:\s*var\(--cv-dialog-content-open-transform\);/,
      )
      expect(stylesText).toMatch(
        /@starting-style[\s\S]*\[part='overlay'\]\[data-state='opening'\]::before,\s*\[part='overlay'\]\[data-state='open'\]::before/,
      )
      expect(stylesText).toMatch(
        /@starting-style[\s\S]*\[part='content'\]\[data-state='opening'\],\s*\[part='content'\]\[data-state='open'\]/,
      )
    })

    it('removes spatial dialog motion for reduced-motion users', () => {
      const stylesText = getStylesText()

      expect(stylesText).toMatch(
        /@media \(prefers-reduced-motion: reduce\)[\s\S]*--cv-dialog-transition-duration:\s*0ms;/,
      )
      expect(stylesText).toMatch(
        /@media \(prefers-reduced-motion: reduce\)[\s\S]*--cv-dialog-content-closed-transform:\s*none;/,
      )
      expect(stylesText).toMatch(
        /@media \(prefers-reduced-motion: reduce\)[\s\S]*--cv-dialog-content-open-transform:\s*none;/,
      )
    })
  })

  // --- Shadow DOM structure ---

  describe('shadow DOM structure', () => {
    it('does not render the removed built-in trigger API', async () => {
      const el = await createDialog()
      expect(el.shadowRoot!.querySelector('[part="trigger"]')).toBeNull()
      expect(el.shadowRoot!.querySelector('slot[name="trigger"]')).toBeNull()
    })

    it('renders [part="overlay"] as a <div>', async () => {
      const el = await createDialog()
      const overlay = el.shadowRoot!.querySelector('[part="overlay"]') as HTMLElement
      expect(overlay).not.toBeNull()
      expect(overlay.tagName).toBe('DIV')
    })

    it('renders modal dialogs through a native <dialog> top-layer shell', async () => {
      const el = await createDialog()
      const shell = getModalShell(el)

      expect(shell).not.toBeNull()
      expect(shell?.tagName).toBe('DIALOG')
    })

    it('renders non-modal dialogs through a popover shell', async () => {
      const el = await createDialog({modal: false})
      const shell = getPopoverShell(el)

      expect(shell).not.toBeNull()
      expect(shell?.getAttribute('popover')).toBe('manual')
    })

    it('renders [part="content"] as a <section> with role', async () => {
      const el = await createDialog()
      const content = getContent(el)
      expect(content).not.toBeNull()
      expect(content.tagName).toBe('SECTION')
      expect(content.getAttribute('role')).toBe('dialog')
    })

    it('renders [part="header"] as a <header>', async () => {
      const el = await createDialog()
      const header = el.shadowRoot!.querySelector('[part="header"]') as HTMLElement
      expect(header).not.toBeNull()
      expect(header.tagName).toBe('HEADER')
    })

    it('renders slot[name="before-header"] before the header', async () => {
      const el = await createDialog()
      const content = getContent(el)
      const beforeHeaderSlot = content.querySelector('slot[name="before-header"]')
      const header = content.querySelector('[part="header"]')

      expect(beforeHeaderSlot).not.toBeNull()
      expect(header).not.toBeNull()
      expect(
        beforeHeaderSlot!.compareDocumentPosition(header!) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    })

    it('renders [part="title"] as an <h2> with slot[name="title"]', async () => {
      const el = await createDialog()
      const title = el.shadowRoot!.querySelector('[part="title"]') as HTMLElement
      expect(title).not.toBeNull()
      expect(title.tagName).toBe('H2')
      const slot = title.querySelector('slot[name="title"]')
      expect(slot).not.toBeNull()
    })

    it('renders [part="description"] as a <p> with slot[name="description"]', async () => {
      const el = await createDialog()
      const desc = el.shadowRoot!.querySelector('[part="description"]') as HTMLElement
      expect(desc).not.toBeNull()
      expect(desc.tagName).toBe('P')
      const slot = desc.querySelector('slot[name="description"]')
      expect(slot).not.toBeNull()
    })

    it('renders [part="header-close"] as a <button> with slot[name="header-close"]', async () => {
      const el = await createDialog()
      const headerClose = el.shadowRoot!.querySelector('[part="header-close"]') as HTMLElement
      expect(headerClose).not.toBeNull()
      expect(headerClose.tagName).toBe('BUTTON')
      const slot = headerClose.querySelector('slot[name="header-close"]')
      expect(slot).not.toBeNull()
    })

    it('renders [part="body"] as a <div> with default slot', async () => {
      const el = await createDialog()
      const body = el.shadowRoot!.querySelector('[part="body"]') as HTMLElement
      expect(body).not.toBeNull()
      expect(body.tagName).toBe('DIV')
      const slot = body.querySelector('slot:not([name])')
      expect(slot).not.toBeNull()
    })

    it('renders [part="footer"] as a <footer> with slot[name="footer"]', async () => {
      const el = await createDialog()
      const footer = el.shadowRoot!.querySelector('[part="footer"]') as HTMLElement
      expect(footer).not.toBeNull()
      expect(footer.tagName).toBe('FOOTER')
      const slot = footer.querySelector('slot[name="footer"]')
      expect(slot).not.toBeNull()
    })
  })

  // --- Default property values ---

  describe('default property values', () => {
    it('has correct defaults', async () => {
      const el = await createDialog()
      expect(el.open).toBe(false)
      expect(el.modal).toBe(true)
      expect(el.type).toBe('dialog')
      expect(el.closeOnEscape).toBe(true)
      expect(el.closeOnOutsidePointer).toBe(true)
      expect(el.closeOnOutsideFocus).toBe(true)
      expect(el.noHeader).toBe(false)
    })
  })

  // --- Attribute reflection ---

  describe('attribute reflection', () => {
    it('boolean attributes reflect: open, modal', async () => {
      const el = await createDialog({open: true, modal: true})
      expect(el.hasAttribute('open')).toBe(true)
      expect(el.hasAttribute('modal')).toBe(true)
    })

    it('open attribute is absent when false', async () => {
      const el = await createDialog()
      expect(el.hasAttribute('open')).toBe(false)
    })

    it('type attribute reflects its value', async () => {
      const el = await createDialog({type: 'alertdialog'})
      expect(el.getAttribute('type')).toBe('alertdialog')
    })

    it('no-header attribute reflects when set', async () => {
      const el = await createDialog({noHeader: true})
      expect(el.hasAttribute('no-header')).toBe(true)
    })

    it('close-on-escape attribute reflects', async () => {
      const el = await createDialog()
      expect(el.hasAttribute('close-on-escape')).toBe(true)
    })
  })

  // --- Events ---

  describe('events', () => {
    it('input and change fire with {open: false} when closed', async () => {
      const el = await createDialog()
      await openDialog(el)

      const inputDetails: unknown[] = []
      const changeDetails: unknown[] = []

      el.addEventListener('cv-input', (e) => inputDetails.push((e as CustomEvent).detail))
      el.addEventListener('cv-change', (e) => changeDetails.push((e as CustomEvent).detail))

      // Close via Escape
      const content = getContent(el)
      content.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))
      await settle(el)

      expect(inputDetails).toEqual([{open: false}])
      expect(changeDetails).toEqual([{open: false}])
    })

    it('programmatic open attribute change does not emit input/change', async () => {
      const el = await createDialog()
      let inputCount = 0
      let changeCount = 0

      el.addEventListener('cv-input', () => inputCount++)
      el.addEventListener('cv-change', () => changeCount++)

      el.open = true
      await settle(el)

      expect(inputCount).toBe(0)
      expect(changeCount).toBe(0)
    })

    it('programmatic open and close fire lifecycle events', async () => {
      vi.useFakeTimers()
      const el = await createDialog()
      const events: string[] = []

      el.addEventListener('cv-show', () => events.push('show'))
      el.addEventListener('cv-after-show', () => events.push('after-show'))
      el.addEventListener('cv-hide', () => events.push('hide'))
      el.addEventListener('cv-after-hide', () => events.push('after-hide'))

      setPresenceTransitionDuration(el, '120ms')
      el.open = true
      await settle(el)
      expect(events).toEqual(['show'])

      await advancePresenceTimers(el, 119)
      expect(events).toEqual(['show'])

      await advancePresenceTimers(el, 1)
      expect(events).toEqual(['show', 'after-show'])

      el.open = false
      await settle(el)
      expect(events).toEqual(['show', 'after-show', 'hide'])

      await advancePresenceTimers(el, 120)
      expect(events).toEqual(['show', 'after-show', 'hide', 'after-hide'])
    })

    it('controlled open/close restores focus to the opener target', async () => {
      vi.useFakeTimers()
      const opener = document.createElement('button')
      opener.textContent = 'Open externally'
      document.body.append(opener)
      opener.focus()

      const el = await createDialog()
      setPresenceTransitionDuration(el, '120ms')
      el.open = true
      await settle(el)
      await advancePresenceTimers(el, 120)

      el.open = false
      await settle(el)

      expect(document.activeElement).not.toBe(opener)
      await advancePresenceTimers(el, 120)

      expect(document.activeElement).toBe(opener)
    })

    it('ignores a disconnected controlled focus restore target without throwing', async () => {
      vi.useFakeTimers()
      const opener = document.createElement('button')
      document.body.append(opener)
      opener.focus()

      const el = await createDialog()
      setPresenceTransitionDuration(el, '120ms')
      el.open = true
      await settle(el)
      await advancePresenceTimers(el, 120)

      opener.remove()

      expect(() => {
        el.open = false
      }).not.toThrow()
      await settle(el)
      await advancePresenceTimers(el, 120)
    })

    it('focuses the requested initial target through a slotted composition boundary', async () => {
      if (!customElements.get('cv-dialog-slotted-focus-fixture')) {
        customElements.define(
          'cv-dialog-slotted-focus-fixture',
          class extends HTMLElement {
            constructor() {
              super()
              this.attachShadow({mode: 'open'}).innerHTML = `
                <cv-dialog open initial-focus-id="target">
                  <slot></slot>
                </cv-dialog>
              `
            }
          },
        )
      }

      const fixture = document.createElement('cv-dialog-slotted-focus-fixture')
      const button = document.createElement('button')
      button.id = 'target'
      button.textContent = 'Initial target'
      fixture.append(button)
      document.body.append(fixture)

      const dialog = fixture.shadowRoot!.querySelector('cv-dialog') as CVDialog
      await settle(dialog)
      await Promise.resolve()

      expect(document.activeElement).toBe(button)
    })

    it('cv-show fires when dialog begins to open', async () => {
      const el = await createDialog()
      let fired = false

      el.addEventListener('cv-show', () => {
        fired = true
      })

      await openDialog(el)

      expect(fired).toBe(true)
    })

    it('cv-hide fires when dialog begins to close', async () => {
      const el = await createDialog({open: true})
      const content = getContent(el)
      let fired = false

      el.addEventListener('cv-hide', () => {
        fired = true
      })

      content.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))
      await settle(el)

      expect(fired).toBe(true)
    })

    it('cv-after-show fires after dialog open animation completes', async () => {
      vi.useFakeTimers()
      const el = await createDialog()
      let fired = false

      el.addEventListener('cv-after-show', () => {
        fired = true
      })

      setPresenceTransitionDuration(el, '120ms')
      await openDialog(el)

      expect(fired).toBe(false)

      await advancePresenceTimers(el, 119)
      expect(fired).toBe(false)

      await advancePresenceTimers(el, 1)
      expect(fired).toBe(true)
    })

    it('cv-after-hide fires after dialog close animation completes', async () => {
      vi.useFakeTimers()
      const el = await createDialog({open: true})
      setPresenceTransitionDuration(el, '120ms')
      const content = getContent(el)
      let fired = false

      el.addEventListener('cv-after-hide', () => {
        fired = true
      })

      content.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))
      await settle(el)

      expect(fired).toBe(false)

      await advancePresenceTimers(el, 119)
      expect(fired).toBe(false)

      await advancePresenceTimers(el, 1)
      expect(fired).toBe(true)
    })

    it('dispatches after lifecycle events immediately when transition duration is zero', async () => {
      vi.useFakeTimers()
      const el = await createDialog()
      const events: string[] = []

      el.addEventListener('cv-show', () => events.push('show'))
      el.addEventListener('cv-after-show', () => events.push('after-show'))
      el.addEventListener('cv-hide', () => events.push('hide'))
      el.addEventListener('cv-after-hide', () => events.push('after-hide'))

      setPresenceTransitionDuration(el, '0ms')
      el.open = true
      await settle(el)

      el.open = false
      await settle(el)

      expect(events).toEqual(['show', 'after-show', 'hide', 'after-hide'])
    })

    it('keeps user close input/change immediate while delaying after-hide', async () => {
      vi.useFakeTimers()
      const el = await createDialog({open: true})
      setPresenceTransitionDuration(el, '120ms')
      const events: string[] = []

      el.addEventListener('cv-hide', () => events.push('hide'))
      el.addEventListener('cv-input', (event) =>
        events.push(`input:${(event as CustomEvent<{open: boolean}>).detail.open}`),
      )
      el.addEventListener('cv-change', (event) =>
        events.push(`change:${(event as CustomEvent<{open: boolean}>).detail.open}`),
      )
      el.addEventListener('cv-after-hide', () => events.push('after-hide'))

      getContent(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))
      await settle(el)

      expect(events).toEqual(['hide', 'input:false', 'change:false'])

      await advancePresenceTimers(el, 120)

      expect(events).toEqual(['hide', 'input:false', 'change:false', 'after-hide'])
    })
  })

  // --- ARIA ---

  describe('ARIA', () => {
    it('content has role="dialog" by default', async () => {
      const el = await createDialog()
      const content = getContent(el)
      expect(content.getAttribute('role')).toBe('dialog')
    })

    it('content has aria-modal="true" for modal dialog', async () => {
      const el = await createDialog()
      const content = getContent(el)
      expect(content.getAttribute('aria-modal')).toBe('true')
    })

    it('content has aria-labelledby pointing to title id', async () => {
      const el = await createDialog()
      const content = getContent(el)
      const title = el.shadowRoot!.querySelector('[part="title"]') as HTMLElement
      const labelledby = content.getAttribute('aria-labelledby')
      expect(labelledby).toBe(title.id)
    })

    it('content has aria-describedby pointing to description id', async () => {
      const el = await createDialog()
      const content = getContent(el)
      const desc = el.shadowRoot!.querySelector('[part="description"]') as HTMLElement
      const describedby = content.getAttribute('aria-describedby')
      expect(describedby).toBe(desc.id)
    })

    it('header-close button has aria-label="Close"', async () => {
      const el = await createDialog()
      const headerClose = el.shadowRoot!.querySelector('[part="header-close"]') as HTMLElement
      expect(headerClose.getAttribute('aria-label')).toBe('Close')
    })
  })

  // --- Open and close behavior ---

  describe('open and close behavior', () => {
    it('controlled open property shows the dialog', async () => {
      const el = await createDialog()

      await openDialog(el)

      expect(el.open).toBe(true)
      const overlay = el.shadowRoot!.querySelector('[part="overlay"]') as HTMLElement
      expect(overlay.hidden).toBe(false)
    })

    it('header-close button click closes the dialog', async () => {
      const el = await createDialog({open: true})
      expect(el.open).toBe(true)

      const headerClose = el.shadowRoot!.querySelector('[part="header-close"]') as HTMLElement
      headerClose.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(el.open).toBe(false)
    })

    it('does not render a header-close button when closable is false', async () => {
      const el = await createDialog({closable: false})
      const headerClose = el.shadowRoot!.querySelector('[part="header-close"]')

      expect(headerClose).toBeNull()
    })

    it('Escape key closes the dialog', async () => {
      const el = await createDialog({open: true})
      expect(el.open).toBe(true)

      const content = getContent(el)
      content.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))
      await settle(el)

      expect(el.open).toBe(false)
    })

    it('overlay click closes the dialog', async () => {
      const el = await createDialog({open: true})
      expect(el.open).toBe(true)

      const overlay = el.shadowRoot!.querySelector('[part="overlay"]') as HTMLElement
      overlay.dispatchEvent(new MouseEvent('mousedown', {bubbles: true}))
      overlay.dispatchEvent(new MouseEvent('click', {bubbles: true}))
      await settle(el)

      expect(el.open).toBe(false)
    })
  })

  // --- alertdialog type ---

  describe('alertdialog type', () => {
    it('content has role="alertdialog" when type="alertdialog"', async () => {
      const el = await createDialog({type: 'alertdialog'})
      const content = getContent(el)
      expect(content.getAttribute('role')).toBe('alertdialog')
    })

    it('content has role="dialog" when type="dialog"', async () => {
      const el = await createDialog({type: 'dialog'})
      const content = getContent(el)
      expect(content.getAttribute('role')).toBe('dialog')
    })

    it('content has role="dialog" by default (no type set)', async () => {
      const el = await createDialog()
      const content = getContent(el)
      expect(content.getAttribute('role')).toBe('dialog')
    })
  })

  // --- Non-modal mode ---

  describe('non-modal mode', () => {
    it('aria-modal is "false" when modal=false', async () => {
      const el = await createDialog({modal: false})
      const content = getContent(el)
      expect(content.getAttribute('aria-modal')).toBe('false')
    })

    it('does not lock body scroll when modal=false and dialog is open', async () => {
      await createDialog({modal: false, open: true})

      expect(document.body.style.overflow).not.toBe('hidden')
    })

    it('aria-modal is "true" when modal=true (default)', async () => {
      const el = await createDialog()
      const content = getContent(el)
      expect(content.getAttribute('aria-modal')).toBe('true')
    })
  })

  // --- No-header mode ---

  describe('no-header mode', () => {
    it('header is hidden when no-header is set', async () => {
      const el = await createDialog({noHeader: true})
      const header = el.shadowRoot!.querySelector('[part="header"]') as HTMLElement
      // Header should be hidden (either not rendered or display: none)
      const isHidden = header === null || header.hidden || getComputedStyle(header).display === 'none'
      expect(isHidden).toBe(true)
    })

    it('header is visible by default', async () => {
      const el = await createDialog()
      const header = el.shadowRoot!.querySelector('[part="header"]') as HTMLElement
      expect(header).not.toBeNull()
    })
  })

  // --- Keyboard interaction ---

  describe('keyboard interaction', () => {
    it('Escape closes dialog when closeOnEscape=true (default)', async () => {
      const el = await createDialog({open: true})
      expect(el.open).toBe(true)

      const content = getContent(el)
      content.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))
      await settle(el)

      expect(el.open).toBe(false)
    })

    it('Escape does not close dialog when closeOnEscape=false', async () => {
      const el = await createDialog({closeOnEscape: false, open: true})
      expect(el.open).toBe(true)

      const content = getContent(el)
      content.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))
      await settle(el)

      expect(el.open).toBe(true)
    })

    it('does not preventDefault Escape when closeOnEscape=false', async () => {
      const el = await createDialog({closeOnEscape: false, open: true})
      const content = getContent(el)

      const event = new KeyboardEvent('keydown', {key: 'Escape', bubbles: true, cancelable: true})
      content.dispatchEvent(event)
      await settle(el)

      expect(event.defaultPrevented).toBe(false)
      expect(el.open).toBe(true)
    })

    it('ignores Escape already handled by a nested widget (defaultPrevented)', async () => {
      const el = await createDialog({open: true})
      const content = getContent(el)

      const event = new KeyboardEvent('keydown', {key: 'Escape', bubbles: true, cancelable: true})
      event.preventDefault()
      content.dispatchEvent(event)
      await settle(el)

      expect(el.open).toBe(true)
    })
  })

  describe('overlay interaction guards', () => {
    it('does not close when mousedown originates inside the content', async () => {
      const el = await createDialog({open: true})

      getContent(el).dispatchEvent(new MouseEvent('mousedown', {bubbles: true}))
      await settle(el)

      expect(el.open).toBe(true)
    })

    it('does not close when a drag starts inside the content and is released over the overlay', async () => {
      const el = await createDialog({open: true})

      // Pointer sequence begins inside the content (e.g. text selection)...
      getContent(el).dispatchEvent(new MouseEvent('mousedown', {bubbles: true}))
      // ...and the click is reported on the overlay because the pointer was
      // dragged out and released over the backdrop.
      getOverlay(el).dispatchEvent(new MouseEvent('click', {bubbles: true}))
      await settle(el)

      expect(el.open).toBe(true)
    })

    it('closes only when the pointer sequence both starts and ends on the overlay', async () => {
      const el = await createDialog({open: true})

      getOverlay(el).dispatchEvent(new MouseEvent('mousedown', {bubbles: true}))
      getOverlay(el).dispatchEvent(new MouseEvent('click', {bubbles: true}))
      await settle(el)

      expect(el.open).toBe(false)
    })

    it('does not close on overlay mousedown when closeOnOutsidePointer=false', async () => {
      const el = await createDialog({closeOnOutsidePointer: false, open: true})

      getOverlay(el).dispatchEvent(new MouseEvent('mousedown', {bubbles: true}))
      getOverlay(el).dispatchEvent(new MouseEvent('click', {bubbles: true}))
      await settle(el)

      expect(el.open).toBe(true)
    })
  })

  describe('nested dialogs', () => {
    it('does not dismiss an open dialog when focus moves into a stacked dialog', async () => {
      const first = await createDialog({open: true})
      const second = await createDialog({open: true})

      // Simulate focus entering the second (stacked) dialog's content.
      const secondContent = getContent(second)
      const focusEvent = new FocusEvent('focusin', {bubbles: true, composed: true})
      Object.defineProperty(focusEvent, 'composedPath', {
        value: () => [secondContent, getOverlay(second), second, document.body, document],
      })
      document.dispatchEvent(focusEvent)
      await settle(first)
      await settle(second)

      expect(first.open).toBe(true)
      expect(second.open).toBe(true)
    })

    it('still dismisses on genuine outside focus to an unrelated element', async () => {
      const el = await createDialog({open: true})
      const outside = document.createElement('button')
      document.body.append(outside)

      const focusEvent = new FocusEvent('focusin', {bubbles: true, composed: true})
      Object.defineProperty(focusEvent, 'composedPath', {
        value: () => [outside, document.body, document],
      })
      document.dispatchEvent(focusEvent)
      await settle(el)

      expect(el.open).toBe(false)
    })
  })

  describe('native cancel handling', () => {
    it('closes on native dialog cancel and prevents the default close', async () => {
      const el = await createDialog({open: true})
      const shell = getModalShell(el)!

      const event = new Event('cancel', {cancelable: true})
      shell.dispatchEvent(event)
      await settle(el)

      expect(el.open).toBe(false)
      expect(event.defaultPrevented).toBe(true)
    })

    it('does not close on native cancel when closeOnEscape=false', async () => {
      const el = await createDialog({closeOnEscape: false, open: true})
      const shell = getModalShell(el)!

      shell.dispatchEvent(new Event('cancel', {cancelable: true}))
      await settle(el)

      expect(el.open).toBe(true)
    })
  })

  describe('open/close racing', () => {
    it('collapses an open immediately followed by close into a no-op', async () => {
      const el = await createDialog()
      const events: string[] = []

      el.addEventListener('cv-show', () => events.push('show'))
      el.addEventListener('cv-hide', () => events.push('hide'))
      el.addEventListener('cv-after-show', () => events.push('after-show'))
      el.addEventListener('cv-after-hide', () => events.push('after-hide'))

      el.open = true
      el.open = false
      await settle(el)

      expect(el.open).toBe(false)
      expect(getOverlay(el).hidden).toBe(true)
      expect(events).toEqual([])
    })
  })

  describe('initial focus fallback', () => {
    it('keeps default initial focus behavior for a requested text target', async () => {
      const el = await createDialog()
      const input = document.createElement('input')
      input.id = 'target'
      el.initialFocusId = 'target'
      el.append(input)

      await openDialog(el)
      await Promise.resolve()

      expect(document.activeElement).toBe(input)
    })

    it('skips a requested text target when initial text focus is prevented', async () => {
      const el = await createDialog({preventInitialTextFocus: true})
      const input = document.createElement('input')
      input.id = 'target'
      el.initialFocusId = 'target'
      el.append(input)

      await openDialog(el)
      await Promise.resolve()

      expect(document.activeElement).not.toBe(input)
      expect(el.shadowRoot!.activeElement).toBe(getContent(el))
    })

    it('still focuses a requested button target when initial text focus is prevented', async () => {
      const el = await createDialog({preventInitialTextFocus: true})
      const button = document.createElement('button')
      button.id = 'target'
      button.textContent = 'Continue'
      el.initialFocusId = 'target'
      el.append(button)

      await openDialog(el)
      await Promise.resolve()

      expect(document.activeElement).toBe(button)
    })

    it('focuses the dialog content when no initial-focus-id is set', async () => {
      const el = await createDialog()

      el.open = true
      await settle(el)
      await Promise.resolve()

      expect(el.shadowRoot!.activeElement).toBe(getContent(el))
    })
  })

  // --- Headless contract delegation ---

  describe('headless contract delegation', () => {
    it('content ARIA attributes come from headless getContentProps()', async () => {
      const el = await createDialog()
      const content = getContent(el)
      // Verify content has id, role, tabindex, aria-modal, aria-labelledby
      expect(content.id).toBeTruthy()
      expect(content.getAttribute('role')).toBe('dialog')
      expect(content.getAttribute('tabindex')).toBeDefined()
      expect(content.getAttribute('aria-modal')).toBeDefined()
      expect(content.getAttribute('aria-labelledby')).toBeTruthy()
    })

    it('title id comes from headless getTitleProps()', async () => {
      const el = await createDialog()
      const title = el.shadowRoot!.querySelector('[part="title"]') as HTMLElement
      expect(title.id).toBeTruthy()
    })

    it('description id comes from headless getDescriptionProps()', async () => {
      const el = await createDialog()
      const desc = el.shadowRoot!.querySelector('[part="description"]') as HTMLElement
      expect(desc.id).toBeTruthy()
    })

    it('header-close props come from headless getHeaderCloseButtonProps()', async () => {
      const el = await createDialog()
      const headerClose = el.shadowRoot!.querySelector('[part="header-close"]') as HTMLElement
      expect(headerClose.id).toBeTruthy()
      expect(headerClose.getAttribute('role')).toBe('button')
      expect(headerClose.getAttribute('tabindex')).toBe('0')
      expect(headerClose.getAttribute('aria-label')).toBe('Close')
    })

    it('overlay hidden attribute reflects headless getOverlayProps().hidden', async () => {
      const el = await createDialog()
      const overlay = getOverlay(el)
      expect(overlay.hidden).toBe(true)

      await openDialog(el)

      expect(overlay.hidden).toBe(false)
    })

    it('keeps the overlay present during the close presence transition', async () => {
      vi.useFakeTimers()
      const el = await createDialog({open: true})
      const overlay = getOverlay(el)
      const shell = getModalShell(el)

      setPresenceTransitionDuration(el, '120ms')
      expect(shell?.hidden).toBe(false)
      expect(overlay.hidden).toBe(false)

      el.open = false
      await settle(el)

      expect(shell?.hidden).toBe(false)
      expect(overlay.hidden).toBe(false)
      expect(shell?.dataset['state']).toBe('closing')
      expect(overlay.dataset['state']).toBe('closing')
      expect(getContent(el).dataset['state']).toBe('closing')

      await advancePresenceTimers(el, 120)

      expect(shell?.hidden).toBe(true)
      expect(overlay.hidden).toBe(true)
      expect(shell?.dataset['state']).toBe('closed')
      expect(overlay.dataset['state']).toBe('closed')
      expect(getContent(el).dataset['state']).toBe('closed')
    })

    it('aria-labelledby on content matches title id', async () => {
      const el = await createDialog()
      const content = getContent(el)
      const title = el.shadowRoot!.querySelector('[part="title"]') as HTMLElement
      expect(content.getAttribute('aria-labelledby')).toBe(title.id)
    })

    it('aria-describedby on content matches description id', async () => {
      const el = await createDialog()
      const content = getContent(el)
      const desc = el.shadowRoot!.querySelector('[part="description"]') as HTMLElement
      expect(content.getAttribute('aria-describedby')).toBe(desc.id)
    })
  })

  // --- Scroll lock ---

  describe('scroll lock', () => {
    it('body overflow is hidden when modal dialog is open', async () => {
      await createDialog({open: true})

      expect(document.body.style.overflow).toBe('hidden')
    })

    it('body overflow is restored when modal dialog is closed', async () => {
      vi.useFakeTimers()
      const el = await createDialog({open: true})
      setPresenceTransitionDuration(el, '120ms')
      expect(document.body.style.overflow).toBe('hidden')

      const content = getContent(el)
      content.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))
      await settle(el)

      expect(document.body.style.overflow).toBe('hidden')
      await advancePresenceTimers(el, 120)

      expect(document.body.style.overflow).toBe('')
    })

    it('body overflow is NOT set to hidden for non-modal dialog', async () => {
      await createDialog({modal: false, open: true})

      expect(document.body.style.overflow).not.toBe('hidden')
    })

    it('body overflow is restored when modal dialog element is disconnected', async () => {
      const el = await createDialog({open: true})
      expect(document.body.style.overflow).toBe('hidden')

      el.remove()
      expect(document.body.style.overflow).toBe('')
    })

    it('keeps body scroll locked while a second modal dialog is still open', async () => {
      const first = await createDialog({open: true})
      const second = await createDialog({open: true})

      expect(document.body.style.overflow).toBe('hidden')

      // Closing the topmost overlay must not unlock scrolling under the first.
      second.open = false
      await settle(second)
      expect(document.body.style.overflow).toBe('hidden')

      // Body overflow only restores once the last lock releases.
      first.open = false
      await settle(first)
      expect(document.body.style.overflow).toBe('')
    })
  })

  describe('scroll guard', () => {
    it('prevents wheel scrolling on the modal overlay background', async () => {
      const el = await createDialog({open: true})
      const overlay = el.shadowRoot!.querySelector('[part="overlay"]') as HTMLElement
      const event = new WheelEvent('wheel', {bubbles: true, cancelable: true, deltaY: 48})

      overlay.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(true)
    })

    it('allows wheel scrolling inside dialog content when content can still scroll', async () => {
      const el = await createDialog({open: true})
      const content = getContent(el)
      content.style.overflowY = 'auto'
      Object.defineProperty(content, 'scrollHeight', {configurable: true, value: 400})
      Object.defineProperty(content, 'clientHeight', {configurable: true, value: 100})
      Object.defineProperty(content, 'scrollTop', {
        configurable: true,
        value: 20,
        writable: true,
      })

      const event = new WheelEvent('wheel', {bubbles: true, cancelable: true, deltaY: 48})
      content.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(false)
    })

    it('allows wheel scrolling inside a shadow-dom descendant when it can still scroll', async () => {
      const el = await createDialog({open: true})
      const host = document.createElement('div')
      const shadowRoot = host.attachShadow({mode: 'open'})
      const scroller = document.createElement('div')

      scroller.style.overflowY = 'auto'
      shadowRoot.append(scroller)
      el.append(host)
      await settle(el)

      Object.defineProperty(scroller, 'scrollHeight', {configurable: true, value: 400})
      Object.defineProperty(scroller, 'clientHeight', {configurable: true, value: 100})
      Object.defineProperty(scroller, 'scrollTop', {
        configurable: true,
        value: 20,
        writable: true,
      })

      const event = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        composed: true,
        deltaY: 48,
      })
      scroller.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(false)
    })

    it('prevents wheel scroll chaining when content is already at the end', async () => {
      const el = await createDialog({open: true})
      const content = getContent(el)
      content.style.overflowY = 'auto'
      Object.defineProperty(content, 'scrollHeight', {configurable: true, value: 400})
      Object.defineProperty(content, 'clientHeight', {configurable: true, value: 100})
      Object.defineProperty(content, 'scrollTop', {
        configurable: true,
        value: 300,
        writable: true,
      })

      const event = new WheelEvent('wheel', {bubbles: true, cancelable: true, deltaY: 48})
      content.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(true)
    })

    it('prevents touchmove scrolling on the modal overlay background', async () => {
      const el = await createDialog({open: true})
      const overlay = el.shadowRoot!.querySelector('[part="overlay"]') as HTMLElement
      const touchStartEvent = new Event('touchstart', {
        bubbles: true,
        cancelable: true,
      }) as TouchEvent
      const touchMoveEvent = new Event('touchmove', {
        bubbles: true,
        cancelable: true,
      }) as TouchEvent

      Object.defineProperty(touchStartEvent, 'touches', {
        configurable: true,
        value: [{clientY: 100}],
      })
      Object.defineProperty(touchStartEvent, 'changedTouches', {
        configurable: true,
        value: [{clientY: 100}],
      })
      Object.defineProperty(touchMoveEvent, 'touches', {
        configurable: true,
        value: [{clientY: 40}],
      })
      Object.defineProperty(touchMoveEvent, 'changedTouches', {
        configurable: true,
        value: [{clientY: 40}],
      })

      overlay.dispatchEvent(touchStartEvent)
      overlay.dispatchEvent(touchMoveEvent)

      expect(touchMoveEvent.defaultPrevented).toBe(true)
    })
  })
})
