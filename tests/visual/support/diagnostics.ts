import type {Page} from 'playwright'

export type UikitVisualDiagnostics = {
  emptyStage: boolean
  horizontalOverflow: Array<{
    selector: string
    scrollWidth: number
    clientWidth: number
  }>
  clippedText: Array<{
    selector: string
    text: string
    scrollWidth: number
    clientWidth: number
    scrollHeight: number
    clientHeight: number
  }>
  outsideStage: Array<{
    selector: string
    text: string
    left: number
    top: number
    right: number
    bottom: number
  }>
  stageViewportOverflow: {
    stageBottom: number
    viewportHeight: number
    overflowPx: number
  } | null
}

export type UikitVisualDiagnosticsOptions = {
  checkOutsideStage?: boolean
  checkViewportClip?: boolean
  ignoredSelectors?: readonly string[]
}

export async function collectStageDiagnostics(
  page: Page,
  stageSelector: string,
  options: UikitVisualDiagnosticsOptions = {},
): Promise<UikitVisualDiagnostics> {
  return page.evaluate(({selector, checkOutsideStage, checkViewportClip, ignoredSelectors}) => {
    function selectorFor(element: Element): string {
      const tag = element.tagName.toLowerCase()
      const id = element.id ? `#${element.id}` : ''
      const testId = element.getAttribute('data-visual-id')
      if (testId) return `${tag}[data-visual-id="${testId}"]`
      const classes = Array.from(element.classList).slice(0, 3)
      return `${tag}${id}${classes.length ? `.${classes.join('.')}` : ''}`
    }

    function isIgnored(element: Element): boolean {
      return ignoredSelectors.some((ignoredSelector) => element.closest(ignoredSelector))
    }

    function hasOnlyExpectedCircularOverflow(element: HTMLElement): boolean {
      const widthOverflow = element.scrollWidth - element.clientWidth
      const heightOverflow = element.scrollHeight - element.clientHeight
      if (widthOverflow <= 1 && heightOverflow <= 1) return false
      if (widthOverflow > 4 || heightOverflow > 4) return false
      if (element.localName === 'cv-progress-ring') return true

      const visibleChildren = Array.from(element.children).filter((child) => {
        if (!(child instanceof HTMLElement)) return false
        const rect = child.getBoundingClientRect()
        return rect.width > 0 && rect.height > 0
      })

      return (
        visibleChildren.length > 0 &&
        visibleChildren.every((child) => child.localName === 'cv-progress-ring')
      )
    }

    function isTextNodeVisible(node: Node, stage: HTMLElement): boolean {
      const parent = node.parentElement
      if (!parent || !stage.contains(parent)) return false

      for (let current: Element | null = parent; current != null; current = current.parentElement) {
        if (!(current instanceof HTMLElement)) continue
        if (current.hidden || current.getAttribute('aria-hidden') === 'true') return false

        const style = getComputedStyle(current)
        if (
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          style.visibility === 'collapse'
        ) {
          return false
        }

        if (current === stage) break
      }

      const rect = parent.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0
    }

    function visibleTextFor(element: HTMLElement, stage: HTMLElement): string {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
      const chunks: string[] = []

      while (walker.nextNode()) {
        const text = walker.currentNode.textContent?.trim()
        if (!text || !isTextNodeVisible(walker.currentNode, stage)) continue
        chunks.push(text)
      }

      return chunks.join(' ').trim()
    }

    const stage = document.querySelector(selector)
    if (!(stage instanceof HTMLElement)) {
      return {
        emptyStage: true,
        horizontalOverflow: [],
        clippedText: [],
        outsideStage: [],
        stageViewportOverflow: null,
      }
    }

    const stageRect = stage.getBoundingClientRect()
    const elements = Array.from(stage.querySelectorAll('*')).filter(
      (element): element is HTMLElement => element instanceof HTMLElement,
    )
    const diagnosticElements = elements.filter(
      (element): element is HTMLElement => !isIgnored(element),
    )

    const horizontalOverflow = diagnosticElements
      .filter(
        (element) =>
          element.scrollWidth > element.clientWidth + 1 &&
          !hasOnlyExpectedCircularOverflow(element),
      )
      .slice(0, 25)
      .map((element) => ({
        selector: selectorFor(element),
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
      }))

    const clippedText = diagnosticElements
      .filter((element) => {
        const text = visibleTextFor(element, stage)
        if (!text) return false
        if (hasOnlyExpectedCircularOverflow(element)) return false
        return (
          element.scrollWidth > element.clientWidth + 1 ||
          element.scrollHeight > element.clientHeight + 1
        )
      })
      .slice(0, 25)
      .map((element) => ({
        selector: selectorFor(element),
        text: visibleTextFor(element, stage).slice(0, 120),
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
      }))

    const outsideStage = checkOutsideStage
      ? diagnosticElements
          .filter((element) => {
            const rect = element.getBoundingClientRect()
            if (rect.width <= 0 || rect.height <= 0) return false
            return (
              rect.left < stageRect.left - 1 ||
              rect.top < stageRect.top - 1 ||
              rect.right > stageRect.right + 1 ||
              rect.bottom > stageRect.bottom + 1
            )
          })
          .slice(0, 25)
          .map((element) => {
            const rect = element.getBoundingClientRect()
            return {
              selector: selectorFor(element),
              text: (element.textContent ?? '').trim().slice(0, 120),
              left: rect.left,
              top: rect.top,
              right: rect.right,
              bottom: rect.bottom,
            }
          })
      : []

    const stageViewportOverflow =
      checkViewportClip && stageRect.bottom > window.innerHeight + 1
        ? {
            overflowPx: Math.round(stageRect.bottom - window.innerHeight),
            stageBottom: Math.round(stageRect.bottom),
            viewportHeight: window.innerHeight,
          }
        : null

    return {
      emptyStage: stage.childElementCount === 0 && (stage.textContent ?? '').trim().length === 0,
      horizontalOverflow,
      clippedText,
      outsideStage,
      stageViewportOverflow,
    }
  }, {
    checkOutsideStage: options.checkOutsideStage ?? true,
    checkViewportClip: options.checkViewportClip ?? true,
    ignoredSelectors: options.ignoredSelectors ?? [],
    selector: stageSelector,
  })
}
