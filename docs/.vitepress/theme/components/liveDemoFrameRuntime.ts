import {setUnoUtilities} from '@chromvoid/uikit/reatom-lit'
import {registerUikit} from '@chromvoid/uikit/register'
import {unoUtilities} from '@chromvoid/uikit/styles/uno-utilities'

import '@chromvoid/uikit/theme/tokens.css'

setUnoUtilities(unoUtilities)
registerUikit()

function installFrameReset(): void {
  const style = document.createElement('style')
  style.textContent = `
    html,
    body {
      min-block-size: 100%;
      margin: 0;
      background: #070d16;
      color: #eef5ff;
      font-family:
        Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    body {
      overflow: hidden;
    }

    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }
  `
  document.head.append(style)
}

function readPayload(): string {
  const payload = document.getElementById('live-demo-payload')
  if (!payload?.textContent) return ''

  try {
    return JSON.parse(payload.textContent) as string
  } catch (error) {
    console.error('Live demo iframe payload failed to parse', error)
    return ''
  }
}

function runDemoScript(script: HTMLScriptElement): void {
  const source = script.textContent ?? ''
  if (!source.trim()) return

  if (script.type === 'module') {
    const executable = document.createElement('script')
    executable.type = 'module'
    executable.textContent = source
    document.body.append(executable)
    return
  }

  try {
    new Function(source)()
  } catch (error) {
    console.error('Live demo iframe script failed', error)
  }
}

function mountDemo(): void {
  const raw = readPayload()
  if (!raw.trim()) return

  const template = document.createElement('template')
  template.innerHTML = raw
  const scripts = [...template.content.querySelectorAll('script')]
  scripts.forEach((script) => script.remove())

  document.body.replaceChildren(template.content.cloneNode(true))
  scripts.forEach(runDemoScript)
}

installFrameReset()
mountDemo()
