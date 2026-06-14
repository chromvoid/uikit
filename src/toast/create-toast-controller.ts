import {
  createToast,
  type CreateToastOptions,
  type ToastModel,
  type ToastItem,
} from '@chromvoid/headless-ui/toast'

export interface CVToastController {
  readonly model: ToastModel
  push(item: Omit<ToastItem, 'id'> & {id?: string}): string
  dismiss(id: string): void
  clear(): void
  pause(): void
  resume(): void
  /** Updates the max number of visible toasts in place (live toasts/timers preserved). */
  setMaxVisible(value: number): void
}

export function createToastController(options: CreateToastOptions = {}): CVToastController {
  const model = createToast(options)

  return {
    model,
    push: (item) => model.actions.push(item),
    dismiss: (id) => model.actions.dismiss(id),
    clear: () => model.actions.clear(),
    pause: () => model.actions.pause(),
    resume: () => model.actions.resume(),
    setMaxVisible: (value) => model.actions.setMaxVisible(value),
  }
}
