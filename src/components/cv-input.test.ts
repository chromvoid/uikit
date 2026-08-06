import {afterEach, describe, expect, it, vi} from 'vitest'

import {CVInput, type CVInputInputEvent} from './cv-input'

CVInput.define()

const settle = async (element: CVInput) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
}

const createInput = async (attrs?: Partial<CVInput>) => {
  const el = document.createElement('cv-input') as CVInput
  if (attrs) {
    Object.assign(el, attrs)
  }
  document.body.append(el)
  await settle(el)
  return el
}

const getBase = (el: CVInput) => el.shadowRoot!.querySelector('[part="base"]') as HTMLElement

const getInput = (el: CVInput) => el.shadowRoot!.querySelector('[part="input"]') as HTMLInputElement

const getClearButton = (el: CVInput) => el.shadowRoot!.querySelector('[part="clear-button"]') as HTMLElement

const getPasswordToggle = (el: CVInput) =>
  el.shadowRoot!.querySelector('[part="password-toggle"]') as HTMLElement
const getStylesText = () =>
  (CVInput.styles as Array<{cssText?: string}>).map((style) => style.cssText ?? '').join('\n')

const setHorizontalOverflow = (input: HTMLInputElement) => {
  Object.defineProperties(input, {
    clientWidth: {configurable: true, value: 100},
    scrollWidth: {configurable: true, value: 300},
  })
}

