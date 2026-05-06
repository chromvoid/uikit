import {afterEach, describe, expect, it, vi} from 'vitest'

import {createAfterRenderScheduler} from './createAfterRenderScheduler'

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((res) => {
    resolve = res
  })
  return {promise, resolve}
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('createAfterRenderScheduler', () => {
  it('runs the task after updateComplete and the next animation frame', async () => {
    const host = {
      isConnected: true,
      updateComplete: Promise.resolve(),
    }
    const scheduler = createAfterRenderScheduler(host)
    const task = vi.fn()

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })

    scheduler.schedule(task)
    await Promise.resolve()

    expect(task).toHaveBeenCalledOnce()
  })

  it('cancels a pending task before updateComplete resolves', async () => {
    const waitForUpdate = deferred()
    const host = {
      isConnected: true,
      updateComplete: waitForUpdate.promise,
    }
    const scheduler = createAfterRenderScheduler(host)
    const task = vi.fn()

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })

    scheduler.schedule(task)
    scheduler.cancel()
    waitForUpdate.resolve()
    await Promise.resolve()

    expect(task).not.toHaveBeenCalled()
  })

  it('runs only the latest scheduled task', async () => {
    const waitForUpdate = deferred()
    const host = {
      isConnected: true,
      updateComplete: waitForUpdate.promise,
    }
    const scheduler = createAfterRenderScheduler(host)
    const firstTask = vi.fn()
    const secondTask = vi.fn()

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })

    scheduler.schedule(firstTask)
    scheduler.schedule(secondTask)
    waitForUpdate.resolve()
    await Promise.resolve()

    expect(firstTask).not.toHaveBeenCalled()
    expect(secondTask).toHaveBeenCalledOnce()
  })
})
