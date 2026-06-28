import {afterEach, describe, expect, it} from 'vitest'

import {CVProgress} from './cv-progress'

CVProgress.define()

const settle = async (element: CVProgress) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
}

const createProgress = async (attrs?: Partial<CVProgress>) => {
  const el = document.createElement('cv-progress') as CVProgress
  if (attrs) {
    Object.assign(el, attrs)
  }
  document.body.append(el)
  await settle(el)
  return el
}

const getBase = (el: CVProgress) => el.shadowRoot!.querySelector('[part="base"]') as HTMLElement

afterEach(() => {
  document.body.innerHTML = ''
})

describe('cv-progress', () => {
  // --- Shadow DOM structure ---

  describe('shadow DOM structure', () => {
    it('renders [part="base"] as a div', async () => {
      const el = await createProgress()
      const base = getBase(el)
      expect(base).not.toBeNull()
      expect(base.tagName).toBe('DIV')
    })

    it('renders [part="indicator"] as a div inside base', async () => {
      const el = await createProgress()
      const indicator = el.shadowRoot!.querySelector('[part="indicator"]') as HTMLElement
      expect(indicator).not.toBeNull()
      expect(indicator.tagName).toBe('DIV')
      expect(indicator.parentElement).toBe(getBase(el))
    })

    it('renders [part="label"] as a span outside the transformed indicator', async () => {
      const el = await createProgress()
      const label = el.shadowRoot!.querySelector('[part="label"]') as HTMLElement
      expect(label).not.toBeNull()
      expect(label.tagName).toBe('SPAN')
      const indicator = el.shadowRoot!.querySelector('[part="indicator"]') as HTMLElement
      expect(label.parentElement).toBe(getBase(el))
      expect(label.parentElement).not.toBe(indicator)
    })

    it('renders default slot inside label part', async () => {
      const el = await createProgress()
      const label = el.shadowRoot!.querySelector('[part="label"]') as HTMLElement
      expect(label).not.toBeNull()
      const slot = label.querySelector('slot:not([name])')
      expect(slot).not.toBeNull()
    })
  })

  // --- Default property values ---

  describe('default property values', () => {
    it('has correct defaults', async () => {
      const el = await createProgress()
      expect(el.value).toBe(0)
      expect(el.min).toBe(0)
      expect(el.max).toBe(100)
      expect(el.tone).toBeUndefined()
      expect(el.indeterminate).toBe(false)
    })
  })

  // --- Attribute reflection ---

  describe('attribute reflection', () => {
    it('boolean attribute reflects: indeterminate', async () => {
      const el = await createProgress({indeterminate: true})
      expect(el.hasAttribute('indeterminate')).toBe(true)
    })

    it('numeric attributes reflect: value, min, max', async () => {
      const el = await createProgress({value: 42, min: 10, max: 200})
      expect(el.getAttribute('value')).toBe('42')
      expect(el.getAttribute('min')).toBe('10')
      expect(el.getAttribute('max')).toBe('200')
    })

    it('string attribute reflects: tone', async () => {
      const el = await createProgress({tone: 'upload'})
      expect(el.getAttribute('tone')).toBe('upload')
    })
  })

  // --- ARIA ---

  describe('ARIA', () => {
    it('role="progressbar" on base', async () => {
      const el = await createProgress()
      expect(getBase(el).getAttribute('role')).toBe('progressbar')
    })

    it('aria-valuenow reflects current value in determinate mode', async () => {
      const el = await createProgress({value: 30})
      expect(getBase(el).getAttribute('aria-valuenow')).toBe('30')
    })

    it('aria-valuemin reflects min in determinate mode', async () => {
      const el = await createProgress({min: 5})
      expect(getBase(el).getAttribute('aria-valuemin')).toBe('5')
    })

    it('aria-valuemax reflects max in determinate mode', async () => {
      const el = await createProgress({max: 50})
      expect(getBase(el).getAttribute('aria-valuemax')).toBe('50')
    })

    it('aria-valuetext shows rounded percentage by default', async () => {
      const el = await createProgress({value: 33, min: 0, max: 100})
      expect(getBase(el).getAttribute('aria-valuetext')).toBe('33%')
    })

    it('aria-label is passed through to base', async () => {
      const el = await createProgress()
      el.setAttribute('aria-label', 'Upload progress')
      await settle(el)
      expect(getBase(el).getAttribute('aria-label')).toBe('Upload progress')
    })
  })

  // --- Determinate behavior ---

  describe('determinate behavior', () => {
    it('value changes update aria-valuenow', async () => {
      const el = await createProgress({value: 5, max: 20})
      expect(getBase(el).getAttribute('aria-valuenow')).toBe('5')

      el.value = 10
      await settle(el)
      expect(getBase(el).getAttribute('aria-valuenow')).toBe('10')
    })

    it('value changes update host-owned fill scale', async () => {
      const el = await createProgress({value: 5, max: 20})
      const indicator = el.shadowRoot!.querySelector('[part="indicator"]') as HTMLElement
      expect(el.style.getPropertyValue('--cv-progress-value-scale')).toBe('0.25')
      expect(indicator.getAttribute('style')).toBeNull()

      el.value = 10
      await settle(el)
      expect(el.style.getPropertyValue('--cv-progress-value-scale')).toBe('0.5')
    })

    it('renders correct percentage for custom range', async () => {
      const el = await createProgress({value: 3, min: 0, max: 10})
      expect(getBase(el).getAttribute('aria-valuetext')).toBe('30%')
      expect(el.style.getPropertyValue('--cv-progress-value-scale')).toBe('0.3')
    })
  })

  // --- Indeterminate behavior ---

  describe('indeterminate behavior', () => {
    it('omits aria-valuenow in indeterminate mode', async () => {
      const el = await createProgress({value: 50, indeterminate: true})
      expect(getBase(el).getAttribute('aria-valuenow')).toBeNull()
    })

    it('omits aria-valuemin in indeterminate mode', async () => {
      const el = await createProgress({value: 50, indeterminate: true})
      expect(getBase(el).getAttribute('aria-valuemin')).toBeNull()
    })

    it('omits aria-valuemax in indeterminate mode', async () => {
      const el = await createProgress({value: 50, indeterminate: true})
      expect(getBase(el).getAttribute('aria-valuemax')).toBeNull()
    })

    it('omits aria-valuetext in indeterminate mode', async () => {
      const el = await createProgress({value: 50, indeterminate: true})
      expect(getBase(el).getAttribute('aria-valuetext')).toBeNull()
    })

    it('sets [indeterminate] attribute on host', async () => {
      const el = await createProgress({indeterminate: true})
      expect(el.hasAttribute('indeterminate')).toBe(true)
    })

    it('switching from indeterminate to determinate restores aria attrs', async () => {
      const el = await createProgress({value: 50, indeterminate: true})
      expect(getBase(el).getAttribute('aria-valuenow')).toBeNull()

      el.indeterminate = false
      await settle(el)
      expect(getBase(el).getAttribute('aria-valuenow')).toBe('50')
      expect(getBase(el).getAttribute('aria-valuemin')).not.toBeNull()
      expect(getBase(el).getAttribute('aria-valuemax')).not.toBeNull()
    })
  })

  // --- value-text override ---

  describe('value-text override', () => {
    it('value-text attribute overrides default aria-valuetext percentage', async () => {
      const el = await createProgress({value: 3, max: 10})
      el.setAttribute('value-text', 'Step 3 of 10')
      await settle(el)
      expect(getBase(el).getAttribute('aria-valuetext')).toBe('Step 3 of 10')
    })

    it('value-text takes precedence over computed percentage', async () => {
      const el = await createProgress({value: 50, max: 100})
      el.setAttribute('value-text', 'Half done')
      await settle(el)
      // Should show the override, not "50%"
      expect(getBase(el).getAttribute('aria-valuetext')).toBe('Half done')
    })
  })

  // --- data-complete state ---

  describe('data-complete state', () => {
    it('sets [data-complete] when value >= max', async () => {
      const el = await createProgress({value: 100, min: 0, max: 100})
      expect(el.hasAttribute('data-complete')).toBe(true)
    })

    it('sets [data-complete] when value exceeds max', async () => {
      const el = await createProgress({value: 5, min: 0, max: 2})
      expect(el.hasAttribute('data-complete')).toBe(true)
    })

    it('does not set [data-complete] when value < max', async () => {
      const el = await createProgress({value: 50, max: 100})
      expect(el.hasAttribute('data-complete')).toBe(false)
    })

    it('does not set [data-complete] in indeterminate mode even if value >= max', async () => {
      const el = await createProgress({value: 100, max: 100, indeterminate: true})
      expect(el.hasAttribute('data-complete')).toBe(false)
    })

    it('dynamically adds [data-complete] when value reaches max', async () => {
      const el = await createProgress({value: 50, max: 100})
      expect(el.hasAttribute('data-complete')).toBe(false)

      el.value = 100
      await settle(el)
      expect(el.hasAttribute('data-complete')).toBe(true)
    })
  })

  // --- step attribute does NOT exist (design decision #3) ---

  describe('step attribute removed', () => {
    it('does not expose a step property', async () => {
      const el = await createProgress()
      expect('step' in el).toBe(false)
    })
  })

  // --- Value clamping and range edge cases ---

  describe('value clamping and range edge cases', () => {
    it('clamps value to min when set below min', async () => {
      const el = await createProgress({value: -10, min: 0, max: 100})
      expect(getBase(el).getAttribute('aria-valuenow')).toBe('0')
    })

    it('clamps value to max when set above max', async () => {
      const el = await createProgress({value: 250, min: 0, max: 100})
      expect(getBase(el).getAttribute('aria-valuenow')).toBe('100')
      const indicator = el.shadowRoot!.querySelector('[part="indicator"]') as HTMLElement
      expect(el.style.getPropertyValue('--cv-progress-value-scale')).toBe('1')
      expect(indicator.getAttribute('style')).toBeNull()
    })

    it('handles min === max without NaN (zero-span range)', async () => {
      const el = await createProgress({value: 5, min: 5, max: 5})
      const base = getBase(el)
      const indicator = el.shadowRoot!.querySelector('[part="indicator"]') as HTMLElement

      expect(base.getAttribute('aria-valuetext')).toBe('0%')
      expect(el.style.getPropertyValue('--cv-progress-value-scale')).toBe('0')
      expect(indicator.getAttribute('style')).toBeNull()
      // value >= max, so complete
      expect(el.hasAttribute('data-complete')).toBe(true)
    })

    it('normalizes inverted range (min > max) by swapping bounds', async () => {
      const el = await createProgress({value: 30, min: 100, max: 0})
      const base = getBase(el)
      expect(base.getAttribute('aria-valuemin')).toBe('0')
      expect(base.getAttribute('aria-valuemax')).toBe('100')
      expect(base.getAttribute('aria-valuenow')).toBe('30')
    })

    it('removing the value attribute resets to min without throwing', async () => {
      const el = await createProgress({value: 40})
      expect(getBase(el).getAttribute('aria-valuenow')).toBe('40')

      el.removeAttribute('value')
      await settle(el)
      expect(getBase(el).getAttribute('aria-valuenow')).toBe('0')
    })

    it('rounds aria-valuetext percentage while keeping precise indicator width', async () => {
      const el = await createProgress({value: 1, min: 0, max: 3})
      expect(getBase(el).getAttribute('aria-valuetext')).toBe('33%')
      expect(Number.parseFloat(el.style.getPropertyValue('--cv-progress-value-scale'))).toBeCloseTo(1 / 3)
    })
  })

  // --- Headless contract delegation ---

  describe('headless contract delegation', () => {
    it('ARIA attributes on base originate from headless getProgressProps()', async () => {
      const el = await createProgress({value: 3, min: 0, max: 10})
      const base = getBase(el)

      // These attributes should match what the headless contract produces,
      // not hardcoded values. Verify the rendered role comes from the contract.
      expect(base.getAttribute('role')).toBe('progressbar')
      expect(base.getAttribute('aria-valuenow')).toBe('3')
      expect(base.getAttribute('aria-valuemin')).toBe('0')
      expect(base.getAttribute('aria-valuemax')).toBe('10')
      expect(base.getAttribute('aria-valuetext')).toBe('30%')

      // Verify the base has an id attribute (generated by headless idBase)
      expect(base.hasAttribute('id')).toBe(true)
    })

    it('indeterminate contract omits aria value attributes from headless', async () => {
      const el = await createProgress({value: 50, indeterminate: true})
      const base = getBase(el)

      // Headless contract omits these in indeterminate mode
      expect(base.hasAttribute('aria-valuenow')).toBe(false)
      expect(base.hasAttribute('aria-valuemin')).toBe(false)
      expect(base.hasAttribute('aria-valuemax')).toBe(false)
      expect(base.hasAttribute('aria-valuetext')).toBe(false)

      // Role is always present
      expect(base.getAttribute('role')).toBe('progressbar')
    })
  })
})
