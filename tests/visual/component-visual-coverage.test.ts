import {describe, expect, it} from 'vitest'

import {componentItems} from '../../docs/.vitepress/component-catalog.mjs'
import {visualCases, visualExclusions} from './component-visual-cases'
import {visualComponentMatrix} from './component-visual-matrix'

describe('UIKit visual component matrix coverage', () => {
  it('covers every catalog component with cases or an explicit exclusion', () => {
    const missing = visualComponentMatrix
      .filter((entry) => entry.cases.length === 0 && !entry.exclusion)
      .map((entry) => entry.component)

    expect(missing).toEqual([])
  })

  it('does not register duplicate visual case ids', () => {
    const seen = new Set<string>()
    const duplicates: string[] = []

    for (const visualCase of visualCases) {
      if (seen.has(visualCase.id)) {
        duplicates.push(visualCase.id)
      }
      seen.add(visualCase.id)
    }

    expect(duplicates).toEqual([])
  })

  it('keeps case metadata complete and canonical', () => {
    const catalogComponents = new Set(componentItems.map((item) => item.name))
    const invalidCases = visualCases
      .filter(
        (visualCase) =>
          !catalogComponents.has(visualCase.component) ||
          visualCase.states.length === 0 ||
          visualCase.themes.length === 0 ||
          visualCase.viewports.length === 0,
      )
      .map((visualCase) => visualCase.id)

    expect(invalidCases).toEqual([])
  })

  it('requires exclusions to explain coverage and point coveredBy to a real case', () => {
    const caseIds = new Set(visualCases.map((visualCase) => visualCase.id))
    const catalogComponents = new Set(componentItems.map((item) => item.name))
    const invalidExclusions = visualExclusions
      .filter(
        (exclusion) =>
          !catalogComponents.has(exclusion.component) ||
          exclusion.reason.trim().length === 0 ||
          (exclusion.coveredBy ? !caseIds.has(exclusion.coveredBy) : false),
      )
      .map((exclusion) => exclusion.component)

    expect(invalidExclusions).toEqual([])
  })
})
