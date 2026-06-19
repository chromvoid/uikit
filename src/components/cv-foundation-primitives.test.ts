import {afterEach, describe, expect, it} from 'vitest'

import {CVButtonGroup} from './cv-button-group'
import {CVField} from './cv-field'
import {CVFieldset} from './cv-fieldset'
import {CVInput} from './cv-input'
import {CVStep} from './cv-step'
import {CVSteps, type CVStepSelectDetail} from './cv-steps'

CVButtonGroup.define()
CVField.define()
CVFieldset.define()
CVInput.define()
CVStep.define()
CVSteps.define()

const settle = async (element: {updateComplete: Promise<unknown>}) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('foundation primitives', () => {
  it('cv-field propagates required, disabled, invalid, and descriptions to the slotted control', async () => {
    const field = document.createElement('cv-field') as CVField
    field.required = true
    field.disabled = true
    field.invalid = true
    field.innerHTML = `
      <span slot="label">Code</span>
      <cv-input></cv-input>
      <span slot="description">Use the recovery code.</span>
      <span slot="error">Invalid code.</span>
    `
    document.body.append(field)
    await settle(field)

    const input = field.querySelector('cv-input') as CVInput
    expect(input.required).toBe(true)
    expect(input.disabled).toBe(true)
    expect(input.invalid).toBe(true)
    expect(input.getAttribute('aria-labelledby')).toContain('label')
    expect(input.getAttribute('aria-describedby')).toContain('description')
    expect(input.getAttribute('aria-describedby')).toContain('error')

    const nativeInput = input.shadowRoot!.querySelector('[part="input"]') as HTMLInputElement
    expect(nativeInput.getAttribute('aria-labelledby')).toContain('label')
    expect(nativeInput.getAttribute('aria-describedby')).toContain('description')
    expect(nativeInput.getAttribute('aria-describedby')).toContain('error')
  })

  it('cv-steps marks current step and emits selection events when selectable', async () => {
    const steps = document.createElement('cv-steps') as CVSteps
    steps.current = 'two'
    steps.selectable = true
    steps.innerHTML = `
      <cv-step value="one">One</cv-step>
      <cv-step value="two">Two</cv-step>
    `
    document.body.append(steps)
    await settle(steps)

    const stepOne = steps.querySelector('cv-step[value="one"]') as CVStep
    const stepTwo = steps.querySelector('cv-step[value="two"]') as CVStep
    const selections: CVStepSelectDetail[] = []
    steps.addEventListener('cv-step-select', (event) => {
      selections.push((event as CustomEvent<CVStepSelectDetail>).detail)
    })

    expect(stepTwo.status).toBe('current')
    stepOne.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settle(steps)
    expect(selections).toEqual([{value: 'one'}])
  })

  it('utility primitives render their structural parts', async () => {
    const tags = ['cv-button-group', 'cv-fieldset'] as const

    for (const tag of tags) {
      const element = document.createElement(tag)
      document.body.append(element)
      await settle(element as unknown as {updateComplete: Promise<unknown>})
      expect(element.shadowRoot).not.toBeNull()
    }
  })

  it('cv-button-group marks attached buttons by position and orientation', async () => {
    const group = document.createElement('cv-button-group') as CVButtonGroup
    group.attached = true
    group.innerHTML = `
      <cv-button>Unlock</cv-button>
      <cv-button>Lock</cv-button>
      <cv-button>Wipe</cv-button>
    `
    document.body.append(group)
    await settle(group)

    const buttons = [...group.querySelectorAll('cv-button')]
    expect(buttons.map((button) => button.getAttribute('data-cv-button-group-position'))).toEqual([
      'first',
      'middle',
      'last',
    ])
    expect(buttons.map((button) => button.getAttribute('data-cv-button-group-orientation'))).toEqual([
      'horizontal',
      'horizontal',
      'horizontal',
    ])

    group.orientation = 'vertical'
    await settle(group)
    expect(buttons.map((button) => button.getAttribute('data-cv-button-group-orientation'))).toEqual([
      'vertical',
      'vertical',
      'vertical',
    ])

    group.attached = false
    await settle(group)
    expect(buttons.every((button) => !button.hasAttribute('data-cv-button-group-position'))).toBe(true)
    expect(buttons.every((button) => !button.hasAttribute('data-cv-button-group-orientation'))).toBe(true)
  })
})
