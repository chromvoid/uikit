import '../../../src/theme/tokens.css'
import {registerUikit} from '../../../src/register'
import {visualCaseById} from '../component-visual-cases'

registerUikit()

async function waitForDefinedElements(root: ParentNode): Promise<void> {
  const names = Array.from(root.querySelectorAll('*'))
    .map((element) => element.localName)
    .filter((name) => name.startsWith('cv-'))
  await Promise.all(Array.from(new Set(names)).map((name) => customElements.whenDefined(name)))
}

async function mountCase(): Promise<void> {
  const params = new URLSearchParams(window.location.search)
  const caseId = params.get('case')
  const theme = params.get('theme') === 'light' ? 'light' : 'dark'
  const provider = document.querySelector('#uikit-visual-provider')
  const stage = document.querySelector('#uikit-visual-stage')

  if (!(provider instanceof HTMLElement) || !(stage instanceof HTMLElement)) {
    throw new Error('UIKit visual harness root is missing.')
  }

  provider.setAttribute('mode', theme)
  document.body.dataset.theme = theme

  if (!caseId) {
    throw new Error('UIKit visual harness requires ?case=<id>.')
  }

  const visualCase = visualCaseById.get(caseId)
  if (!visualCase) {
    throw new Error(`Unknown UIKit visual case: ${caseId}`)
  }

  await visualCase.mount(stage)
  await waitForDefinedElements(stage)

  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

  if (stage.childElementCount === 0 && !stage.textContent?.trim()) {
    throw new Error(`UIKit visual case rendered an empty stage: ${caseId}`)
  }

  document.documentElement.dataset.visualReady = '1'
}

void mountCase().catch((error) => {
  document.documentElement.dataset.visualReady = 'error'
  const message = document.createElement('pre')
  message.textContent = error instanceof Error ? error.stack ?? error.message : String(error)
  document.body.append(message)
  throw error
})
