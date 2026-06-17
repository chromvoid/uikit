import {action, atom, computed} from '@reatom/core'

export type CVChipSelectionMode = 'none' | 'single' | 'multiple'
export type CVChipGroupOrientation = 'horizontal' | 'vertical'

export interface CVChipRecord {
  value: string
  disabled: boolean
}

export interface CVChipGroupInputDetail {
  value: string | readonly string[]
  changedValue: string
  selected: boolean
  source: 'click' | 'keyboard'
}

export const serializeChipValues = (values: readonly string[]): string => values.filter(Boolean).join(' ')

export const parseChipValues = (value: string): readonly string[] =>
  value
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)

export const createChipGroupModel = (name = 'cvChipGroup') => {
  const records = atom<readonly CVChipRecord[]>([], `${name}.records`)
  const selectionMode = atom<CVChipSelectionMode>('none', `${name}.selectionMode`)
  const selectedValues = atom<readonly string[]>([], `${name}.selectedValues`)
  const activeIndex = atom(0, `${name}.activeIndex`)
  const disabled = atom(false, `${name}.disabled`)

  const enabledRecords = computed(
    () => records().filter((record) => record.value.length > 0 && !record.disabled),
    `${name}.enabledRecords`,
  )

  const value = computed(() => {
    if (selectionMode() === 'multiple') return selectedValues()
    return selectedValues()[0] ?? ''
  }, `${name}.value`)

  const isSelected = (chipValue: string): boolean => selectedValues().includes(chipValue)

  const setRecords = action((nextRecords: readonly CVChipRecord[]) => {
    records.set(nextRecords)
    const allowed = new Set(nextRecords.map((record) => record.value).filter(Boolean))
    selectedValues.set(selectedValues().filter((selected) => allowed.has(selected)))
    const maxIndex = Math.max(0, nextRecords.length - 1)
    activeIndex.set(Math.min(activeIndex(), maxIndex))
  }, `${name}.setRecords`)

  const setSelectionMode = action((mode: CVChipSelectionMode) => {
    selectionMode.set(mode)
    if (mode === 'none') {
      selectedValues.set([])
      return
    }
    if (mode === 'single') {
      selectedValues.set(selectedValues().slice(0, 1))
    }
  }, `${name}.setSelectionMode`)

  const setDisabled = action((nextDisabled: boolean) => {
    disabled.set(nextDisabled)
  }, `${name}.setDisabled`)

  const setValue = action((nextValue: string | readonly string[]) => {
    if (selectionMode() === 'none') {
      selectedValues.set([])
      return
    }

    const values = typeof nextValue === 'string' ? parseChipValues(nextValue) : nextValue
    const allowed = new Set(
      records()
        .map((record) => record.value)
        .filter(Boolean),
    )
    const filtered = values.filter((item) => allowed.has(item))
    selectedValues.set(selectionMode() === 'single' ? filtered.slice(0, 1) : filtered)
  }, `${name}.setValue`)

  const toggle = action((chipValue: string): CVChipGroupInputDetail | null => {
    if (disabled() || selectionMode() === 'none' || !chipValue) return null
    const record = records().find((item) => item.value === chipValue)
    if (!record || record.disabled) return null

    if (selectionMode() === 'single') {
      const selected = selectedValues()[0] !== chipValue
      selectedValues.set(selected ? [chipValue] : [])
      return {value: value(), changedValue: chipValue, selected, source: 'click'}
    }

    const current = selectedValues()
    const selected = !current.includes(chipValue)
    selectedValues.set(selected ? [...current, chipValue] : current.filter((item) => item !== chipValue))
    return {value: value(), changedValue: chipValue, selected, source: 'click'}
  }, `${name}.toggle`)

  const moveActive = action((direction: -1 | 1 | 'first' | 'last'): number => {
    const currentRecords = records()
    if (currentRecords.length === 0) {
      activeIndex.set(0)
      return 0
    }
    if (direction === 'first') {
      activeIndex.set(0)
      return 0
    }
    if (direction === 'last') {
      activeIndex.set(currentRecords.length - 1)
      return currentRecords.length - 1
    }
    const next = (activeIndex() + direction + currentRecords.length) % currentRecords.length
    activeIndex.set(next)
    return next
  }, `${name}.moveActive`)

  return {
    state: {
      records,
      selectionMode,
      selectedValues,
      activeIndex,
      disabled,
      enabledRecords,
      value,
      isSelected,
    },
    actions: {
      setRecords,
      setSelectionMode,
      setDisabled,
      setValue,
      toggle,
      moveActive,
    },
  }
}

export type CVChipGroupModel = ReturnType<typeof createChipGroupModel>
