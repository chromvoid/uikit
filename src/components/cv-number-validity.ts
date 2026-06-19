interface CVNumberValidityOptions {
  customValidityMessage: string
  invalid: boolean
  required: boolean
  value: number
  min: number | undefined
  max: number | undefined
  step: number
}

const EPSILON = 1e-9

export function getNumberValidityState(options: CVNumberValidityOptions): {
  flags: ValidityStateFlags
  message: string
} {
  const {customValidityMessage, invalid, required, value, min, max} = options
  const step = Number.isFinite(options.step) && options.step > 0 ? options.step : 1
  const anchor = min ?? 0
  const flags: ValidityStateFlags = {}

  if (customValidityMessage || invalid) flags.customError = true
  if (required && !Number.isFinite(value)) flags.valueMissing = true
  if (min != null && value < min - EPSILON) flags.rangeUnderflow = true
  if (max != null && value > max + EPSILON) flags.rangeOverflow = true

  const offset = (value - anchor) / step
  if (Math.abs(offset - Math.round(offset)) > EPSILON) flags.stepMismatch = true

  if (customValidityMessage) return {flags, message: customValidityMessage}
  if (invalid) return {flags, message: 'Invalid value'}
  if (flags.valueMissing) return {flags, message: 'Please fill out this field.'}
  if (flags.rangeUnderflow) return {flags, message: `Value must be greater than or equal to ${min}.`}
  if (flags.rangeOverflow) return {flags, message: `Value must be less than or equal to ${max}.`}
  if (flags.stepMismatch) return {flags, message: `Value must align with step ${step}.`}

  return {flags, message: ''}
}

export function hasNumberValidityErrors(flags: ValidityStateFlags): boolean {
  return (
    flags.customError === true ||
    flags.valueMissing === true ||
    flags.rangeUnderflow === true ||
    flags.rangeOverflow === true ||
    flags.stepMismatch === true
  )
}