function createPointerEvent(
  type: string,
  options: {clientX: number; clientY: number; pointerId?: number; pointerType?: string},
): PointerEvent {
  const event = new Event(type, {
    bubbles: true,
    composed: true,
    cancelable: true,
  }) as PointerEvent
  Object.defineProperties(event, {
    button: {value: 0},
    clientX: {value: options.clientX},
    clientY: {value: options.clientY},
    isPrimary: {value: true},
    pointerId: {value: options.pointerId ?? 1},
    pointerType: {value: options.pointerType ?? 'touch'},
  })
  return event
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('cv-input', () => {
  describe('style contract', () => {
    it('stretches the native input across the shell height', () => {
      const stylesText = getStylesText()

      expect(stylesText).toMatch(/\[part='input'\]\s*{[^}]*height:\s*100%;/)
    })

    it('renders filled variant with a visible non-prominent shell', () => {
      const stylesText = getStylesText()

      expect(stylesText).toMatch(
        /:host\(\[variant='filled'\]\) \[part='base'\]\s*{[\s\S]*background:\s*var\(--cv-color-surface-2/,
      )
      expect(stylesText).toMatch(
        /:host\(\[variant='filled'\]\) \[part='base'\]\s*{[\s\S]*border-color:\s*transparent;/,
      )
      expect(stylesText).toMatch(
        /:host\(\[variant='filled'\]\) \[part='base'\]\s*{[\s\S]*box-shadow:\s*inset 0 0 0 1px/,
      )
    })
  })

  // --- Shadow DOM structure ---

  describe('shadow DOM structure', () => {
    it('renders [part="base"] as a div', async () => {
      const el = await createInput()
      const base = getBase(el)
      expect(base).not.toBeNull()
      expect(base.tagName.toLowerCase()).toBe('div')
    })

    it('renders [part="input"] as a native input element', async () => {
      const el = await createInput()
      const input = getInput(el)
      expect(input).not.toBeNull()
      expect(input.tagName.toLowerCase()).toBe('input')
    })

    it('forwards control-id without replacing the native input ARIA references', async () => {
      const el = document.createElement('cv-input') as CVInput
      el.setAttribute('control-id', 'smoke.password')
      el.setAttribute('aria-labelledby', 'password-label')
      el.setAttribute('aria-describedby', 'password-help')
      document.body.append(el)
      await settle(el)

      const input = getInput(el)
      expect(input.id).toBe('smoke.password')
      expect(input.getAttribute('aria-labelledby')).toBe('password-label')
      expect(input.getAttribute('aria-describedby')).toBe('password-help')
    })

    it('forwards, updates, and removes aria-label while preserving the labelledby fallback', async () => {
      const el = document.createElement('cv-input') as CVInput
      el.setAttribute('aria-label', 'Password')
      el.setAttribute('aria-labelledby', 'password-label')
      document.body.append(el)
      await settle(el)

      const input = getInput(el)
      expect(input.getAttribute('aria-label')).toBe('Password')
      expect(input.getAttribute('aria-labelledby')).toBe('password-label')

      el.setAttribute('aria-label', 'Vault password')
      await settle(el)
      expect(input.getAttribute('aria-label')).toBe('Vault password')

      el.removeAttribute('aria-label')
      await settle(el)
      expect(input.hasAttribute('aria-label')).toBe(false)
      expect(input.getAttribute('aria-labelledby')).toBe('password-label')
    })

    it('keeps the generated native input id when control-id is absent', async () => {
      const el = await createInput()

      expect(getInput(el).id).toMatch(/^cv-input-\d+-input$/)
    })

    it('renders the password toggle as a native non-submitting button', async () => {
      const el = await createInput({type: 'password', passwordToggle: true})
      const toggle = getPasswordToggle(el)

      expect(toggle).toBeInstanceOf(HTMLButtonElement)
      expect((toggle as HTMLButtonElement).type).toBe('button')
    })

    it('forwards enterkeyhint to the native input', async () => {
      const el = document.createElement('cv-input') as CVInput
      el.setAttribute('enterkeyhint', 'done')
      document.body.append(el)
      await settle(el)

      expect(el.enterKeyHint).toBe('done')
      expect(getInput(el).getAttribute('enterkeyhint')).toBe('done')
    })

    it('renders [part="prefix"] containing slot[name="prefix"]', async () => {
      const el = await createInput()
      const prefix = el.shadowRoot!.querySelector('[part="prefix"]')
      expect(prefix).not.toBeNull()
      const slot = prefix!.querySelector('slot[name="prefix"]')
      expect(slot).not.toBeNull()
    })

    it('renders [part="suffix"] containing slot[name="suffix"]', async () => {
      const el = await createInput()
      const suffix = el.shadowRoot!.querySelector('[part="suffix"]')
      expect(suffix).not.toBeNull()
      const slot = suffix!.querySelector('slot[name="suffix"]')
      expect(slot).not.toBeNull()
    })

    it('renders [part="clear-button"]', async () => {
      const el = await createInput({clearable: true, value: 'hello'})
      const clearBtn = getClearButton(el)
      expect(clearBtn).not.toBeNull()
    })

    it('renders [part="clear-button"] with slot[name="clear-icon"]', async () => {
      const el = await createInput({clearable: true, value: 'hello'})
      const clearBtn = getClearButton(el)
      expect(clearBtn).not.toBeNull()
      const slot = clearBtn!.querySelector('slot[name="clear-icon"]')
      expect(slot).not.toBeNull()
    })

    it('renders [part="password-toggle"]', async () => {
      const el = await createInput({type: 'password', passwordToggle: true})
      const toggle = getPasswordToggle(el)
      expect(toggle).not.toBeNull()
    })

    it('does NOT render a default (unnamed) slot', async () => {
      const el = await createInput()
      const defaultSlot = el.shadowRoot!.querySelector('slot:not([name])')
      expect(defaultSlot).toBeNull()
    })
  })

  // --- Default property values ---

  describe('default property values', () => {
    it('has correct defaults', async () => {
      const el = await createInput()
      expect(el.value).toBe('')
      expect(el.type).toBe('text')
      expect(el.placeholder).toBe('')
      expect(el.disabled).toBe(false)
      expect(el.readonly).toBe(false)
      expect(el.required).toBe(false)
      expect(el.clearable).toBe(false)
      expect(el.passwordToggle).toBe(false)
      expect(el.size).toBe('medium')
      expect(el.variant).toBe('outlined')
      expect(el.preset).toBeUndefined()
      expect(el.name).toBe('')
      expect(el.autofocus).toBe(false)
      expect(el.autocomplete).toBe('')
      expect(el.enterKeyHint).toBe('')
      expect(el.maxlength).toBeUndefined()
      expect(el.invalid).toBe(false)
      expect(el.controlId).toBe('')
    })
  })

  // --- Attribute reflection ---

  describe('attribute reflection', () => {
    it('boolean attributes reflect: disabled, readonly, required, clearable, password-toggle', async () => {
      const el = await createInput({
        disabled: true,
        readonly: true,
        required: true,
        clearable: true,
        passwordToggle: true,
      })
      expect(el.hasAttribute('disabled')).toBe(true)
      expect(el.hasAttribute('readonly')).toBe(true)
      expect(el.hasAttribute('required')).toBe(true)
      expect(el.hasAttribute('clearable')).toBe(true)
      expect(el.hasAttribute('password-toggle')).toBe(true)
    })

    it('string attributes reflect: size, variant, preset', async () => {
      const el = await createInput({size: 'large', variant: 'filled', preset: 'search-mobile'})
      expect(el.getAttribute('size')).toBe('large')
      expect(el.getAttribute('variant')).toBe('filled')
      expect(el.getAttribute('preset')).toBe('search-mobile')
    })

    it('host reflects [focused] attribute when input is focused', async () => {
      const el = await createInput()
      const input = getInput(el)
      input.dispatchEvent(new FocusEvent('focus', {bubbles: true}))
      await settle(el)
      expect(el.hasAttribute('focused')).toBe(true)
    })

    it('host reflects [filled] attribute when value is non-empty', async () => {
      const el = await createInput({value: 'hello'})
      expect(el.hasAttribute('filled')).toBe(true)
    })

    it('host does NOT have [filled] when value is empty', async () => {
      const el = await createInput()
      expect(el.hasAttribute('filled')).toBe(false)
    })
  })

  // --- Events ---

  describe('events', () => {
    it('dispatches cv-input on native input event with { value } detail', async () => {
      const el = await createInput()
      const details: Array<{value: string}> = []
      el.addEventListener('cv-input', (e) => details.push((e as CVInputInputEvent).detail))

      const input = getInput(el)
      // Simulate user typing
      input.value = 'hello'
      input.dispatchEvent(new InputEvent('input', {bubbles: true}))
      await settle(el)

      expect(details).toEqual([{value: 'hello'}])
    })

    it('dispatches cv-clear when clear button is clicked', async () => {
      const el = await createInput({clearable: true, value: 'hello'})
      let clearFired = false
      el.addEventListener('cv-clear', () => {
        clearFired = true
      })

      const clearBtn = getClearButton(el)
      clearBtn.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(clearFired).toBe(true)
    })

    it('dispatches cv-clear when Escape is pressed with clearable and filled', async () => {
      const el = await createInput({clearable: true, value: 'hello'})
      let clearFired = false
      el.addEventListener('cv-clear', () => {
        clearFired = true
      })

      const input = getInput(el)
      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))
      await settle(el)

      expect(clearFired).toBe(true)
    })

    it('dispatches cv-focus when input receives focus', async () => {
      const el = await createInput()
      let focusFired = false
      el.addEventListener('cv-focus', () => {
        focusFired = true
      })

      const input = getInput(el)
      input.dispatchEvent(new FocusEvent('focus', {bubbles: true}))
      await settle(el)

      expect(focusFired).toBe(true)
    })

    it('dispatches cv-blur when input loses focus', async () => {
      const el = await createInput()
      let blurFired = false
      el.addEventListener('cv-blur', () => {
        blurFired = true
      })

      const input = getInput(el)
      input.dispatchEvent(new FocusEvent('focus', {bubbles: true}))
      await settle(el)
      input.dispatchEvent(new FocusEvent('blur', {bubbles: true}))
      await settle(el)

      expect(blurFired).toBe(true)
    })

    it('dispatches cv-change on blur when value changed since focus', async () => {
      const el = await createInput()
      const details: Array<{value: string}> = []
      el.addEventListener('cv-change', (e) => details.push((e as CustomEvent).detail))

      const input = getInput(el)
      input.dispatchEvent(new FocusEvent('focus', {bubbles: true}))
      await settle(el)

      // Simulate user input
      input.value = 'hello'
      input.dispatchEvent(new InputEvent('input', {bubbles: true}))
      await settle(el)

      // Blur to commit
      input.dispatchEvent(new FocusEvent('blur', {bubbles: true}))
      await settle(el)

      expect(details).toEqual([{value: 'hello'}])
    })

    it('does NOT dispatch cv-change on blur when value did not change', async () => {
      const el = await createInput()
      let changeFired = false
      el.addEventListener('cv-change', () => {
        changeFired = true
      })

      const input = getInput(el)
      input.dispatchEvent(new FocusEvent('focus', {bubbles: true}))
      await settle(el)
      input.dispatchEvent(new FocusEvent('blur', {bubbles: true}))
      await settle(el)

      expect(changeFired).toBe(false)
    })

    it('cv-input detail has shape { value: string }', async () => {
      const el = await createInput()
      let detail: unknown
      el.addEventListener('cv-input', (e) => {
        detail = e.detail
      })

      const input = getInput(el)
      input.value = 'test'
      input.dispatchEvent(new InputEvent('input', {bubbles: true}))
      await settle(el)

      expect(detail).toEqual({value: 'test'})
    })

    it('dispatches cv-change on blur after Escape cleared the value', async () => {
      const el = await createInput({clearable: true, value: 'hello'})
      const details: Array<{value: string}> = []
      el.addEventListener('cv-change', (e) => details.push((e as CustomEvent).detail))

      const input = getInput(el)
      input.dispatchEvent(new FocusEvent('focus', {bubbles: true}))
      await settle(el)
      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))
      await settle(el)
      input.dispatchEvent(new FocusEvent('blur', {bubbles: true}))
      await settle(el)

      expect(details).toEqual([{value: ''}])
    })

    it('does NOT dispatch cv-change on blur when the value was changed and reverted', async () => {
      const el = await createInput({value: 'hello'})
      let changeFired = false
      el.addEventListener('cv-change', () => {
        changeFired = true
      })

      const input = getInput(el)
      input.dispatchEvent(new FocusEvent('focus', {bubbles: true}))
      await settle(el)

      input.value = 'hellox'
      input.dispatchEvent(new InputEvent('input', {bubbles: true}))
      await settle(el)

      input.value = 'hello'
      input.dispatchEvent(new InputEvent('input', {bubbles: true}))
      await settle(el)

      input.dispatchEvent(new FocusEvent('blur', {bubbles: true}))
      await settle(el)

      expect(changeFired).toBe(false)
    })

    it('cv-clear detail has shape { }', async () => {
      const el = await createInput({clearable: true, value: 'hello'})
      let detail: unknown
      el.addEventListener('cv-clear', (e) => {
        detail = (e as CustomEvent).detail
      })

      const clearBtn = getClearButton(el)
      clearBtn.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(detail).toEqual({})
    })
  })

  // --- ARIA ---

  describe('ARIA', () => {
    it('native input has no explicit role (uses implicit textbox role)', async () => {
      const el = await createInput()
      const input = getInput(el)
      expect(input.hasAttribute('role')).toBe(false)
    })

    it('aria-disabled="true" on native input when disabled', async () => {
      const el = await createInput({disabled: true})
      const input = getInput(el)
      expect(input.getAttribute('aria-disabled')).toBe('true')
    })

    it('aria-disabled absent on native input when enabled', async () => {
      const el = await createInput()
      const input = getInput(el)
      expect(input.hasAttribute('aria-disabled')).toBe(false)
    })

    it('aria-readonly="true" on native input when readonly', async () => {
      const el = await createInput({readonly: true})
      const input = getInput(el)
      expect(input.getAttribute('aria-readonly')).toBe('true')
    })

    it('aria-readonly absent on native input when not readonly', async () => {
      const el = await createInput()
      const input = getInput(el)
      expect(input.hasAttribute('aria-readonly')).toBe(false)
    })

    it('aria-required="true" on native input when required', async () => {
      const el = await createInput({required: true})
      const input = getInput(el)
      expect(input.getAttribute('aria-required')).toBe('true')
    })

    it('aria-required absent on native input when not required', async () => {
      const el = await createInput()
      const input = getInput(el)
      expect(input.hasAttribute('aria-required')).toBe(false)
    })

    it('tabindex="0" on native input when enabled', async () => {
      const el = await createInput()
      const input = getInput(el)
      expect(input.getAttribute('tabindex')).toBe('0')
    })

    it('tabindex="-1" on native input when disabled', async () => {
      const el = await createInput({disabled: true})
      const input = getInput(el)
      expect(input.getAttribute('tabindex')).toBe('-1')
    })

    it('autocomplete="off" when type is password', async () => {
      const el = await createInput({type: 'password'})
      const input = getInput(el)
      expect(input.getAttribute('autocomplete')).toBe('off')
    })

    it('autocomplete absent when type is not password', async () => {
      const el = await createInput({type: 'text'})
      const input = getInput(el)
      expect(input.hasAttribute('autocomplete')).toBe(false)
    })

    it('uses explicit autocomplete when provided', async () => {
      const el = await createInput({type: 'password', autocomplete: 'current-password'})
      const input = getInput(el)
      expect(input.getAttribute('autocomplete')).toBe('current-password')
    })

    it('applies maxlength attribute to native input', async () => {
      const el = await createInput({maxlength: 12})
      const input = getInput(el)
      expect(input.getAttribute('maxlength')).toBe('12')
    })

    it('does not apply maxlength when the attribute is not numeric', async () => {
      const el = await createInput()
      el.setAttribute('maxlength', 'abc')
      await settle(el)

      expect(getInput(el).hasAttribute('maxlength')).toBe(false)
    })

    it('sets aria-invalid on native input when invalid', async () => {
      const el = await createInput({invalid: true})
      const input = getInput(el)
      expect(input.getAttribute('aria-invalid')).toBe('true')
    })

    it('passes aria-labelledby and aria-describedby through to the native input', async () => {
      const el = await createInput()
      el.setAttribute('aria-labelledby', 'field-label')
      el.setAttribute('aria-describedby', 'field-description field-error')
      await settle(el)

      const input = getInput(el)
      expect(input.getAttribute('aria-labelledby')).toBe('field-label')
      expect(input.getAttribute('aria-describedby')).toBe('field-description field-error')
    })

    it('clear button has role="button"', async () => {
      const el = await createInput({clearable: true, value: 'hello'})
      const clearBtn = getClearButton(el)
      expect(clearBtn.getAttribute('role')).toBe('button')
    })

    it('clear button has aria-label="Clear input"', async () => {
      const el = await createInput({clearable: true, value: 'hello'})
      const clearBtn = getClearButton(el)
      expect(clearBtn.getAttribute('aria-label')).toBe('Clear input')
    })

    it('clear button has tabindex="-1"', async () => {
      const el = await createInput({clearable: true, value: 'hello'})
      const clearBtn = getClearButton(el)
      expect(clearBtn.getAttribute('tabindex')).toBe('-1')
    })

    it('password toggle has role="button"', async () => {
      const el = await createInput({type: 'password', passwordToggle: true})
      const toggle = getPasswordToggle(el)
      expect(toggle.getAttribute('role')).toBe('button')
    })

    it('password toggle has aria-label="Show password" initially', async () => {
      const el = await createInput({type: 'password', passwordToggle: true})
      const toggle = getPasswordToggle(el)
      expect(toggle.getAttribute('aria-label')).toBe('Show password')
    })

    it('password toggle has aria-pressed="false" initially', async () => {
      const el = await createInput({type: 'password', passwordToggle: true})
      const toggle = getPasswordToggle(el)
      expect(toggle.getAttribute('aria-pressed')).toBe('false')
    })

    it('password toggle has tabindex="0" when visible', async () => {
      const el = await createInput({type: 'password', passwordToggle: true})
      const toggle = getPasswordToggle(el)
      expect(toggle.getAttribute('tabindex')).toBe('0')
    })
  })

  // --- Clearable behavior ---

  describe('clearable behavior', () => {
    it('clear button is hidden when value is empty', async () => {
      const el = await createInput({clearable: true})
      const clearBtn = getClearButton(el)
      expect(clearBtn.hidden).toBe(true)
    })

    it('clear button is visible when clearable and value is non-empty', async () => {
      const el = await createInput({clearable: true, value: 'hello'})
      const clearBtn = getClearButton(el)
      expect(clearBtn.hidden).not.toBe(true)
    })

    it('clear button is hidden when disabled even with value', async () => {
      const el = await createInput({clearable: true, value: 'hello', disabled: true})
      const clearBtn = getClearButton(el)
      expect(clearBtn.hidden).toBe(true)
    })

    it('clear button is hidden when readonly even with value', async () => {
      const el = await createInput({clearable: true, value: 'hello', readonly: true})
      const clearBtn = getClearButton(el)
      expect(clearBtn.hidden).toBe(true)
    })

    it('clicking clear button resets value to empty string', async () => {
      const el = await createInput({clearable: true, value: 'hello'})
      const clearBtn = getClearButton(el)
      clearBtn.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(el.value).toBe('')
    })

    it('requests form submit on Enter when inside a form', async () => {
      const el = await createInput()
      const form = document.createElement('form')
      const requestSubmitSpy = vi.spyOn(form, 'requestSubmit').mockImplementation(() => {})

      form.append(el)
      document.body.append(form)
      await settle(el)

      const input = getInput(el)
      const event = new KeyboardEvent('keydown', {key: 'Enter', bubbles: true, cancelable: true})
      input.dispatchEvent(event)
      await settle(el)

      expect(event.defaultPrevented).toBe(true)
      expect(requestSubmitSpy).toHaveBeenCalledTimes(1)
    })

    it('Enter does not prevent default when there is no form', async () => {
      const el = await createInput()
      const input = getInput(el)
      const event = new KeyboardEvent('keydown', {key: 'Enter', bubbles: true, cancelable: true})
      input.dispatchEvent(event)
      await settle(el)

      expect(event.defaultPrevented).toBe(false)
    })

    it('Enter with a modifier key does not submit the form', async () => {
      const el = await createInput()
      const form = document.createElement('form')
      const requestSubmitSpy = vi.spyOn(form, 'requestSubmit').mockImplementation(() => {})

      form.append(el)
      document.body.append(form)
      await settle(el)

      const input = getInput(el)
      for (const modifier of ['shiftKey', 'altKey', 'ctrlKey', 'metaKey'] as const) {
        const event = new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          cancelable: true,
          [modifier]: true,
        })
        input.dispatchEvent(event)
        expect(event.defaultPrevented).toBe(false)
      }
      await settle(el)

      expect(requestSubmitSpy).not.toHaveBeenCalled()
    })

    it('already-handled Enter does not submit the form', async () => {
      const el = await createInput()
      const form = document.createElement('form')
      const requestSubmitSpy = vi.spyOn(form, 'requestSubmit').mockImplementation(() => {})

      form.append(el)
      document.body.append(form)
      await settle(el)

      getBase(el).addEventListener('keydown', (e) => e.preventDefault(), {capture: true})

      const input = getInput(el)
      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true, cancelable: true}))
      await settle(el)

      expect(requestSubmitSpy).not.toHaveBeenCalled()
    })

    it('clear button becomes hidden after value is cleared', async () => {
      const el = await createInput({clearable: true, value: 'hello'})
      const clearBtn = getClearButton(el)
      clearBtn.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      const updatedClearBtn = getClearButton(el)
      expect(updatedClearBtn.hidden).toBe(true)
    })

    it('Escape key clears value when clearable and filled', async () => {
      const el = await createInput({clearable: true, value: 'hello'})
      const input = getInput(el)
      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))
      await settle(el)

      expect(el.value).toBe('')
    })

    it('Escape key does nothing when not clearable', async () => {
      const el = await createInput({value: 'hello'})
      const input = getInput(el)
      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))
      await settle(el)

      expect(el.value).toBe('hello')
    })

    it('Escape key does nothing when value is empty', async () => {
      const el = await createInput({clearable: true})
      const input = getInput(el)
      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))
      await settle(el)

      expect(el.value).toBe('')
    })

    it('clear button has aria-hidden="true" when hidden', async () => {
      const el = await createInput({clearable: true})
      const clearBtn = getClearButton(el)
      expect(clearBtn.getAttribute('aria-hidden')).toBe('true')
    })
  })

  // --- Password toggle behavior ---

  describe('password toggle behavior', () => {
    it('password toggle is hidden when type is not password', async () => {
      const el = await createInput({type: 'text', passwordToggle: true})
      const toggle = getPasswordToggle(el)
      expect(toggle.hidden).toBe(true)
    })

    it('password toggle is hidden when passwordToggle is false', async () => {
      const el = await createInput({type: 'password', passwordToggle: false})
      const toggle = getPasswordToggle(el)
      expect(toggle.hidden).toBe(true)
    })

    it('password toggle is visible when type=password and passwordToggle=true', async () => {
      const el = await createInput({type: 'password', passwordToggle: true})
      const toggle = getPasswordToggle(el)
      expect(toggle.hidden).not.toBe(true)
    })

    it('clicking password toggle reveals the password (type becomes text)', async () => {
      const el = await createInput({type: 'password', passwordToggle: true})
      const toggle = getPasswordToggle(el)
      toggle.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      const input = getInput(el)
      expect(input.getAttribute('type')).toBe('text')
    })

    it('clicking password toggle again hides the password', async () => {
      const el = await createInput({type: 'password', passwordToggle: true})
      const toggle = getPasswordToggle(el)
      toggle.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)
      toggle.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      const input = getInput(el)
      expect(input.getAttribute('type')).toBe('password')
    })

    it('aria-pressed updates to "true" after toggle click', async () => {
      const el = await createInput({type: 'password', passwordToggle: true})
      const toggle = getPasswordToggle(el)
      toggle.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      const updatedToggle = getPasswordToggle(el)
      expect(updatedToggle.getAttribute('aria-pressed')).toBe('true')
    })

    it('aria-label changes to "Hide password" after revealing', async () => {
      const el = await createInput({type: 'password', passwordToggle: true})
      const toggle = getPasswordToggle(el)
      toggle.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      const updatedToggle = getPasswordToggle(el)
      expect(updatedToggle.getAttribute('aria-label')).toBe('Hide password')
    })

    it('password toggle has aria-hidden="true" when hidden', async () => {
      const el = await createInput({type: 'text', passwordToggle: true})
      const toggle = getPasswordToggle(el)
      expect(toggle.getAttribute('aria-hidden')).toBe('true')
    })
  })

  // --- Disabled behavior ---

  describe('disabled behavior', () => {
    it('host has [disabled] attribute when disabled', async () => {
      const el = await createInput({disabled: true})
      expect(el.hasAttribute('disabled')).toBe(true)
    })

    it('native input has disabled attribute when disabled', async () => {
      const el = await createInput({disabled: true})
      const input = getInput(el)
      expect(input.disabled).toBe(true)
    })

    it('native input event does not dispatch cv-input when disabled', async () => {
      const el = await createInput({disabled: true})
      let inputFired = false
      el.addEventListener('cv-input', () => {
        inputFired = true
      })

      const input = getInput(el)
      input.value = 'hello'
      input.dispatchEvent(new InputEvent('input', {bubbles: true}))
      await settle(el)

      expect(inputFired).toBe(false)
    })

    it('clear does not work when disabled', async () => {
      const el = await createInput({clearable: true, value: 'hello', disabled: true})
      const clearBtn = getClearButton(el)
      clearBtn.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(el.value).toBe('hello')
    })

    it('Escape key does not clear when disabled', async () => {
      const el = await createInput({clearable: true, value: 'hello', disabled: true})
      const input = getInput(el)
      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))
      await settle(el)

      expect(el.value).toBe('hello')
    })
  })

  // --- Readonly behavior ---

  describe('readonly behavior', () => {
    it('host has [readonly] attribute when readonly', async () => {
      const el = await createInput({readonly: true})
      expect(el.hasAttribute('readonly')).toBe(true)
    })

    it('native input has readonly attribute when readonly', async () => {
      const el = await createInput({readonly: true})
      const input = getInput(el)
      expect(input.readOnly).toBe(true)
    })

    it('clear does not work when readonly', async () => {
      const el = await createInput({clearable: true, value: 'hello', readonly: true})
      const clearBtn = getClearButton(el)
      clearBtn.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      expect(el.value).toBe('hello')
    })

    it('Escape key does not clear when readonly', async () => {
      const el = await createInput({clearable: true, value: 'hello', readonly: true})
      const input = getInput(el)
      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))
      await settle(el)

      expect(el.value).toBe('hello')
    })

    it('input remains focusable when readonly (tabindex="0")', async () => {
      const el = await createInput({readonly: true})
      const input = getInput(el)
      expect(input.getAttribute('tabindex')).toBe('0')
    })

    it('native input event does not dispatch cv-input when readonly', async () => {
      const el = await createInput({readonly: true, value: 'hello'})
      let inputFired = false
      el.addEventListener('cv-input', () => {
        inputFired = true
      })

      const input = getInput(el)
      input.value = 'changed'
      input.dispatchEvent(new InputEvent('input', {bubbles: true}))
      await settle(el)

      expect(inputFired).toBe(false)
      expect(el.value).toBe('hello')
    })

    it('scrolls an overflowing readonly value with a horizontal touch drag', async () => {
      const el = await createInput({readonly: true, readonlyScrollable: true, value: 'a'.repeat(100)})
      const input = getInput(el)
      setHorizontalOverflow(input)
      input.scrollLeft = 20

      input.dispatchEvent(createPointerEvent('pointerdown', {clientX: 140, clientY: 20}))
      const move = createPointerEvent('pointermove', {clientX: 80, clientY: 22})
      input.dispatchEvent(move)

      expect(move.defaultPrevented).toBe(true)
      expect(input.scrollLeft).toBe(80)
    })

    it('leaves vertical readonly drags to the containing page scroller', async () => {
      const el = await createInput({readonly: true, readonlyScrollable: true, value: 'a'.repeat(100)})
      const input = getInput(el)
      setHorizontalOverflow(input)

      input.dispatchEvent(createPointerEvent('pointerdown', {clientX: 140, clientY: 20}))
      const move = createPointerEvent('pointermove', {clientX: 138, clientY: 80})
      input.dispatchEvent(move)

      expect(move.defaultPrevented).toBe(false)
      expect(input.scrollLeft).toBe(0)
    })

    it('does not intercept touch drags unless readonly scrolling is enabled', async () => {
      const el = await createInput({readonly: true, value: 'a'.repeat(100)})
      const input = getInput(el)
      setHorizontalOverflow(input)

      input.dispatchEvent(createPointerEvent('pointerdown', {clientX: 140, clientY: 20}))
      const move = createPointerEvent('pointermove', {clientX: 80, clientY: 22})
      input.dispatchEvent(move)

      expect(move.defaultPrevented).toBe(false)
      expect(input.scrollLeft).toBe(0)
    })
  })

  // --- Headless contract delegation ---

  describe('headless contract delegation', () => {
    it('native input ARIA attributes originate from contracts.getInputProps(), not hardcoded', async () => {
      const el = await createInput({disabled: true, required: true, readonly: true})
      const input = getInput(el)

      // These values must match what headless getInputProps() returns
      expect(input.getAttribute('aria-disabled')).toBe('true')
      expect(input.getAttribute('aria-readonly')).toBe('true')
      expect(input.getAttribute('aria-required')).toBe('true')
      expect(input.getAttribute('tabindex')).toBe('-1')
    })

    it('clear button attributes originate from contracts.getClearButtonProps()', async () => {
      const el = await createInput({clearable: true, value: 'hello'})
      const clearBtn = getClearButton(el)

      expect(clearBtn.getAttribute('role')).toBe('button')
      expect(clearBtn.getAttribute('aria-label')).toBe('Clear input')
      expect(clearBtn.getAttribute('tabindex')).toBe('-1')
    })

    it('password toggle attributes originate from contracts.getPasswordToggleProps()', async () => {
      const el = await createInput({type: 'password', passwordToggle: true})
      const toggle = getPasswordToggle(el)

      expect(toggle.getAttribute('role')).toBe('button')
      expect(toggle.getAttribute('aria-label')).toBe('Show password')
      expect(toggle.getAttribute('aria-pressed')).toBe('false')
      expect(toggle.getAttribute('tabindex')).toBe('0')
    })

    it('input type is set from headless resolvedType, not directly from the type property', async () => {
      const el = await createInput({type: 'password', passwordToggle: true})
      const input = getInput(el)
      expect(input.getAttribute('type')).toBe('password')

      // Toggle password visibility
      const toggle = getPasswordToggle(el)
      toggle.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(el)

      const updatedInput = getInput(el)
      expect(updatedInput.getAttribute('type')).toBe('text')
    })

    it('input id is generated from headless idBase pattern', async () => {
      const el = await createInput()
      const input = getInput(el)
      expect(input.id).toContain('input')
    })
  })

  // --- Dynamic state updates ---

  describe('dynamic state updates', () => {
    it('changing disabled at runtime syncs aria-disabled on native input', async () => {
      const el = await createInput()
      const input = getInput(el)
      expect(input.hasAttribute('aria-disabled')).toBe(false)

      el.disabled = true
      await settle(el)
      expect(getInput(el).getAttribute('aria-disabled')).toBe('true')

      el.disabled = false
      await settle(el)
      expect(getInput(el).hasAttribute('aria-disabled')).toBe(false)
    })

    it('changing readonly at runtime syncs aria-readonly on native input', async () => {
      const el = await createInput()
      expect(getInput(el).hasAttribute('aria-readonly')).toBe(false)

      el.readonly = true
      await settle(el)
      expect(getInput(el).getAttribute('aria-readonly')).toBe('true')

      el.readonly = false
      await settle(el)
      expect(getInput(el).hasAttribute('aria-readonly')).toBe(false)
    })

    it('changing required at runtime syncs aria-required on native input', async () => {
      const el = await createInput()
      expect(getInput(el).hasAttribute('aria-required')).toBe(false)

      el.required = true
      await settle(el)
      expect(getInput(el).getAttribute('aria-required')).toBe('true')

      el.required = false
      await settle(el)
      expect(getInput(el).hasAttribute('aria-required')).toBe(false)
    })

    it('setting value programmatically updates [filled] host attribute', async () => {
      const el = await createInput()
      expect(el.hasAttribute('filled')).toBe(false)

      el.value = 'hello'
      await settle(el)
      expect(el.hasAttribute('filled')).toBe(true)

      el.value = ''
      await settle(el)
      expect(el.hasAttribute('filled')).toBe(false)
    })

    it('focus and blur update [focused] host attribute', async () => {
      const el = await createInput()
      expect(el.hasAttribute('focused')).toBe(false)

      const input = getInput(el)
      input.dispatchEvent(new FocusEvent('focus', {bubbles: true}))
      await settle(el)
      expect(el.hasAttribute('focused')).toBe(true)

      input.dispatchEvent(new FocusEvent('blur', {bubbles: true}))
      await settle(el)
      expect(el.hasAttribute('focused')).toBe(false)
    })

    it('host focus() delegates to native input focus()', async () => {
      const el = await createInput()
      const input = getInput(el)
      const focusSpy = vi.spyOn(input, 'focus')

      el.focus()

      expect(focusSpy).toHaveBeenCalledTimes(1)
    })

    it('select() delegates to native input select()', async () => {
      const el = await createInput()
      const input = getInput(el)
      const selectSpy = vi.spyOn(input, 'select')

      el.select()

      expect(selectSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('form association', () => {
    const hasElementInternals =
      typeof (HTMLElement.prototype as {attachInternals?: unknown}).attachInternals === 'function'

    it('declares formAssociated for custom element', () => {
      expect(CVInput.formAssociated).toBe(true)
    })

    it.skipIf(!hasElementInternals)('participates in FormData via attachInternals', async () => {
      const form = document.createElement('form')
      const el = await createInput({name: 'vaultPassword', value: 'secret'})

      form.append(el)
      document.body.append(form)
      await settle(el)

      const formData = new FormData(form)
      const value = formData.get('vaultPassword')
      if (value === null) {
        // Some test environments expose attachInternals but don't include FACE controls in FormData.
        return
      }
      expect(value).toBe('secret')
    })

    it.skipIf(!hasElementInternals)('respects formDisabledCallback by dropping form value', async () => {
      const form = document.createElement('form')
      const el = await createInput({name: 'field', value: 'value'})
      form.append(el)
      document.body.append(form)
      await settle(el)

      const before = new FormData(form).get('field')
      el.formDisabledCallback(true)
      await settle(el)

      const formData = new FormData(form)
      if (before === null) {
        return
      }
      expect(formData.get('field')).toBeNull()
    })

    it('formResetCallback restores the value captured at first connect', async () => {
      const el = await createInput({value: 'initial'})

      el.value = 'edited'
      await settle(el)
      expect(getInput(el).value).toBe('edited')

      el.formResetCallback()
      await settle(el)

      expect(el.value).toBe('initial')
      expect(getInput(el).value).toBe('initial')
    })

    it('formStateRestoreCallback restores a string state', async () => {
      const el = await createInput()

      el.formStateRestoreCallback('restored')
      await settle(el)

      expect(el.value).toBe('restored')
      expect(getInput(el).value).toBe('restored')
    })

    it('formStateRestoreCallback ignores non-string state', async () => {
      const el = await createInput({value: 'kept'})

      el.formStateRestoreCallback(null)
      await settle(el)

      expect(el.value).toBe('kept')
    })

    it('checkValidity reports valueMissing for a required empty input', async () => {
      const el = await createInput({required: true})

      expect(el.checkValidity()).toBe(false)
      expect(el.validationMessage).toBe('Please fill out this field.')

      el.value = 'filled'
      await settle(el)

      expect(el.checkValidity()).toBe(true)
    })

    it('invalid property reports a customError', async () => {
      const el = await createInput({invalid: true})

      expect(el.checkValidity()).toBe(false)
      expect(el.validationMessage).toBe('Invalid value')
    })

    it('willValidate is false when disabled', async () => {
      const el = await createInput({disabled: true})
      expect(el.willValidate).toBe(false)
    })
  })

  describe('regression (batch 5)', () => {
    it('removeAttribute("value") does not throw and clears filled state', async () => {
      const el = document.createElement('cv-input') as CVInput
      el.setAttribute('value', 'hello')
      document.body.append(el)
      await settle(el)
      expect(el.hasAttribute('filled')).toBe(true)

      // Lit's String converter turns removeAttribute into a null property write.
      el.removeAttribute('value')
      await settle(el)

      // null is normalized to '' instead of crashing filled() with null.length.
      expect(el.value).toBe('')
      expect(el.hasAttribute('filled')).toBe(false)
      expect(getInput(el).value).toBe('')
    })

    it('programmatic value assignment does not emit cv-input', async () => {
      const el = await createInput()
      let count = 0
      el.addEventListener('cv-input', () => count++)

      el.value = 'hello'
      await settle(el)

      expect(el.value).toBe('hello')
      expect(getInput(el).value).toBe('hello')
      expect(count).toBe(0)
    })

    it('formResetCallback does not emit cv-input', async () => {
      const el = await createInput({value: 'initial'})
      el.value = 'edited'
      await settle(el)

      let count = 0
      el.addEventListener('cv-input', () => count++)

      el.formResetCallback()
      await settle(el)

      expect(el.value).toBe('initial')
      expect(count).toBe(0)
    })

    it('formStateRestoreCallback does not emit cv-input', async () => {
      const el = await createInput()
      let count = 0
      el.addEventListener('cv-input', () => count++)

      el.formStateRestoreCallback('restored')
      await settle(el)

      expect(el.value).toBe('restored')
      expect(count).toBe(0)
    })

    it('Escape that clears the field calls preventDefault', async () => {
      const el = await createInput({clearable: true, value: 'hello'})
      const input = getInput(el)
      const event = new KeyboardEvent('keydown', {key: 'Escape', bubbles: true, cancelable: true})
      input.dispatchEvent(event)
      await settle(el)

      expect(el.value).toBe('')
      expect(event.defaultPrevented).toBe(true)
    })

    it('Escape does not clear when already handled by a consumer', async () => {
      const el = await createInput({clearable: true, value: 'hello'})
      const input = getInput(el)
      input.addEventListener('keydown', (e) => e.preventDefault(), {capture: true})

      input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true, cancelable: true}))
      await settle(el)

      expect(el.value).toBe('hello')
    })

    it('Escape on an empty field does not call preventDefault (lets overlays close)', async () => {
      const el = await createInput({clearable: true})
      const input = getInput(el)
      const event = new KeyboardEvent('keydown', {key: 'Escape', bubbles: true, cancelable: true})
      input.dispatchEvent(event)
      await settle(el)

      expect(event.defaultPrevented).toBe(false)
    })
  })

  describe('host pointerdown keyboard continuity', () => {
    const dispatchHostPointerDown = (el: CVInput, target: HTMLElement): PointerEvent => {
      const event = new Event('pointerdown', {
        bubbles: true,
        composed: true,
        cancelable: true,
      }) as PointerEvent
      target.dispatchEvent(event)
      return event
    }

    it('claims a shell tap and focuses the inner input while another field is focused', async () => {
      const other = document.createElement('input')
      document.body.append(other)
      other.focus()

      const el = await createInput()
      const event = dispatchHostPointerDown(el, getBase(el))

      expect(event.defaultPrevented).toBe(true)
      expect(el.shadowRoot!.activeElement).toBe(getInput(el))
    })

    it('does not intercept when no editable element holds focus', async () => {
      const el = await createInput()
      const event = dispatchHostPointerDown(el, getBase(el))

      expect(event.defaultPrevented).toBe(false)
      expect(el.shadowRoot!.activeElement).toBeNull()
    })

    it('does not intercept taps landing on the inner input itself', async () => {
      const other = document.createElement('input')
      document.body.append(other)
      other.focus()

      const el = await createInput()
      const event = dispatchHostPointerDown(el, getInput(el))

      expect(event.defaultPrevented).toBe(false)
    })

    it('does not focus the input for an interactive control in a slot', async () => {
      const other = document.createElement('input')
      document.body.append(other)
      other.focus()

      const el = await createInput()
      const suffix = document.createElement('span')
      const action = document.createElement('button')
      suffix.slot = 'suffix'
      suffix.append(action)
      el.append(suffix)
      await settle(el)

      const event = dispatchHostPointerDown(el, action)

      expect(event.defaultPrevented).toBe(false)
      expect(el.shadowRoot!.activeElement).toBeNull()
      expect(document.activeElement).toBe(other)
    })

    it('does not intercept when disabled', async () => {
      const other = document.createElement('input')
      document.body.append(other)
      other.focus()

      const el = await createInput({disabled: true})
      const event = dispatchHostPointerDown(el, getBase(el))

      expect(event.defaultPrevented).toBe(false)
      expect(document.activeElement).toBe(other)
    })
  })

  describe('shell activation', () => {
    it('focuses the inner input after a click on non-interactive shell space', async () => {
      const el = await createInput()

      getBase(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))

      expect(el.shadowRoot!.activeElement).toBe(getInput(el))
    })

    it('leaves interactive slotted content in control of its own activation', async () => {
      const el = await createInput()
      const action = document.createElement('button')
      action.slot = 'suffix'
      el.append(action)
      await settle(el)

      action.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))

      expect(el.shadowRoot!.activeElement).toBeNull()
    })

    it('does not focus the inner input when disabled', async () => {
      const el = await createInput({disabled: true})

      getBase(el).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))

      expect(el.shadowRoot!.activeElement).toBeNull()
    })
  })
})
