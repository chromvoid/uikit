import {afterEach, describe, expect, it} from 'vitest'

import {hasTextEditableFocus} from './focus-utils'

afterEach(() => {
  const active = document.activeElement
  if (active instanceof HTMLElement) active.blur()
  document.body.innerHTML = ''
})

describe('focus-utils', () => {
  describe('hasTextEditableFocus', () => {
    it('returns false when nothing is focused', () => {
      expect(hasTextEditableFocus()).toBe(false)
    })

    it('returns true for a focused text input', () => {
      const input = document.createElement('input')
      document.body.append(input)
      input.focus()
      expect(hasTextEditableFocus()).toBe(true)
    })

    it('returns true for a focused textarea', () => {
      const textarea = document.createElement('textarea')
      document.body.append(textarea)
      textarea.focus()
      expect(hasTextEditableFocus()).toBe(true)
    })

    it('returns false for a focused button', () => {
      const button = document.createElement('button')
      document.body.append(button)
      button.focus()
      expect(hasTextEditableFocus()).toBe(false)
    })

    it('returns false for a focused select', () => {
      const select = document.createElement('select')
      document.body.append(select)
      select.focus()
      expect(hasTextEditableFocus()).toBe(false)
    })

    it('returns false for a focused link', () => {
      const link = document.createElement('a')
      link.href = '#'
      document.body.append(link)
      link.focus()
      expect(hasTextEditableFocus()).toBe(false)
    })

    it('returns true for a contenteditable element', () => {
      const div = document.createElement('div')
      div.tabIndex = 0
      // jsdom does not implement isContentEditable; shim it on the instance
      Object.defineProperty(div, 'isContentEditable', {value: true})
      document.body.append(div)
      div.focus()
      expect(hasTextEditableFocus()).toBe(true)
    })

    it('pierces a shadow root to find a focused input', () => {
      const host = document.createElement('div')
      document.body.append(host)
      const shadow = host.attachShadow({mode: 'open'})
      const input = document.createElement('input')
      shadow.append(input)
      input.focus()
      expect(document.activeElement).toBe(host)
      expect(hasTextEditableFocus()).toBe(true)
    })

    it('pierces nested shadow roots to find a focused textarea', () => {
      const outer = document.createElement('div')
      document.body.append(outer)
      const outerShadow = outer.attachShadow({mode: 'open'})
      const inner = document.createElement('div')
      outerShadow.append(inner)
      const innerShadow = inner.attachShadow({mode: 'open'})
      const textarea = document.createElement('textarea')
      innerShadow.append(textarea)
      textarea.focus()
      expect(hasTextEditableFocus()).toBe(true)
    })

    it('returns false for a non-editable element inside a shadow root', () => {
      const host = document.createElement('div')
      document.body.append(host)
      const shadow = host.attachShadow({mode: 'open'})
      const button = document.createElement('button')
      shadow.append(button)
      button.focus()
      expect(hasTextEditableFocus()).toBe(false)
    })

    // ── regression: only text-like, non-readonly, non-disabled inputs count ──

    it.each(['checkbox', 'radio', 'range', 'file', 'color', 'button', 'submit', 'reset', 'image'])(
      'returns false for a focused %s input (non-text type)',
      (type) => {
        const input = document.createElement('input')
        input.type = type
        document.body.append(input)
        input.focus()
        expect(hasTextEditableFocus()).toBe(false)
      },
    )

    it.each(['text', 'search', 'url', 'tel', 'email', 'password', 'number'])(
      'returns true for a focused %s input (text-like type)',
      (type) => {
        const input = document.createElement('input')
        input.type = type
        document.body.append(input)
        input.focus()
        expect(hasTextEditableFocus()).toBe(true)
      },
    )

    it('returns false for a focused readonly text input', () => {
      const input = document.createElement('input')
      input.type = 'text'
      input.readOnly = true
      document.body.append(input)
      input.focus()
      expect(hasTextEditableFocus()).toBe(false)
    })

    it('returns false for a focused disabled text input', () => {
      const input = document.createElement('input')
      input.type = 'text'
      input.disabled = true
      document.body.append(input)
      input.focus()
      // a disabled input cannot truly be focused, but guard regardless
      expect(hasTextEditableFocus()).toBe(false)
    })

    it('returns false for a focused readonly textarea', () => {
      const textarea = document.createElement('textarea')
      textarea.readOnly = true
      document.body.append(textarea)
      textarea.focus()
      expect(hasTextEditableFocus()).toBe(false)
    })

    it('returns true for an input with no explicit type (defaults to text)', () => {
      const input = document.createElement('input')
      document.body.append(input)
      input.focus()
      expect(hasTextEditableFocus()).toBe(true)
    })

    it('returns false for a focused checkbox inside a shadow root', () => {
      const host = document.createElement('div')
      document.body.append(host)
      const shadow = host.attachShadow({mode: 'open'})
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      shadow.append(checkbox)
      checkbox.focus()
      expect(hasTextEditableFocus()).toBe(false)
    })

    it('returns false again after the focused field is blurred', () => {
      const input = document.createElement('input')
      document.body.append(input)
      input.focus()
      expect(hasTextEditableFocus()).toBe(true)
      input.blur()
      expect(hasTextEditableFocus()).toBe(false)
    })
  })
})
