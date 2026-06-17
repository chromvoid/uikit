import {afterEach, describe, expect, it} from 'vitest'

import type {CVChip} from './cv-chip'
import {CVChipGroup, type CVChipGroupInputDetail} from './cv-chip-group'
import {createChipGroupModel, parseChipValues, serializeChipValues} from './cv-chip-group.model'

CVChipGroup.define()

const settleChip = async (element: CVChip) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
}

const settleGroup = async (element: CVChipGroup) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
  await Promise.all(Array.from(element.querySelectorAll('cv-chip')).map((chip) => settleChip(chip as CVChip)))
}

const createChip = (value: string, text = value, attrs?: Partial<CVChip>) => {
  const chip = document.createElement('cv-chip') as CVChip
  chip.value = value
  chip.textContent = text
  if (attrs) Object.assign(chip, attrs)
  return chip
}

const createGroup = async (attrs?: Partial<CVChipGroup>, chips: CVChip[] = []) => {
  const group = document.createElement('cv-chip-group') as CVChipGroup
  if (attrs) Object.assign(group, attrs)
  group.append(...chips)
  document.body.append(group)
  await settleGroup(group)
  return group
}

const getBase = (chip: CVChip) => chip.shadowRoot!.querySelector('[part="base"]') as HTMLElement
const getRemoveButton = (chip: CVChip) =>
  chip.shadowRoot!.querySelector('[part="remove-button"]') as HTMLButtonElement

afterEach(() => {
  document.body.innerHTML = ''
})

describe('cv-chip-group model', () => {
  it('serializes and parses simple multiple values', () => {
    expect(parseChipValues('alpha  beta')).toEqual(['alpha', 'beta'])
    expect(serializeChipValues(['alpha', 'beta'])).toBe('alpha beta')
  })

  it('guards missing and disabled records', () => {
    const model = createChipGroupModel('testChipGroup')
    model.actions.setRecords([
      {value: 'alpha', disabled: false},
      {value: 'beta', disabled: true},
    ])
    model.actions.setSelectionMode('multiple')

    expect(model.actions.toggle('')).toBeNull()
    expect(model.actions.toggle('missing')).toBeNull()
    expect(model.actions.toggle('beta')).toBeNull()
    expect(model.actions.toggle('alpha')?.value).toEqual(['alpha'])
  })
})

describe('cv-chip-group', () => {
  it('commits single selection and emits input/change details', async () => {
    const alpha = createChip('alpha')
    const beta = createChip('beta')
    const group = await createGroup({selectionMode: 'single'}, [alpha, beta])
    const inputDetails: CVChipGroupInputDetail[] = []
    const changeDetails: CVChipGroupInputDetail[] = []
    group.addEventListener('cv-input', (event) => {
      inputDetails.push((event as CustomEvent<CVChipGroupInputDetail>).detail)
    })
    group.addEventListener('cv-change', (event) => {
      changeDetails.push((event as CustomEvent<CVChipGroupInputDetail>).detail)
    })

    getBase(alpha).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settleGroup(group)

    expect(group.value).toBe('alpha')
    expect(alpha.selected).toBe(true)
    expect(inputDetails).toEqual([{value: 'alpha', changedValue: 'alpha', selected: true, source: 'click'}])
    expect(changeDetails).toEqual(inputDetails)
  })

  it('commits multiple selection and serializes selected values', async () => {
    const alpha = createChip('alpha')
    const beta = createChip('beta')
    const group = await createGroup({selectionMode: 'multiple'}, [alpha, beta])

    getBase(alpha).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    getBase(beta).dispatchEvent(new KeyboardEvent('keydown', {key: ' ', bubbles: true}))
    await settleGroup(group)

    expect(group.value).toBe('alpha beta')
    expect([alpha.selected, beta.selected]).toEqual([true, true])
  })

  it('ignores selection in none mode and when group is disabled', async () => {
    const chip = createChip('alpha')
    const group = await createGroup({selectionMode: 'none'}, [chip])
    let inputCount = 0
    group.addEventListener('cv-input', () => inputCount++)

    getBase(chip).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settleGroup(group)
    expect(group.value).toBe('')

    group.selectionMode = 'single'
    group.disabled = true
    await settleGroup(group)
    getBase(chip).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settleGroup(group)

    expect(inputCount).toBe(0)
    expect(group.value).toBe('')
    expect(chip.disabled).toBe(true)
  })

  it('removes a selected removable chip through group selection events', async () => {
    const chip = createChip('alpha', 'Alpha', {removable: true})
    const group = await createGroup({selectionMode: 'single', value: 'alpha'}, [chip])
    const inputDetails: CVChipGroupInputDetail[] = []
    group.addEventListener('cv-input', (event) => {
      inputDetails.push((event as CustomEvent<CVChipGroupInputDetail>).detail)
    })

    getRemoveButton(chip).dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
    await settleGroup(group)

    expect(group.value).toBe('')
    expect(chip.selected).toBe(false)
    expect(inputDetails).toEqual([{value: '', changedValue: 'alpha', selected: false, source: 'click'}])
  })

  it('moves roving focus with arrow keys', async () => {
    const alpha = createChip('alpha')
    const beta = createChip('beta')
    const group = await createGroup({selectionMode: 'single'}, [alpha, beta])

    group
      .shadowRoot!.querySelector('[part="base"]')!
      .dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight', bubbles: true}))

    expect(beta.shadowRoot!.activeElement).toBe(getBase(beta))
  })
})
