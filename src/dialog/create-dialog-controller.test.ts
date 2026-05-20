import {html} from 'lit'
import {afterEach, describe, expect, it, vi} from 'vitest'

import type {CVDialog} from '../components/cv-dialog'
import {createDialogController, type ManagedDialogSurfaceElement} from './create-dialog-controller'

const settleDialog = async (dialog: CVDialog) => {
  await dialog.updateComplete
  await Promise.resolve()
  await dialog.updateComplete
}

class TestManagedSurface extends HTMLElement implements ManagedDialogSurfaceElement {
  open = false
  noHeader = false
  closable = true
  closeOnEscape = true
  closeOnOutsidePointer = true
  closeOnOutsideFocus = true
  updateComplete = Promise.resolve(true)
}

if (!customElements.get('test-managed-surface')) {
  customElements.define('test-managed-surface', TestManagedSurface)
}

afterEach(() => {
  document.body.innerHTML = ''
  document.body.style.overflow = ''
})

describe('createDialogController', () => {
  it('present mounts the element, resolves the result, removes it, and restores focus', async () => {
    const controller = createDialogController()
    const restoreTarget = document.createElement('button')
    restoreTarget.textContent = 'Restore target'
    document.body.append(restoreTarget)
    restoreTarget.focus()

    const element = document.createElement('div')

    const result = await controller.present({
      element,
      title: 'Managed dialog',
      show: async () => {
        expect(document.body.contains(element)).toBe(true)
        element.dispatchEvent(new Event('cv-after-show', {bubbles: true}))
        return 'done'
      },
      close: () => {},
    })

    expect(result).toBe('done')
    expect(document.body.contains(element)).toBe(false)
    expect(document.activeElement).toBe(restoreTarget)
  })

  it('present uses optional adapters on open and cleanup', async () => {
    const announceCalls: Array<[string, 'polite' | 'assertive' | undefined]> = []
    const inertTargets: HTMLElement[] = []
    let restoreCount = 0

    const controller = createDialogController({
      announce: (message, priority) => announceCalls.push([message, priority]),
      setInertExcept: (element) => inertTargets.push(element),
      restoreInert: () => {
        restoreCount += 1
      },
    })

    const element = document.createElement('div')

    await controller.present({
      element,
      title: 'Adapter dialog',
      show: async () => {
        element.dispatchEvent(new Event('cv-after-show', {bubbles: true}))
        return 'ok'
      },
      close: () => {},
    })

    expect(announceCalls).toEqual([['Adapter dialog', 'assertive']])
    expect(inertTargets).toEqual([element])
    expect(restoreCount).toBe(1)
  })

  it('present focuses the first focusable element after opening', async () => {
    const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')
    const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')

    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get() {
        return 10
      },
    })
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get() {
        return 10
      },
    })

    const controller = createDialogController()
    const element = document.createElement('div')
    const button = document.createElement('button')
    button.textContent = 'Focusable'
    const focusSpy = vi.fn()
    button.focus = focusSpy
    element.append(button)

    let resolveShow: ((value: string) => void) | undefined

    try {
      const resultPromise = controller.present({
        element,
        title: 'Managed focus dialog',
        show: () =>
          new Promise<string>((resolve) => {
            resolveShow = resolve
            element.dispatchEvent(new Event('cv-after-show', {bubbles: true}))
          }),
        close: () => {},
      })

      await new Promise((resolve) => window.setTimeout(resolve, 70))

      expect(focusSpy).toHaveBeenCalledTimes(1)

      resolveShow?.('done')
      await expect(resultPromise).resolves.toBe('done')
    } finally {
      if (originalOffsetWidth) {
        Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalOffsetWidth)
      }
      if (originalOffsetHeight) {
        Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight)
      }
    }
  })

  it('present skips managed focus when autoFocus is false', async () => {
    const controller = createDialogController()
    const element = document.createElement('div')
    const button = document.createElement('button')
    button.textContent = 'Focusable'
    const focusSpy = vi.fn()
    button.focus = focusSpy
    element.append(button)

    let resolveShow: ((value: string) => void) | undefined

    const resultPromise = controller.present({
      element,
      title: 'Manual focus dialog',
      autoFocus: false,
      show: () =>
        new Promise<string>((resolve) => {
          resolveShow = resolve
          element.dispatchEvent(new Event('cv-after-show', {bubbles: true}))
        }),
      close: () => {},
    })

    await new Promise((resolve) => window.setTimeout(resolve, 70))

    expect(focusSpy).not.toHaveBeenCalled()

    resolveShow?.('done')
    await expect(resultPromise).resolves.toBe('done')
  })

  it('showCustom resolves the provided result', async () => {
    const controller = createDialogController()
    let dialogRef: CVDialog | null = null
    let resolveDialog: ((value: string | null) => void) | undefined

    const resultPromise = controller.showCustom<string>(
      {
        title: 'Custom dialog',
        content: html`
          <button id="inside-button">Inside</button>
        `,
        footer: html`
          <button id="inside-action">Action</button>
        `,
      },
      (dialog, resolve) => {
        dialogRef = dialog as CVDialog
        resolveDialog = resolve
      },
    )

    expect(dialogRef).not.toBeNull()
    await settleDialog(dialogRef!)
    resolveDialog?.('confirmed')

    await expect(resultPromise).resolves.toBe('confirmed')
  })

  it('showCustom resolves null on dismiss', async () => {
    const controller = createDialogController()
    let dialogRef: CVDialog | null = null

    const resultPromise = controller.showCustom<string>(
      {
        title: 'Dismiss dialog',
        content: html`
          <button id="dismiss-button">Dismiss</button>
        `,
      },
      (dialog) => {
        dialogRef = dialog as CVDialog
      },
    )

    expect(dialogRef).not.toBeNull()
    await settleDialog(dialogRef!)

    const headerClose = dialogRef!.shadowRoot!.querySelector('[part="header-close"]') as HTMLElement
    headerClose.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))

    await expect(resultPromise).resolves.toBeNull()
  })

  it('showCustom cleans up if resolved before the dialog opens', async () => {
    const controller = createDialogController()

    const resultPromise = controller.showCustom<string>(
      {
        title: 'Immediate dialog',
        content: html`
          <span>Immediate</span>
        `,
      },
      (_dialog, resolve) => {
        resolve('instant')
      },
    )

    await expect(resultPromise).resolves.toBe('instant')
    await Promise.resolve()
    await new Promise((resolve) => window.setTimeout(resolve, 0))

    expect(document.querySelector('cv-dialog')).toBeNull()
    expect(controller.getActiveCount()).toBe(0)
  })

  it('showCustom keeps cv-dialog as the default managed surface', async () => {
    const controller = createDialogController()
    let dialogRef: HTMLElement | undefined
    let resolveDialog: ((value: string | null) => void) | undefined

    const resultPromise = controller.showCustom<string>(
      {
        title: 'Default surface',
        content: 'Body',
      },
      (dialog, resolve) => {
        dialogRef = dialog
        resolveDialog = resolve
      },
    )

    const dialog = dialogRef!
    expect(dialog.tagName.toLowerCase()).toBe('cv-dialog')
    resolveDialog?.('done')
    await expect(resultPromise).resolves.toBe('done')
  })

  it('showCustom can mount an adapter-created managed surface', async () => {
    const createCustomDialogElement = vi.fn(
      () => document.createElement('test-managed-surface') as ManagedDialogSurfaceElement,
    )
    const controller = createDialogController({createCustomDialogElement})
    let dialogRef: ManagedDialogSurfaceElement | undefined
    let resolveDialog: ((value: string | null) => void) | undefined

    const resultPromise = controller.showCustom<string>(
      {
        title: 'Factory surface',
        content: 'Body',
        size: 'l',
        closable: false,
        noHeader: true,
      },
      (dialog, resolve) => {
        dialogRef = dialog as ManagedDialogSurfaceElement
        resolveDialog = resolve
      },
    )

    expect(createCustomDialogElement).toHaveBeenCalledTimes(1)
    const dialog = dialogRef!
    expect(dialog.tagName.toLowerCase()).toBe('test-managed-surface')
    expect(dialog.classList.contains('cv-managed-dialog')).toBe(true)
    expect(dialog.noHeader).toBe(true)
    expect(dialog.closable).toBe(false)
    expect(dialog.closeOnEscape).toBe(false)
    expect(dialog.closeOnOutsidePointer).toBe(false)
    expect(dialog.closeOnOutsideFocus).toBe(false)
    expect(dialog.style.getPropertyValue('--cv-dialog-width')).toBe('640px')
    expect(dialog.style.getPropertyValue('--adaptive-modal-width')).toBe('640px')
    expect(dialog.style.getPropertyValue('--adaptive-modal-z-index')).toBe('1100')
    expect(dialog.style.getPropertyValue('--cv-bottom-sheet-z-index')).toBe('1100')

    resolveDialog?.('done')
    await expect(resultPromise).resolves.toBe('done')
  })

  it('showCustom focuses the first focusable element using the built-in finder', async () => {
    const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')
    const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')

    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get() {
        return 10
      },
    })
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get() {
        return 10
      },
    })

    const controller = createDialogController()
    let dialogRef: CVDialog | null = null
    let resolveDialog: ((value: string | null) => void) | undefined

    try {
      const resultPromise = controller.showCustom<string>(
        {
          title: 'Focus dialog',
          content: html`
            <button id="focus-target">Focusable</button>
          `,
        },
        (dialog, resolve) => {
          dialogRef = dialog as CVDialog
          resolveDialog = resolve
        },
      )

      expect(dialogRef).not.toBeNull()
      const afterShow = new Promise((resolve) => {
        dialogRef!.addEventListener('cv-after-show', resolve, {once: true})
      })

      const focusTarget = dialogRef!.querySelector('#focus-target') as HTMLButtonElement
      const focusSpy = vi.fn()
      focusTarget.focus = focusSpy

      await afterShow
      await new Promise((resolve) => window.setTimeout(resolve, 70))

      expect(focusSpy).toHaveBeenCalledTimes(1)

      resolveDialog?.('done')
      await expect(resultPromise).resolves.toBe('done')
    } finally {
      if (originalOffsetWidth) {
        Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalOffsetWidth)
      }
      if (originalOffsetHeight) {
        Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight)
      }
    }
  })

  it('assigns monotonically increasing z-index values while multiple dialogs are active', async () => {
    const controller = createDialogController()
    const first = document.createElement('div')
    const second = document.createElement('div')

    let resolveFirst: ((value: string) => void) | undefined
    let resolveSecond: ((value: string) => void) | undefined

    const firstPromise = controller.present({
      element: first,
      title: 'First',
      show: () =>
        new Promise<string>((resolve) => {
          resolveFirst = resolve
          first.dispatchEvent(new Event('cv-after-show', {bubbles: true}))
        }),
      close: () => {},
    })

    const secondPromise = controller.present({
      element: second,
      title: 'Second',
      show: () =>
        new Promise<string>((resolve) => {
          resolveSecond = resolve
          second.dispatchEvent(new Event('cv-after-show', {bubbles: true}))
        }),
      close: () => {},
    })

    const firstZIndex = Number(first.style.getPropertyValue('--cv-dialog-z-index'))
    const secondZIndex = Number(second.style.getPropertyValue('--cv-dialog-z-index'))

    expect(secondZIndex).toBeGreaterThan(firstZIndex)
    expect(first.style.getPropertyValue('--adaptive-modal-z-index')).toBe(String(firstZIndex))
    expect(second.style.getPropertyValue('--cv-bottom-sheet-z-index')).toBe(String(secondZIndex))
    expect(controller.getActiveCount()).toBe(2)

    resolveFirst?.('first')
    resolveSecond?.('second')
    await Promise.all([firstPromise, secondPromise])
  })
})
