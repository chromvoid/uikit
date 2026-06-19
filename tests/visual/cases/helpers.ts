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
