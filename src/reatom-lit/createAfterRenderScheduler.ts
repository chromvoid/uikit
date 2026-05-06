interface AfterRenderHost {
  readonly isConnected: boolean
  readonly updateComplete: Promise<unknown>
}

export interface AfterRenderScheduler {
  cancel(): void
  schedule(task: () => void): void
}

export function createAfterRenderScheduler(host: AfterRenderHost): AfterRenderScheduler {
  let frame = 0
  let runId = 0

  const clearFrame = () => {
    if (!frame) {
      return
    }

    window.cancelAnimationFrame(frame)
    frame = 0
  }

  return {
    cancel() {
      runId += 1
      clearFrame()
    },

    schedule(task) {
      const currentRunId = ++runId
      clearFrame()

      void host.updateComplete.then(() => {
        if (!host.isConnected || currentRunId !== runId) {
          return
        }

        frame = window.requestAnimationFrame(() => {
          frame = 0

          if (!host.isConnected || currentRunId !== runId) {
            return
          }

          task()
        })
      })
    },
  }
}
