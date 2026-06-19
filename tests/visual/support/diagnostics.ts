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
}

export type UikitVisualDiagnosticsOptions = {
  checkOutsideStage?: boolean
  ignoredSelectors?: readonly string[]
}

export async function collectStageDiagnostics(
  page: Page,
  stageSelector: string,
  options: UikitVisualDiagnosticsOptions = {},
): Promise<UikitVisualDiagnostics> {
  return page.evaluate(({selector, checkOutsideStage, ignoredSelectors}) => {
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

    const stage = document.querySelector(selector)
    if (!(stage instanceof HTMLElement)) {
      return {
        emptyStage: true,
        horizontalOverflow: [],
        clippedText: [],
        outsideStage: [],
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
      .filter((element) => element.scrollWidth > element.clientWidth + 1)
      .slice(0, 25)
      .map((element) => ({
        selector: selectorFor(element),
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
      }))

    const clippedText = diagnosticElements
      .filter((element) => {
        const text = element.textContent?.trim()
        if (!text) return false
        return (
          element.scrollWidth > element.clientWidth + 1 ||
          element.scrollHeight > element.clientHeight + 1
        )
      })
      .slice(0, 25)
      .map((element) => ({
        selector: selectorFor(element),
        text: (element.textContent ?? '').trim().slice(0, 120),
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

    return {
      emptyStage: stage.childElementCount === 0 && (stage.textContent ?? '').trim().length === 0,
      horizontalOverflow,
      clippedText,
      outsideStage,
    }
  }, {
    checkOutsideStage: options.checkOutsideStage ?? true,
    ignoredSelectors: options.ignoredSelectors ?? [],
    selector: stageSelector,
  })
}
