type MockElementInternals = {
  validity?: ValidityStateFlags
  validationMessage?: string
  setFormValue?: (...args: unknown[]) => void
  setValidity?: (flags?: ValidityStateFlags, message?: string) => void
  checkValidity?: () => boolean
  reportValidity?: () => boolean
  form?: HTMLFormElement | null
  labels?: HTMLLabelElement[]
  willValidate?: boolean
  states?: Set<string>
}

type AttachInternalsFn = (...args: unknown[]) => MockElementInternals | null

const htmlElementPrototype = HTMLElement.prototype as typeof HTMLElement.prototype & {
  attachInternals?: AttachInternalsFn
}

const originalAttachInternals = htmlElementPrototype.attachInternals

Object.defineProperty(HTMLElement.prototype, 'attachInternals', {
  configurable: true,
  value: function (...args: unknown[]) {
    const host = this as HTMLElement
    const internals: MockElementInternals =
      (originalAttachInternals ? originalAttachInternals.apply(host, args) : null) ?? {}

    let validityFlags = internals.validity ?? {}
    let validationMessage = internals.validationMessage ?? ''

    if (typeof internals.setFormValue !== 'function') {
      internals.setFormValue = () => {}
    }

    if (typeof internals.setValidity !== 'function') {
      internals.setValidity = (flags: ValidityStateFlags = {}, message = '') => {
        validityFlags = flags
        validationMessage = message
        internals.validity = flags
        internals.validationMessage = message
      }
    }

    if (typeof internals.checkValidity !== 'function') {
      internals.checkValidity = () => !Object.values(validityFlags).some(Boolean)
    }

    if (typeof internals.reportValidity !== 'function') {
      internals.reportValidity = () => !Object.values(validityFlags).some(Boolean)
    }

    if (!('form' in internals)) {
      Object.defineProperty(internals, 'form', {
        configurable: true,
        enumerable: true,
        get() {
          const explicitTarget = host.getAttribute('form')
          if (explicitTarget) {
            const owner = host.ownerDocument?.getElementById(explicitTarget)
            return owner instanceof HTMLFormElement ? owner : null
          }

          return host.closest('form')
        },
      })
    }

    if (!('labels' in internals)) internals.labels = []
    if (!('validity' in internals)) internals.validity = validityFlags
    if (!('validationMessage' in internals)) internals.validationMessage = validationMessage
    if (!('willValidate' in internals)) internals.willValidate = true
    if (!('states' in internals)) internals.states = new Set<string>()

    return internals
  },
})
