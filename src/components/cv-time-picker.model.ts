import {action, atom, computed} from '@reatom/core'

export type CVTimePickerSource = 'input' | 'step' | 'clear'

export interface CVTimePickerStateChange {
  value: string
  inputValue: string
  invalid: boolean
  source: CVTimePickerSource
  previousValue: string
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/

export const isValidTimeValue = (value: string): boolean => value.length === 0 || TIME_RE.test(value)

export const normalizeMinuteStep = (step: number): number => {
  if (!Number.isFinite(step)) return 1
  return Math.max(1, Math.min(60, Math.floor(step)))
}

export const timeToMinutes = (value: string): number | null => {
  const match = TIME_RE.exec(value)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

export const minutesToTime = (value: number): string => {
  const normalized = ((value % 1440) + 1440) % 1440
  const hours = Math.floor(normalized / 60)
  const minutes = normalized % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

const clampMinutes = (value: number, min: string, max: string): number => {
  const minMinutes = timeToMinutes(min)
  const maxMinutes = timeToMinutes(max)
  let next = value
  if (minMinutes !== null) next = Math.max(next, minMinutes)
  if (maxMinutes !== null) next = Math.min(next, maxMinutes)
  return next
}

const snapMinutes = (value: number, step: number): number => Math.round(value / step) * step

export const createTimePickerModel = (name = 'cvTimePicker') => {
  const value = atom('', `${name}.value`)
  const inputValue = atom('', `${name}.inputValue`)
  const min = atom('', `${name}.min`)
  const max = atom('', `${name}.max`)
  const minuteStep = atom(1, `${name}.minuteStep`)
  const disabled = atom(false, `${name}.disabled`)
  const readonly = atom(false, `${name}.readonly`)
  const required = atom(false, `${name}.required`)

  const invalid = computed(() => {
    const input = inputValue().trim()
    if (input.length === 0) return false
    const minutes = timeToMinutes(input)
    if (minutes === null) return true
    const minMinutes = timeToMinutes(min())
    const maxMinutes = timeToMinutes(max())
    if (minMinutes !== null && minutes < minMinutes) return true
    if (maxMinutes !== null && minutes > maxMinutes) return true
    return false
  }, `${name}.invalid`)

  const hasValue = computed(() => value().length > 0, `${name}.hasValue`)
  const interactive = computed(() => !disabled() && !readonly(), `${name}.interactive`)

  const setConfig = action(
    (config: {
      value?: string
      min?: string
      max?: string
      minuteStep?: number
      disabled?: boolean
      readonly?: boolean
      required?: boolean
    }) => {
      if (config.min !== undefined) min.set(config.min)
      if (config.max !== undefined) max.set(config.max)
      if (config.minuteStep !== undefined) minuteStep.set(normalizeMinuteStep(config.minuteStep))
      if (config.disabled !== undefined) disabled.set(config.disabled)
      if (config.readonly !== undefined) readonly.set(config.readonly)
      if (config.required !== undefined) required.set(config.required)
      if (config.value !== undefined) {
        value.set(isValidTimeValue(config.value) ? config.value : '')
        inputValue.set(config.value)
      }
    },
    `${name}.setConfig`,
  )

  const setInput = action((nextInput: string, source: CVTimePickerSource): CVTimePickerStateChange => {
    inputValue.set(nextInput)
    return {value: value(), inputValue: inputValue(), invalid: invalid(), source, previousValue: value()}
  }, `${name}.setInput`)

  const commit = action((source: CVTimePickerSource): CVTimePickerStateChange => {
    const previousValue = value()
    const input = inputValue().trim()
    if (input.length === 0) {
      value.set('')
      inputValue.set('')
      return {value: '', inputValue: '', invalid: false, source, previousValue}
    }
    const minutes = timeToMinutes(input)
    if (minutes === null) {
      return {value: previousValue, inputValue: input, invalid: true, source, previousValue}
    }
    const snapped = snapMinutes(clampMinutes(minutes, min(), max()), minuteStep())
    const nextValue = minutesToTime(clampMinutes(snapped, min(), max()))
    value.set(nextValue)
    inputValue.set(nextValue)
    return {value: nextValue, inputValue: nextValue, invalid: invalid(), source, previousValue}
  }, `${name}.commit`)

  const step = action((direction: -1 | 1): CVTimePickerStateChange => {
    const previousValue = value()
    const base = timeToMinutes(value()) ?? timeToMinutes(inputValue()) ?? timeToMinutes(min()) ?? 0
    const nextValue = minutesToTime(clampMinutes(base + direction * minuteStep(), min(), max()))
    value.set(nextValue)
    inputValue.set(nextValue)
    return {value: nextValue, inputValue: nextValue, invalid: false, source: 'step', previousValue}
  }, `${name}.step`)

  const clear = action((): CVTimePickerStateChange => {
    const previousValue = value()
    value.set('')
    inputValue.set('')
    return {value: '', inputValue: '', invalid: false, source: 'clear', previousValue}
  }, `${name}.clear`)

  return {
    state: {
      value,
      inputValue,
      min,
      max,
      minuteStep,
      disabled,
      readonly,
      required,
      invalid,
      hasValue,
      interactive,
    },
    actions: {setConfig, setInput, commit, step, clear},
  }
}

export type CVTimePickerModel = ReturnType<typeof createTimePickerModel>
