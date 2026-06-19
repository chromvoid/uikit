import {
  UIKIT_VISUAL_DEFAULT_VIEWPORTS,
  UIKIT_VISUAL_THEMES,
  type UikitVisualCase,
} from '../component-visual-types'

type VisualCaseConfig = Omit<
  UikitVisualCase,
  'mount' | 'themes' | 'tier' | 'viewports'
> & {
  html: string
  tier?: UikitVisualCase['tier']
  themes?: UikitVisualCase['themes']
  viewports?: UikitVisualCase['viewports']
  afterMount?: (root: HTMLElement) => void | Promise<void>
}

export function visualCase(config: VisualCaseConfig): UikitVisualCase {
  return {
    ...config,
    mount: async (root) => {
      root.innerHTML = config.html
      await config.afterMount?.(root)
    },
    themes: config.themes ?? UIKIT_VISUAL_THEMES,
    tier: config.tier ?? 'full',
    viewports: config.viewports ?? UIKIT_VISUAL_DEFAULT_VIEWPORTS,
  }
}

export function setElementProps<T extends Element>(
  root: HTMLElement,
  selector: string,
  props: Record<string, unknown>,
): T {
  const element = root.querySelector<T>(selector)
  if (!element) {
    throw new Error(`Visual case selector not found: ${selector}`)
  }

  Object.assign(element, props)
  return element
}

export async function waitForElementUpdate(element: Element): Promise<void> {
  const maybeUpdating = element as Element & {updateComplete?: Promise<unknown>}
  await maybeUpdating.updateComplete
  await Promise.resolve()
  await maybeUpdating.updateComplete
}

export async function pressElementKey(
  root: HTMLElement,
  selector: string,
  key: string,
  targetSelector = '[part="base"]',
): Promise<void> {
  const element = root.querySelector<HTMLElement>(selector)
  if (!element) {
    throw new Error(`Visual case selector not found: ${selector}`)
  }

  await waitForElementUpdate(element)

  const target = (element.shadowRoot?.querySelector(targetSelector) as HTMLElement | null) ?? element
  target.focus({preventScroll: true})
  target.dispatchEvent(new KeyboardEvent('keydown', {key, bubbles: true, composed: true}))
  await waitForElementUpdate(element)
}

export async function setShadowInputValue(
  root: HTMLElement,
  selector: string,
  value: string,
  inputSelector = '[part="input"]',
): Promise<HTMLElement> {
  const element = root.querySelector<HTMLElement>(selector)
  if (!element) {
    throw new Error(`Visual case selector not found: ${selector}`)
  }

  await waitForElementUpdate(element)

  const input = element.shadowRoot?.querySelector<HTMLInputElement>(inputSelector)
  if (!input) {
    throw new Error(`Visual case shadow input not found: ${selector} ${inputSelector}`)
  }

  input.value = value
  const inputEvent =
    typeof InputEvent === 'function'
      ? new InputEvent('input', {bubbles: true, composed: true, data: value, inputType: 'insertText'})
      : new Event('input', {bubbles: true, composed: true})
  input.dispatchEvent(inputEvent)
  await waitForElementUpdate(element)

  return element
}

export function dataSvg(label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="AccentColor"/>
      <stop offset="0.58" stop-color="Highlight"/>
      <stop offset="1" stop-color="Mark"/>
    </linearGradient>
  </defs>
  <rect width="640" height="420" rx="28" fill="Canvas"/>
  <circle cx="150" cy="118" r="78" fill="url(#g)" opacity="0.72"/>
  <path d="M72 342 216 204 326 298 418 220 568 342Z" fill="url(#g)" opacity="0.82"/>
  <text x="48" y="64" fill="CanvasText" font-family="system-ui, sans-serif" font-size="28" font-weight="700">${label}</text>
</svg>`

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
