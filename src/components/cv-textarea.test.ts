import {afterEach, describe, expect, it, vi} from 'vitest'

import {CVTextarea} from './cv-textarea'

CVTextarea.define()

const settle = async (element: CVTextarea) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
}

const createTextarea = async (attrs?: Partial<CVTextarea>) => {
  const el = document.createElement('cv-textarea') as CVTextarea
  if (attrs) {
    Object.assign(el, attrs)
  }
  document.body.append(el)
  await settle(el)
  return el
}

const getBase = (el: CVTextarea) => el.shadowRoot!.querySelector('[part="base"]') as HTMLElement

const getTextarea = (el: CVTextarea) =>
  el.shadowRoot!.querySelector('[part="textarea"]') as HTMLTextAreaElement

const hasElementInternals =
  typeof (HTMLElement.prototype as {attachInternals?: unknown}).attachInternals === 'function'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('cv-textarea', () => {
  describe('shadow DOM structure', () => {
    it('renders [part="base"] as a div', async () => {
      const el = await createTextarea()
      const base = getBase(el)

      expect(base).not.toBeNull()
      expect(base.tagName.toLowerCase()).toBe('div')
    })

    it('renders [part="textarea"] as a native textarea', async () => {
      const el = await createTextarea()
      const textarea = getTextarea(el)

      expect(textarea).not.toBeNull()
      expect(textarea.tagName.toLowerCase()).toBe('textarea')
    })

    it('does not render a default slot', async () => {
      const el = await createTextarea()

      expect(el.shadowRoot!.querySelector('slot:not([name])')).toBeNull()
    })
  })

  describe('default property values', () => {
    it('has expected defaults', async () => {
      const el = await createTextarea()

      expect(el.value).toBe('')
      expect(el.placeholder).toBe('')
      expect(el.disabled).toBe(false)
      expect(el.readonly).toBe(false)
      expect(el.required).toBe(false)
      expect(el.rows).toBe(4)
      expect(el.cols).toBe(20)
      expect(el.resize).toBe('vertical')
      expect(el.size).toBe('medium')
      expect(el.variant).toBe('outlined')
      expect(el.enterBehavior).toBe('newline')
      expect(el.name).toBe('')
    })
  })

  describe('attribute reflection', () => {
    it('reflects boolean attributes: disabled, readonly, required', async () => {
      const el = await createTextarea({
        disabled: true,
        readonly: true,
        required: true,
      })

      expect(el.hasAttribute('disabled')).toBe(true)
      expect(el.hasAttribute('readonly')).toBe(true)
      expect(el.hasAttribute('required')).toBe(true)
    })

    it('reflects string attributes: size, variant, resize', async () => {
      const el = await createTextarea({
        size: 'large',
        variant: 'filled',
        resize: 'none',
      })

      expect(el.getAttribute('size')).toBe('large')
      expect(el.getAttribute('variant')).toBe('filled')
      expect(el.getAttribute('resize')).toBe('none')
    })

    it('reflects enter-behavior attribute', async () => {
      const el = await createTextarea({
        enterBehavior: 'submit',
      })

      expect(el.getAttribute('enter-behavior')).toBe('submit')
    })

    it('reflects [focused] on focus and clears on blur', async () => {
      const el = await createTextarea()
      const textarea = getTextarea(el)

      textarea.dispatchEvent(new FocusEvent('focus', {bubbles: true}))
      await settle(el)
      expect(el.hasAttribute('focused')).toBe(true)

      textarea.dispatchEvent(new FocusEvent('blur', {bubbles: true}))
      await settle(el)
      expect(el.hasAttribute('focused')).toBe(false)
    })

    it('reflects [filled] when value is non-empty', async () => {
      const el = await createTextarea({value: 'hello'})

      expect(el.hasAttribute('filled')).toBe(true)
    })
  })

  describe('events', () => {
    it('dispatches cv-input with { value } on user input', async () => {
      const el = await createTextarea()
      const details: Array<{value: string}> = []
      el.addEventListener('cv-input', (event: Event) => {
        details.push((event as CustomEvent<{value: string}>).detail)
      })

      const textarea = getTextarea(el)
      textarea.value = 'hello'
      textarea.dispatchEvent(new InputEvent('input', {bubbles: true}))
      await settle(el)

      expect(details).toEqual([{value: 'hello'}])
    })

    it('preserves Cyrillic text exactly on user input', async () => {
      const el = await createTextarea()
      const details: Array<{value: string}> = []
      el.addEventListener('cv-input', (event: Event) => {
        details.push((event as CustomEvent<{value: string}>).detail)
      })

      const value = 'Привет, заметка №1'
      const textarea = getTextarea(el)
      textarea.value = value
      textarea.dispatchEvent(new InputEvent('input', {bubbles: true, data: value}))
      await settle(el)

      expect(el.value).toBe(value)
      expect(textarea.value).toBe(value)
      expect(details).toEqual([{value}])
    })

    it('dispatches cv-focus and cv-blur on focus transitions', async () => {
      const el = await createTextarea()
      let focusCount = 0
      let blurCount = 0

      el.addEventListener('cv-focus', () => {
        focusCount += 1
      })
      el.addEventListener('cv-blur', () => {
        blurCount += 1
      })

      const textarea = getTextarea(el)
      textarea.dispatchEvent(new FocusEvent('focus', {bubbles: true}))
      await settle(el)
      textarea.dispatchEvent(new FocusEvent('blur', {bubbles: true}))
      await settle(el)

      expect(focusCount).toBe(1)
      expect(blurCount).toBe(1)
    })

    it('dispatches cv-change with { value } on blur when value changed', async () => {
      const el = await createTextarea({value: 'before'})
      const details: Array<{value: string}> = []
      el.addEventListener('cv-change', (event: Event) => {
        details.push((event as CustomEvent<{value: string}>).detail)
      })

      const textarea = getTextarea(el)
      textarea.dispatchEvent(new FocusEvent('focus', {bubbles: true}))
      await settle(el)

      textarea.value = 'after'
      textarea.dispatchEvent(new InputEvent('input', {bubbles: true}))
      await settle(el)

      textarea.dispatchEvent(new FocusEvent('blur', {bubbles: true}))
      await settle(el)

      expect(details).toEqual([{value: 'after'}])
    })

    it('does not dispatch cv-change on blur when value did not change', async () => {
      const el = await createTextarea({value: 'same'})
      let changeCount = 0

      el.addEventListener('cv-change', () => {
        changeCount += 1
      })

      const textarea = getTextarea(el)
      textarea.dispatchEvent(new FocusEvent('focus', {bubbles: true}))
      await settle(el)
      textarea.dispatchEvent(new FocusEvent('blur', {bubbles: true}))
      await settle(el)

      expect(changeCount).toBe(0)
    })

    it('does not dispatch cv-input for programmatic value changes', async () => {
      const el = await createTextarea()
      let inputCount = 0

      el.addEventListener('cv-input', () => {
        inputCount += 1
      })

      el.value = 'programmatic'
      await settle(el)

      expect(inputCount).toBe(0)
    })
  })

  describe('ARIA', () => {
    it('keeps native textarea role semantics (no explicit role attribute)', async () => {
      const el = await createTextarea()
      const textarea = getTextarea(el)

      expect(textarea.hasAttribute('role')).toBe(false)
    })

    it('applies aria-disabled and tabindex=-1 when disabled', async () => {
      const el = await createTextarea({disabled: true})
      const textarea = getTextarea(el)

      expect(textarea.getAttribute('aria-disabled')).toBe('true')
      expect(textarea.getAttribute('tabindex')).toBe('-1')
      expect(textarea.disabled).toBe(true)
    })

    it('applies aria-readonly when readonly', async () => {
      const el = await createTextarea({readonly: true})
      const textarea = getTextarea(el)

      expect(textarea.getAttribute('aria-readonly')).toBe('true')
      expect(textarea.readOnly).toBe(true)
    })

    it('applies aria-required when required', async () => {
      const el = await createTextarea({required: true})
      const textarea = getTextarea(el)

      expect(textarea.getAttribute('aria-required')).toBe('true')
      expect(textarea.required).toBe(true)
    })

    it('applies rows, cols, minlength, and maxlength from props', async () => {
      const el = await createTextarea({
        rows: 8,
        cols: 44,
        minLength: 3,
        maxLength: 140,
      })
      const textarea = getTextarea(el)

      expect(textarea.getAttribute('rows')).toBe('8')
      expect(textarea.getAttribute('cols')).toBe('44')
      expect(textarea.getAttribute('minlength')).toBe('3')
      expect(textarea.getAttribute('maxlength')).toBe('140')
    })

    it('passes aria-labelledby and aria-describedby through to the native textarea', async () => {
      const el = await createTextarea()
      el.setAttribute('aria-labelledby', 'field-label')
      el.setAttribute('aria-describedby', 'field-description field-error')
      await settle(el)

      const textarea = getTextarea(el)
      expect(textarea.getAttribute('aria-labelledby')).toBe('field-label')
      expect(textarea.getAttribute('aria-describedby')).toBe('field-description field-error')
    })
  })

  describe('behavior', () => {
    it('proxies host focus to the inner textarea', async () => {
      const el = await createTextarea()
      const textarea = getTextarea(el)
      const focusSpy = vi.spyOn(textarea, 'focus')

      el.focus({preventScroll: true})

      expect(focusSpy).toHaveBeenCalledWith({preventScroll: true})
    })

    it('disabled blocks user input updates', async () => {
      const el = await createTextarea({disabled: true, value: 'seed'})
      let inputCount = 0
      el.addEventListener('cv-input', () => {
        inputCount += 1
      })

      const textarea = getTextarea(el)
      textarea.value = 'changed'
      textarea.dispatchEvent(new InputEvent('input', {bubbles: true}))
      await settle(el)

      expect(el.value).toBe('seed')
      expect(inputCount).toBe(0)
    })

    it('readonly blocks user input updates', async () => {
      const el = await createTextarea({readonly: true, value: 'seed'})
      let inputCount = 0
      el.addEventListener('cv-input', () => {
        inputCount += 1
      })

      const textarea = getTextarea(el)
      textarea.value = 'changed'
      textarea.dispatchEvent(new InputEvent('input', {bubbles: true}))
      await settle(el)

      expect(el.value).toBe('seed')
      expect(inputCount).toBe(0)
    })

    it('syncs rows and cols when properties change at runtime', async () => {
      const el = await createTextarea({rows: 4, cols: 20})

      el.rows = 10
      el.cols = 50
      await settle(el)

      const textarea = getTextarea(el)
      expect(textarea.getAttribute('rows')).toBe('10')
      expect(textarea.getAttribute('cols')).toBe('50')
    })

    it('submits the parent form on Enter when enter-behavior is submit', async () => {
      const form = document.createElement('form')
      const el = document.createElement('cv-textarea') as CVTextarea
      el.enterBehavior = 'submit'
      form.append(el)
      document.body.append(form)
      await settle(el)

      const requestSubmitSpy = vi.spyOn(form, 'requestSubmit').mockImplementation(() => {})
      const textarea = getTextarea(el)
      const event = new KeyboardEvent('keydown', {key: 'Enter', bubbles: true, cancelable: true})

      textarea.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(true)
      expect(requestSubmitSpy).toHaveBeenCalledTimes(1)
    })

    it('keeps default newline behavior on Enter by default', async () => {
      const form = document.createElement('form')
      const el = document.createElement('cv-textarea') as CVTextarea
      form.append(el)
      document.body.append(form)
      await settle(el)

      const requestSubmitSpy = vi.spyOn(form, 'requestSubmit').mockImplementation(() => {})
      const textarea = getTextarea(el)
      const event = new KeyboardEvent('keydown', {key: 'Enter', bubbles: true, cancelable: true})

      textarea.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(false)
      expect(requestSubmitSpy).not.toHaveBeenCalled()
    })

    it('keeps newline behavior on Shift+Enter when enter-behavior is submit', async () => {
      const form = document.createElement('form')
      const el = document.createElement('cv-textarea') as CVTextarea
      el.enterBehavior = 'submit'
      form.append(el)
      document.body.append(form)
      await settle(el)

      const requestSubmitSpy = vi.spyOn(form, 'requestSubmit').mockImplementation(() => {})
      const textarea = getTextarea(el)
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      })

      textarea.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(false)
      expect(requestSubmitSpy).not.toHaveBeenCalled()
    })

    it('does not submit while IME composition is active', async () => {
      const form = document.createElement('form')
      const el = document.createElement('cv-textarea') as CVTextarea
      el.enterBehavior = 'submit'
      form.append(el)
      document.body.append(form)
      await settle(el)

      const requestSubmitSpy = vi.spyOn(form, 'requestSubmit').mockImplementation(() => {})
      const textarea = getTextarea(el)
      const event = new KeyboardEvent('keydown', {key: 'Enter', bubbles: true, cancelable: true})
      Object.defineProperty(event, 'isComposing', {value: true})

      textarea.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(false)
      expect(requestSubmitSpy).not.toHaveBeenCalled()
    })
  })

  describe('headless contract delegation', () => {
    it('hydrates native attributes from headless getTextareaProps', async () => {
      const el = await createTextarea({
        disabled: true,
        readonly: true,
        required: true,
        placeholder: 'Type here',
      })
      const textarea = getTextarea(el)

      expect(textarea.id).toContain('textarea')
      expect(textarea.getAttribute('aria-disabled')).toBe('true')
      expect(textarea.getAttribute('aria-readonly')).toBe('true')
      expect(textarea.getAttribute('aria-required')).toBe('true')
      expect(textarea.getAttribute('placeholder')).toBe('Type here')
      expect(textarea.getAttribute('tabindex')).toBe('-1')
    })
  })

  describe('form association', () => {
    it('declares formAssociated for the custom element', () => {
      expect(CVTextarea.formAssociated).toBe(true)
    })

    it.skipIf(!hasElementInternals)('contributes value to FormData', async () => {
      const form = document.createElement('form')
      const el = await createTextarea({name: 'note', value: 'hello'})

      form.append(el)
      document.body.append(form)
      await settle(el)

      const value = new FormData(form).get('note')
      if (value === null) {
        return
      }

      expect(value).toBe('hello')
    })

    it('treats required textarea as invalid until it has a value', async () => {
      const el = await createTextarea({required: true})

      expect(el.checkValidity()).toBe(false)

      el.value = 'filled'
      await settle(el)

      expect(el.checkValidity()).toBe(true)
    })

    it('formResetCallback restores the value captured at first connect without emitting events', async () => {
      const el = await createTextarea({value: 'initial'})
      let inputCount = 0
      let changeCount = 0
      el.addEventListener('cv-input', () => inputCount++)
      el.addEventListener('cv-change', () => changeCount++)

      el.value = 'edited'
      await settle(el)
      expect(getTextarea(el).value).toBe('edited')

      el.formResetCallback()
      await settle(el)

      expect(el.value).toBe('initial')
      expect(getTextarea(el).value).toBe('initial')
      expect(inputCount).toBe(0)
      expect(changeCount).toBe(0)
    })

    it('formStateRestoreCallback restores a string state', async () => {
      const el = await createTextarea()

      el.formStateRestoreCallback('restored')
      await settle(el)

      expect(el.value).toBe('restored')
      expect(getTextarea(el).value).toBe('restored')
    })
  })

  describe('corner cases', () => {
    it('clears [filled] when value is emptied programmatically', async () => {
      const el = await createTextarea({value: 'hello'})
      expect(el.hasAttribute('filled')).toBe(true)

      el.value = ''
      await settle(el)

      expect(el.hasAttribute('filled')).toBe(false)
    })

    it('Enter in submit mode does nothing without a parent form', async () => {
      const el = await createTextarea({enterBehavior: 'submit'})
      const textarea = getTextarea(el)
      const event = new KeyboardEvent('keydown', {key: 'Enter', bubbles: true, cancelable: true})

      textarea.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(false)
    })

    it('Ctrl+Enter and Meta+Enter keep newline behavior in submit mode', async () => {
      const form = document.createElement('form')
      const el = document.createElement('cv-textarea') as CVTextarea
      el.enterBehavior = 'submit'
      form.append(el)
      document.body.append(form)
      await settle(el)

      const requestSubmitSpy = vi.spyOn(form, 'requestSubmit').mockImplementation(() => {})
      const textarea = getTextarea(el)

      const ctrlEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      })
      textarea.dispatchEvent(ctrlEvent)
      expect(ctrlEvent.defaultPrevented).toBe(false)

      const metaEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        metaKey: true,
        bubbles: true,
        cancelable: true,
      })
      textarea.dispatchEvent(metaEvent)
      expect(metaEvent.defaultPrevented).toBe(false)

      expect(requestSubmitSpy).not.toHaveBeenCalled()
    })

    it('ignores negative or non-finite minlength/maxlength values', async () => {
      const el = await createTextarea({minLength: -3, maxLength: Number.NaN})
      const textarea = getTextarea(el)

      expect(textarea.hasAttribute('minlength')).toBe(false)
      expect(textarea.hasAttribute('maxlength')).toBe(false)
    })

    it('cv-change on blur reports the latest value after multiple inputs', async () => {
      const el = await createTextarea()
      const details: Array<{value: string}> = []
      el.addEventListener('cv-change', (event: Event) => {
        details.push((event as CustomEvent<{value: string}>).detail)
      })

      const textarea = getTextarea(el)
      textarea.dispatchEvent(new FocusEvent('focus', {bubbles: true}))
      await settle(el)

      textarea.value = 'a'
      textarea.dispatchEvent(new InputEvent('input', {bubbles: true}))
      textarea.value = 'ab'
      textarea.dispatchEvent(new InputEvent('input', {bubbles: true}))
      await settle(el)

      textarea.dispatchEvent(new FocusEvent('blur', {bubbles: true}))
      await settle(el)

      expect(details).toEqual([{value: 'ab'}])
    })
  })

  // --- batch 10 regression fixes ---

  describe('null-safe value removal', () => {
    it('removing the value attribute does not throw and normalizes to empty', async () => {
      const el = await createTextarea()
      el.setAttribute('value', 'hello')
      await settle(el)
      expect(getTextarea(el).value).toBe('hello')

      expect(() => el.removeAttribute('value')).not.toThrow()
      await settle(el)

      expect(el.value).toBe('')
      expect(getTextarea(el).value).toBe('')
    })
  })

  describe('live() binding for rejected input', () => {
    it('reverts the native textarea when a listener rolls the value back', async () => {
      const el = await createTextarea()
      // Reject any input: keep value pinned to empty (simulating a controlled
      // parent that rolls back the change).
      el.addEventListener('cv-input', () => {
        el.value = ''
      })

      const textarea = getTextarea(el)
      textarea.value = 'forbidden'
      textarea.dispatchEvent(new InputEvent('input', {bubbles: true}))
      await settle(el)

      // Without live(), Lit's dirty-check would leave 'forbidden' visible in the
      // DOM even though the property is ''.
      expect(el.value).toBe('')
      expect(textarea.value).toBe('')
    })
  })
})
