export type CVTextDirection = 'ltr' | 'rtl'

function getDirectionAncestors(element: Element): Element[] {
  const ancestors: Element[] = []
  const seen = new Set<Element>()
  let current: Element | null = element

  while (current && !seen.has(current)) {
    ancestors.push(current)
    seen.add(current)

    if (current.parentElement) {
      current = current.parentElement
      continue
    }

    const root = current.getRootNode()
    current = root instanceof ShadowRoot ? root.host : null
  }

  const documentRoot = element.ownerDocument.documentElement
  if (documentRoot && !seen.has(documentRoot)) {
    ancestors.push(documentRoot)
  }

  return ancestors
}

export function readInheritedDirection(element: Element): CVTextDirection {
  try {
    const direction = element.ownerDocument.defaultView?.getComputedStyle(element).direction
    if (direction === 'rtl' || direction === 'ltr') {
      return direction
    }
  } catch {
    // A disconnected or cross-document element can temporarily reject style reads.
  }

  for (const ancestor of getDirectionAncestors(element)) {
    const direction = ancestor.getAttribute('dir')?.toLowerCase()
    if (direction === 'rtl' || direction === 'ltr') {
      return direction
    }
  }

  return 'ltr'
}

export function observeInheritedDirection(
  element: Element,
  onChange: (direction: CVTextDirection) => void,
): MutationObserver | null {
  const MutationObserverConstructor = element.ownerDocument.defaultView?.MutationObserver
  if (!MutationObserverConstructor) return null

  let direction = readInheritedDirection(element)
  const observer = new MutationObserverConstructor(() => {
    const nextDirection = readInheritedDirection(element)
    if (nextDirection === direction) return

    direction = nextDirection
    onChange(nextDirection)
  })

  for (const ancestor of getDirectionAncestors(element)) {
    observer.observe(ancestor, {
      attributes: true,
      attributeFilter: ['dir'],
    })
  }

  return observer
}
