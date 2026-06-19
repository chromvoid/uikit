import {describe, expect, it} from 'vitest'
import type {Page} from 'playwright'

import {
  UIKIT_VISUAL_VIEWPORTS,
  type UikitVisualCase,
  type UikitVisualTheme,
  type UikitVisualViewport,
} from './component-visual-types'
import {visualCases} from './component-visual-cases'
import {collectStageDiagnostics} from './support/diagnostics'
import {assertUikitVisualSnapshot} from './support/visual-snapshot'

const STAGE_SELECTOR = '#uikit-visual-stage'

type VisualRun = {
  visualCase: UikitVisualCase
  theme: UikitVisualTheme
  viewport: UikitVisualViewport
}

type UikitVisualGlobals = typeof globalThis & {
  __UIKIT_VISUAL_BASE_URL__: string
  __UIKIT_VISUAL_PAGE__: Page
}

const visualRuns: VisualRun[] = visualCases.flatMap((visualCase) =>
  visualCase.themes.flatMap((theme) =>
    visualCase.viewports.map((viewport) => ({
      visualCase,
      theme,
      viewport,
    })),
  ),
)

function getVisualGlobals(): UikitVisualGlobals {
  return globalThis as UikitVisualGlobals
}

async function applyInteraction(visualCase: UikitVisualCase): Promise<void> {
  const page = getVisualGlobals().__UIKIT_VISUAL_PAGE__
  const interaction = visualCase.interaction
  if (!interaction) return

  if (interaction.focus) {
    await page.locator(interaction.focus).first().evaluate((element: Element) => {
      if (element instanceof HTMLElement) {
        element.focus({preventScroll: true})
      }
    })
  }

  if (interaction.hover) {
    await page.locator(interaction.hover).first().hover()
  }

  if (interaction.click) {
    await page.locator(interaction.click).first().click()
  }
}

describe('UIKit visual snapshots', () => {
  for (const {visualCase, theme, viewport} of visualRuns) {
    it(`${visualCase.id} / ${theme} / ${viewport}`, async () => {
      const visualGlobals = getVisualGlobals()
      const page = visualGlobals.__UIKIT_VISUAL_PAGE__
      const url = new URL(visualGlobals.__UIKIT_VISUAL_BASE_URL__)
      url.searchParams.set('case', visualCase.id)
      url.searchParams.set('theme', theme)

      await page.setViewportSize(UIKIT_VISUAL_VIEWPORTS[viewport])
      await page.goto(url.toString(), {waitUntil: 'domcontentloaded'})
      await page.waitForFunction(() => document.documentElement.dataset.visualReady !== undefined)

      const readyState = await page.evaluate(() => document.documentElement.dataset.visualReady)
      if (readyState !== '1') {
        const message = await page.locator('body pre').last().textContent().catch(() => null)
        throw new Error(message ?? `UIKit visual harness did not become ready for ${visualCase.id}`)
      }

      await applyInteraction(visualCase)

      const diagnostics = await collectStageDiagnostics(page, STAGE_SELECTOR, {
        checkOutsideStage: !visualCase.fullPage,
        ignoredSelectors: visualCase.diagnosticsIgnoredSelectors ?? [],
      })
      expect(diagnostics.emptyStage).toBe(false)

      await assertUikitVisualSnapshot(page, `${visualCase.id}-${theme}-${viewport}`, {
        clipSelector: visualCase.fullPage ? undefined : visualCase.clipSelector ?? STAGE_SELECTOR,
        fullPage: visualCase.fullPage,
        metadata: {
          caseId: visualCase.id,
          component: visualCase.component,
          diagnostics,
          states: visualCase.states,
          theme,
          title: visualCase.title,
          viewport,
        },
        suite: visualCase.component,
        viewport: UIKIT_VISUAL_VIEWPORTS[viewport],
      })
    })
  }
})
