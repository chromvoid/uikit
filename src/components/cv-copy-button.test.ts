import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {CVCopyButton} from './cv-copy-button'

CVCopyButton.define()

type ClipboardStub = {
  writeText: (value: string) => Promise<void>
}

type AsyncCopyValue = () => Promise<string>

type TestableCopyButton = CVCopyButton & {
  _clipboard?: ClipboardStub
  value: CVCopyButton['value'] | AsyncCopyValue
}

const settle = async (element: CVCopyButton) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
}

const createCopyButton = async (attrs?: Partial<TestableCopyButton>) => {
  const el = document.createElement('cv-copy-button') as CVCopyButton
  if (attrs) Object.assign(el, attrs)
  document.body.append(el)
  await settle(el)
  return el
}

const getBase = (el: CVCopyButton) => el.shadowRoot!.querySelector('[part="base"]') as HTMLElement
const setClipboard = (el: CVCopyButton, clipboard: ClipboardStub) => {
  ;(el as TestableCopyButton)._clipboard = clipboard
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// Shadow DOM structure
// ---------------------------------------------------------------------------
describe('cv-copy-button', () => {
  describe('shadow DOM structure', () => {
    it('renders [part="base"] as a div', async () => {
      const el = await createCopyButton()
      const base = getBase(el)
      expect(base).not.toBeNull()
      expect(base.tagName.toLowerCase()).toBe('div')
    })

    it('renders [part="copy-icon"] as a span', async () => {
      const el = await createCopyButton()
      const part = el.shadowRoot!.querySelector('[part="copy-icon"]')
      expect(part).not.toBeNull()
      expect(part!.tagName.toLowerCase()).toBe('span')
    })

    it('renders [part="copy-icon"] containing slot[name="copy-icon"]', async () => {
      const el = await createCopyButton()
      const part = el.shadowRoot!.querySelector('[part="copy-icon"]')
      const slot = part!.querySelector('slot[name="copy-icon"]')
      expect(slot).not.toBeNull()
    })

    it('renders [part="success-icon"] as a span', async () => {
      const el = await createCopyButton()
      const part = el.shadowRoot!.querySelector('[part="success-icon"]')
      expect(part).not.toBeNull()
      expect(part!.tagName.toLowerCase()).toBe('span')
    })

    it('renders [part="success-icon"] containing slot[name="success-icon"]', async () => {
      const el = await createCopyButton()
      const part = el.shadowRoot!.querySelector('[part="success-icon"]')
      const slot = part!.querySelector('slot[name="success-icon"]')
      expect(slot).not.toBeNull()
    })

    it('renders [part="error-icon"] as a span', async () => {
      const el = await createCopyButton()
      const part = el.shadowRoot!.querySelector('[part="error-icon"]')
      expect(part).not.toBeNull()
      expect(part!.tagName.toLowerCase()).toBe('span')
    })

    it('renders [part="error-icon"] containing slot[name="error-icon"]', async () => {
      const el = await createCopyButton()
      const part = el.shadowRoot!.querySelector('[part="error-icon"]')
      const slot = part!.querySelector('slot[name="error-icon"]')
      expect(slot).not.toBeNull()
    })

    it('renders [part="status"] as a span', async () => {
      const el = await createCopyButton()
      const part = el.shadowRoot!.querySelector('[part="status"]')
      expect(part).not.toBeNull()
      expect(part!.tagName.toLowerCase()).toBe('span')
    })
  })

  // ---------------------------------------------------------------------------
  // Default property values
  // ---------------------------------------------------------------------------
  describe('default property values', () => {
    it('has correct defaults', async () => {
      const el = await createCopyButton()
      expect(el.value).toBe('')
      expect(el.clipboard).toBeUndefined()
      expect(el.disabled).toBe(false)
      expect(el.feedbackDuration).toBe(1500)
      expect(el.size).toBe('medium')
      expect(el.appearance).toBe('default')
      expect(el.successLabel).toBe('Copied')
      expect(el.errorLabel).toBe('Copy failed')
    })
  })

  // ---------------------------------------------------------------------------
  // Attribute reflection
  // ---------------------------------------------------------------------------
  describe('attribute reflection', () => {
    it('disabled boolean attribute reflects to DOM', async () => {
      const el = await createCopyButton({disabled: true})
      expect(el.hasAttribute('disabled')).toBe(true)
    })

    it('disabled false removes attribute', async () => {
      const el = await createCopyButton({disabled: false})
      expect(el.hasAttribute('disabled')).toBe(false)
    })

    it('size string attribute reflects to DOM', async () => {
      const el = await createCopyButton({size: 'large'} as Partial<CVCopyButton>)
      expect(el.getAttribute('size')).toBe('large')
    })

    it('appearance string attribute reflects to DOM', async () => {
      const el = await createCopyButton({appearance: 'plain'} as Partial<CVCopyButton>)
      expect(el.getAttribute('appearance')).toBe('plain')
    })

    it('feedback-duration numeric attribute reflects to DOM', async () => {
      const el = await createCopyButton({feedbackDuration: 3000})
      expect(el.getAttribute('feedback-duration')).toBe('3000')
    })

    it('status attribute reflects current state on host', async () => {
      const el = await createCopyButton()
      expect(el.getAttribute('status')).toBe('idle')
    })

    it('value property does NOT reflect as attribute (security)', async () => {
      const el = await createCopyButton({value: 'secret'})
      expect(el.hasAttribute('value')).toBe(false)
    })

    it('clipboard property does NOT reflect as attribute', async () => {
      const el = await createCopyButton({clipboard: {writeText: vi.fn().mockResolvedValue(undefined)}})
      expect(el.hasAttribute('clipboard')).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------
  describe('events', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('cv-copy fires with {value} detail on successful copy', async () => {
      const clip = {writeText: vi.fn().mockResolvedValue(undefined)}
      const el = await createCopyButton({value: 'hello'})
      // Inject mock clipboard — the component should pass it to createCopyButton
      setClipboard(el, clip)

      let detail: unknown
      el.addEventListener('cv-copy', ((e: CustomEvent) => {
        detail = e.detail
      }) as EventListener)

      getBase(el).click()
      await settle(el)
      // Allow the async copy to complete
      await vi.advanceTimersByTimeAsync(0)
      await settle(el)

      expect(detail).toEqual({value: 'hello'})
    })

    it('cv-error fires with {error} detail on clipboard failure', async () => {
      const error = new Error('denied')
      const clip = {writeText: vi.fn().mockRejectedValue(error)}
      const el = await createCopyButton({value: 'test'})
      setClipboard(el, clip)

      let detail: unknown
      el.addEventListener('cv-error', ((e: CustomEvent) => {
        detail = e.detail
      }) as EventListener)

      getBase(el).click()
      await settle(el)
      await vi.advanceTimersByTimeAsync(0)
      await settle(el)

      expect(detail).toEqual({error})
    })

    it('uses public clipboard property for copying', async () => {
      const clip = {writeText: vi.fn().mockResolvedValue(undefined)}
      const el = await createCopyButton({value: 'public-clipboard', clipboard: clip})

      getBase(el).click()
      await settle(el)
      await vi.advanceTimersByTimeAsync(0)
      await settle(el)

      expect(clip.writeText).toHaveBeenCalledWith('public-clipboard')
      expect(el.getAttribute('status')).toBe('success')
    })
  })

  // ---------------------------------------------------------------------------
  // ARIA
  // ---------------------------------------------------------------------------
  describe('ARIA', () => {
    it('role="button" on base', async () => {
      const el = await createCopyButton()
      expect(getBase(el).getAttribute('role')).toBe('button')
    })

    it('tabindex="0" when enabled', async () => {
      const el = await createCopyButton()
      expect(getBase(el).getAttribute('tabindex')).toBe('0')
    })

    it('tabindex="-1" when disabled', async () => {
      const el = await createCopyButton({disabled: true})
      expect(getBase(el).getAttribute('tabindex')).toBe('-1')
    })

    it('aria-disabled="true" when disabled', async () => {
      const el = await createCopyButton({disabled: true})
      expect(getBase(el).getAttribute('aria-disabled')).toBe('true')
    })

    it('aria-disabled="false" when enabled', async () => {
      const el = await createCopyButton()
      expect(getBase(el).getAttribute('aria-disabled')).toBe('false')
    })

    it('uses aria-label while idle and localized status labels after copy', async () => {
      vi.useFakeTimers()
      const el = await createCopyButton({
        value: 'localized',
        clipboard: {writeText: vi.fn().mockResolvedValue(undefined)},
        ariaLabel: 'Copy secret',
        successLabel: 'Copied locally',
        errorLabel: 'Copy rejected',
      })
      expect(getBase(el).getAttribute('aria-label')).toBe('Copy secret')

      getBase(el).click()
      await vi.advanceTimersByTimeAsync(0)
      await settle(el)

      expect(getBase(el).getAttribute('aria-label')).toBe('Copied locally')
      expect(el.shadowRoot!.querySelector('[part="status"]')!.textContent).toBe('Copied locally')
      vi.useRealTimers()
    })

    it('uses localized error label after failed copy', async () => {
      vi.useFakeTimers()
      const el = await createCopyButton({
        value: 'localized',
        clipboard: {writeText: vi.fn().mockRejectedValue(new Error('denied'))},
        ariaLabel: 'Copy secret',
        successLabel: 'Copied locally',
        errorLabel: 'Copy rejected',
      })

      getBase(el).click()
      await vi.advanceTimersByTimeAsync(0)
      await settle(el)

      expect(getBase(el).getAttribute('aria-label')).toBe('Copy rejected')
      expect(el.shadowRoot!.querySelector('[part="status"]')!.textContent).toBe('Copy rejected')
      vi.useRealTimers()
    })

    it('status region has role="status"', async () => {
      const el = await createCopyButton()
      const status = el.shadowRoot!.querySelector('[part="status"]')!
      expect(status.getAttribute('role')).toBe('status')
    })

    it('status region has aria-live="polite"', async () => {
      const el = await createCopyButton()
      const status = el.shadowRoot!.querySelector('[part="status"]')!
      expect(status.getAttribute('aria-live')).toBe('polite')
    })

    it('status region has aria-atomic="true"', async () => {
      const el = await createCopyButton()
      const status = el.shadowRoot!.querySelector('[part="status"]')!
      expect(status.getAttribute('aria-atomic')).toBe('true')
    })
  })

  // ---------------------------------------------------------------------------
  // Visual states
  // ---------------------------------------------------------------------------
  describe('visual states', () => {
    it('status attribute on host is "idle" by default', async () => {
      const el = await createCopyButton()
      expect(el.getAttribute('status')).toBe('idle')
    })

    it('status attribute on host reflects "success" after copy', async () => {
      vi.useFakeTimers()
      const clip = {writeText: vi.fn().mockResolvedValue(undefined)}
      const el = await createCopyButton({value: 'test'})
      setClipboard(el, clip)

      getBase(el).click()
      await vi.advanceTimersByTimeAsync(0)
      await settle(el)

      expect(el.getAttribute('status')).toBe('success')
      vi.useRealTimers()
    })

    it('status attribute on host reflects "error" after failed copy', async () => {
      vi.useFakeTimers()
      const clip = {writeText: vi.fn().mockRejectedValue(new Error('fail'))}
      const el = await createCopyButton({value: 'test'})
      setClipboard(el, clip)

      getBase(el).click()
      await vi.advanceTimersByTimeAsync(0)
      await settle(el)

      expect(el.getAttribute('status')).toBe('error')
      vi.useRealTimers()
    })

    it('uses tokenized icon swap motion with reduced-motion coverage', () => {
      const cssText = CVCopyButton.styles.map((style) => style.cssText ?? '').join('\n')

      expect(cssText).toContain(":host([status='idle']) [part='copy-icon']")
      expect(cssText).toContain(":host([status='success']) [part='success-icon']")
      expect(cssText).toContain(":host([status='error']) [part='error-icon']")
      expect(cssText).toContain('opacity var(--cv-duration-fast')
      expect(cssText).toContain('transform var(--cv-duration-fast')
      expect(cssText).toContain('@media (prefers-reduced-motion: reduce)')
      expect(cssText).not.toContain('transition: all')
      expect(cssText).not.toContain('filter var(--cv-duration-fast')
      expect(cssText).not.toContain('filter: blur')
      expect(cssText).not.toContain('display: none')
    })

    it('copying attribute is set while async copy is in-flight', async () => {
      let resolveClip!: () => void
      const clip = {
        writeText: vi.fn().mockImplementation(
          () =>
            new Promise<void>((resolve) => {
              resolveClip = resolve
            }),
        ),
      }
      const el = await createCopyButton({value: 'test'})
      setClipboard(el, clip)

      getBase(el).click()
      await settle(el)
      // While in-flight, copying attribute should be present
      expect(el.hasAttribute('copying')).toBe(true)

      resolveClip()
      await settle(el)
    })
  })

  // ---------------------------------------------------------------------------
  // Copy behavior
  // ---------------------------------------------------------------------------
  describe('copy behavior', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('click on base triggers copy', async () => {
      const clip = {writeText: vi.fn().mockResolvedValue(undefined)}
      const el = await createCopyButton({value: 'click-test'})
      setClipboard(el, clip)

      getBase(el).click()
      await vi.advanceTimersByTimeAsync(0)
      await settle(el)

      expect(clip.writeText).toHaveBeenCalledWith('click-test')
    })

    it('Enter keydown triggers copy', async () => {
      const clip = {writeText: vi.fn().mockResolvedValue(undefined)}
      const el = await createCopyButton({value: 'enter-test'})
      setClipboard(el, clip)

      getBase(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}))
      await vi.advanceTimersByTimeAsync(0)
      await settle(el)

      expect(clip.writeText).toHaveBeenCalledWith('enter-test')
    })

    it('Space keyup triggers copy (keydown alone does not)', async () => {
      const clip = {writeText: vi.fn().mockResolvedValue(undefined)}
      const el = await createCopyButton({value: 'space-test'})
      setClipboard(el, clip)

      // keydown should NOT trigger copy
      getBase(el).dispatchEvent(new KeyboardEvent('keydown', {key: ' ', bubbles: true}))
      await vi.advanceTimersByTimeAsync(0)
      expect(clip.writeText).not.toHaveBeenCalled()

      // keyup should trigger copy
      getBase(el).dispatchEvent(new KeyboardEvent('keyup', {key: ' ', bubbles: true}))
      await vi.advanceTimersByTimeAsync(0)
      await settle(el)

      expect(clip.writeText).toHaveBeenCalledWith('space-test')
    })

    it('async value is resolved before writing to clipboard', async () => {
      const clip = {writeText: vi.fn().mockResolvedValue(undefined)}
      const asyncGetter = async () => 'async-resolved-value'
      const el = await createCopyButton({value: asyncGetter})
      setClipboard(el, clip)

      getBase(el).click()
      await vi.advanceTimersByTimeAsync(0)
      await settle(el)

      expect(clip.writeText).toHaveBeenCalledWith('async-resolved-value')
    })

    it('disabled blocks copy', async () => {
      const clip = {writeText: vi.fn().mockResolvedValue(undefined)}
      const el = await createCopyButton({value: 'blocked', disabled: true})
      setClipboard(el, clip)

      getBase(el).click()
      await vi.advanceTimersByTimeAsync(0)
      await settle(el)

      expect(clip.writeText).not.toHaveBeenCalled()
      expect(el.getAttribute('status')).toBe('idle')
    })

    it('disabled blocks Enter key copy', async () => {
      const clip = {writeText: vi.fn().mockResolvedValue(undefined)}
      const el = await createCopyButton({value: 'blocked', disabled: true})
      setClipboard(el, clip)

      getBase(el).dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}))
      await vi.advanceTimersByTimeAsync(0)
      await settle(el)

      expect(clip.writeText).not.toHaveBeenCalled()
    })

    it('disabled blocks Space key copy', async () => {
      const clip = {writeText: vi.fn().mockResolvedValue(undefined)}
      const el = await createCopyButton({value: 'blocked', disabled: true})
      setClipboard(el, clip)

      getBase(el).dispatchEvent(new KeyboardEvent('keydown', {key: ' ', bubbles: true}))
      getBase(el).dispatchEvent(new KeyboardEvent('keyup', {key: ' ', bubbles: true}))
      await vi.advanceTimersByTimeAsync(0)
      await settle(el)

      expect(clip.writeText).not.toHaveBeenCalled()
    })

    it('success reverts to idle after feedbackDuration', async () => {
      const clip = {writeText: vi.fn().mockResolvedValue(undefined)}
      const el = await createCopyButton({value: 'test', feedbackDuration: 2000})
      setClipboard(el, clip)

      getBase(el).click()
      await vi.advanceTimersByTimeAsync(0)
      await settle(el)
      expect(el.getAttribute('status')).toBe('success')

      vi.advanceTimersByTime(1999)
      await settle(el)
      expect(el.getAttribute('status')).toBe('success')

      vi.advanceTimersByTime(1)
      await settle(el)
      expect(el.getAttribute('status')).toBe('idle')
    })

    it('falls back to the error state when no clipboard adapter is available', async () => {
      // jsdom has no navigator.clipboard, and no adapter is injected here.
      const el = await createCopyButton({value: 'no-clipboard'})
      let errorCount = 0

      el.addEventListener('cv-error', () => {
        errorCount += 1
      })

      getBase(el).click()
      await vi.advanceTimersByTimeAsync(0)
      await settle(el)

      expect(el.getAttribute('status')).toBe('error')
      expect(errorCount).toBe(1)
    })

    it('reports error when the async value getter rejects', async () => {
      const clip = {writeText: vi.fn().mockResolvedValue(undefined)}
      const el = await createCopyButton({value: () => Promise.reject(new Error('boom'))})
      setClipboard(el, clip)

      let detail: unknown
      el.addEventListener('cv-error', ((e: CustomEvent) => {
        detail = e.detail
      }) as EventListener)

      getBase(el).click()
      await vi.advanceTimersByTimeAsync(0)
      await settle(el)

      expect(clip.writeText).not.toHaveBeenCalled()
      expect(el.getAttribute('status')).toBe('error')
      expect(detail).toEqual({error: new Error('boom')})
    })

    it('resets the feedback timer on a rapid second copy', async () => {
      const clip = {writeText: vi.fn().mockResolvedValue(undefined)}
      const el = await createCopyButton({value: 'test'})
      setClipboard(el, clip)

      getBase(el).click()
      await vi.advanceTimersByTimeAsync(0)
      await settle(el)
      expect(el.getAttribute('status')).toBe('success')

      await vi.advanceTimersByTimeAsync(1000)
      getBase(el).click()
      await vi.advanceTimersByTimeAsync(0)
      await settle(el)

      // 1400ms after the second copy; the first copy's timer would have fired by now.
      await vi.advanceTimersByTimeAsync(1400)
      await settle(el)
      expect(el.getAttribute('status')).toBe('success')

      await vi.advanceTimersByTimeAsync(100)
      await settle(el)
      expect(el.getAttribute('status')).toBe('idle')
    })

    it('ignores additional clicks while a copy is in flight', async () => {
      let resolveClip!: () => void
      const clip = {
        writeText: vi.fn().mockImplementation(
          () =>
            new Promise<void>((resolve) => {
              resolveClip = resolve
            }),
        ),
      }
      const el = await createCopyButton({value: 'in-flight'})
      setClipboard(el, clip)

      getBase(el).click()
      await settle(el)
      getBase(el).click()
      await settle(el)

      expect(clip.writeText).toHaveBeenCalledTimes(1)

      resolveClip()
      await settle(el)
    })

    it('error reverts to idle after feedbackDuration', async () => {
      const clip = {writeText: vi.fn().mockRejectedValue(new Error('fail'))}
      const el = await createCopyButton({value: 'test', feedbackDuration: 1000})
      setClipboard(el, clip)

      getBase(el).click()
      await vi.advanceTimersByTimeAsync(0)
      await settle(el)
      expect(el.getAttribute('status')).toBe('error')

      vi.advanceTimersByTime(1000)
      await settle(el)
      expect(el.getAttribute('status')).toBe('idle')
    })
  })

  // ---------------------------------------------------------------------------
  // Headless contract delegation
  // ---------------------------------------------------------------------------
  describe('headless contract delegation', () => {
    it('base element role comes from getButtonProps()', async () => {
      const el = await createCopyButton()
      const base = getBase(el)
      // role="button" is provided by the headless contracts.getButtonProps()
      expect(base.getAttribute('role')).toBe('button')
    })

    it('base element aria-disabled comes from getButtonProps()', async () => {
      const el = await createCopyButton({disabled: true})
      const base = getBase(el)
      expect(base.getAttribute('aria-disabled')).toBe('true')
    })

    it('base element tabindex comes from getButtonProps()', async () => {
      const el = await createCopyButton()
      const base = getBase(el)
      expect(base.getAttribute('tabindex')).toBe('0')
    })

    it('status element attributes come from getStatusProps()', async () => {
      const el = await createCopyButton()
      const status = el.shadowRoot!.querySelector('[part="status"]')!
      expect(status.getAttribute('role')).toBe('status')
      expect(status.getAttribute('aria-live')).toBe('polite')
      expect(status.getAttribute('aria-atomic')).toBe('true')
    })

    it('icon containers have aria-hidden="true" from getIconContainerProps()', async () => {
      const el = await createCopyButton()
      const copyIcon = el.shadowRoot!.querySelector('[part="copy-icon"]')!
      const successIcon = el.shadowRoot!.querySelector('[part="success-icon"]')!
      const errorIcon = el.shadowRoot!.querySelector('[part="error-icon"]')!
      expect(copyIcon.getAttribute('aria-hidden')).toBe('true')
      expect(successIcon.getAttribute('aria-hidden')).toBe('true')
      expect(errorIcon.getAttribute('aria-hidden')).toBe('true')
    })

    it('keeps all icon parts mounted while idle state is driven by host status CSS', async () => {
      const el = await createCopyButton()
      const copyIcon = el.shadowRoot!.querySelector('[part="copy-icon"]') as HTMLElement
      const successIcon = el.shadowRoot!.querySelector('[part="success-icon"]') as HTMLElement
      const errorIcon = el.shadowRoot!.querySelector('[part="error-icon"]') as HTMLElement

      expect(el.getAttribute('status')).toBe('idle')
      expect(copyIcon.hidden).toBe(false)
      expect(successIcon.hidden).toBe(false)
      expect(errorIcon.hidden).toBe(false)
    })

    it('keeps all icon parts mounted in success state', async () => {
      vi.useFakeTimers()
      const clip = {writeText: vi.fn().mockResolvedValue(undefined)}
      const el = await createCopyButton({value: 'test'})
      setClipboard(el, clip)

      getBase(el).click()
      await vi.advanceTimersByTimeAsync(0)
      await settle(el)

      const copyIcon = el.shadowRoot!.querySelector('[part="copy-icon"]') as HTMLElement
      const successIcon = el.shadowRoot!.querySelector('[part="success-icon"]') as HTMLElement
      const errorIcon = el.shadowRoot!.querySelector('[part="error-icon"]') as HTMLElement

      expect(el.getAttribute('status')).toBe('success')
      expect(copyIcon.hidden).toBe(false)
      expect(successIcon.hidden).toBe(false)
      expect(errorIcon.hidden).toBe(false)
      vi.useRealTimers()
    })

    it('keeps all icon parts mounted in error state', async () => {
      vi.useFakeTimers()
      const clip = {writeText: vi.fn().mockRejectedValue(new Error('fail'))}
      const el = await createCopyButton({value: 'test'})
      setClipboard(el, clip)

      getBase(el).click()
      await vi.advanceTimersByTimeAsync(0)
      await settle(el)

      const copyIcon = el.shadowRoot!.querySelector('[part="copy-icon"]') as HTMLElement
      const successIcon = el.shadowRoot!.querySelector('[part="success-icon"]') as HTMLElement
      const errorIcon = el.shadowRoot!.querySelector('[part="error-icon"]') as HTMLElement

      expect(el.getAttribute('status')).toBe('error')
      expect(copyIcon.hidden).toBe(false)
      expect(successIcon.hidden).toBe(false)
      expect(errorIcon.hidden).toBe(false)
      vi.useRealTimers()
    })
  })

  // ---------------------------------------------------------------------------
  // Sizes
  // ---------------------------------------------------------------------------
  describe('sizes', () => {
    it('size defaults to "medium"', async () => {
      const el = await createCopyButton()
      expect(el.size).toBe('medium')
    })

    it('size="small" reflects on host attribute', async () => {
      const el = await createCopyButton({size: 'small'} as Partial<CVCopyButton>)
      expect(el.getAttribute('size')).toBe('small')
    })

    it('size="medium" reflects on host attribute', async () => {
      const el = await createCopyButton({size: 'medium'} as Partial<CVCopyButton>)
      expect(el.getAttribute('size')).toBe('medium')
    })

    it('size="large" reflects on host attribute', async () => {
      const el = await createCopyButton({size: 'large'} as Partial<CVCopyButton>)
      expect(el.getAttribute('size')).toBe('large')
    })
  })

  // ---------------------------------------------------------------------------
  // Dynamic state updates
  // ---------------------------------------------------------------------------
  describe('dynamic state updates', () => {
    it('changing disabled at runtime syncs aria-disabled', async () => {
      const el = await createCopyButton()
      expect(getBase(el).getAttribute('aria-disabled')).toBe('false')

      el.disabled = true
      await settle(el)
      expect(getBase(el).getAttribute('aria-disabled')).toBe('true')

      el.disabled = false
      await settle(el)
      expect(getBase(el).getAttribute('aria-disabled')).toBe('false')
    })

    it('changing disabled at runtime syncs tabindex', async () => {
      const el = await createCopyButton()
      expect(getBase(el).getAttribute('tabindex')).toBe('0')

      el.disabled = true
      await settle(el)
      expect(getBase(el).getAttribute('tabindex')).toBe('-1')

      el.disabled = false
      await settle(el)
      expect(getBase(el).getAttribute('tabindex')).toBe('0')
    })

    it('changing feedbackDuration at runtime updates the model', async () => {
      const el = await createCopyButton()
      expect(el.feedbackDuration).toBe(1500)

      el.feedbackDuration = 3000
      await settle(el)
      expect(el.feedbackDuration).toBe(3000)
    })
  })

  // ---------------------------------------------------------------------------
  // Feedback lifecycle robustness
  // ---------------------------------------------------------------------------
  describe('feedback lifecycle', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('cancels the pending revert timer on disconnect', async () => {
      const clip = {writeText: vi.fn().mockResolvedValue(undefined)}
      const el = await createCopyButton({value: 'hello', feedbackDuration: 1500, clipboard: clip})

      getBase(el).click()
      await settle(el)
      await vi.advanceTimersByTimeAsync(0)
      await settle(el)
      expect(el.getAttribute('status')).toBe('success')

      // Remove the button while the revert timer is still pending.
      el.remove()

      // Advancing past the feedback duration must not throw or fire late work;
      // disconnect should have reset the model and cleared the timer.
      expect(() => vi.advanceTimersByTime(2000)).not.toThrow()
      expect(vi.getTimerCount()).toBe(0)
    })

    it('does not tear down the model while success feedback is on screen', async () => {
      const clip = {writeText: vi.fn().mockResolvedValue(undefined)}
      const el = await createCopyButton({value: 'hello', feedbackDuration: 1500, clipboard: clip})

      const errors: unknown[] = []
      el.addEventListener('cv-error', ((e: CustomEvent) => {
        errors.push(e.detail)
      }) as EventListener)

      getBase(el).click()
      await settle(el)
      await vi.advanceTimersByTimeAsync(0)
      await settle(el)
      expect(el.getAttribute('status')).toBe('success')

      // A cosmetic setter change during feedback must not reset visible success
      // back to idle or orphan the revert timer.
      el.successLabel = 'Copied to clipboard'
      el.ariaLabel = 'Copy value'
      await settle(el)

      expect(el.getAttribute('status')).toBe('success')

      // The original revert timer still fires and returns to idle exactly once.
      await vi.advanceTimersByTimeAsync(1500)
      await settle(el)
      expect(el.getAttribute('status')).toBe('idle')
      expect(errors).toEqual([])
    })

    it('applies setter changes when the model is idle', async () => {
      const el = await createCopyButton()
      el.successLabel = 'Done'
      await settle(el)
      expect(el.successLabel).toBe('Done')
    })
  })
})
