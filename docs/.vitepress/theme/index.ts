import {setUnoUtilities} from '@chromvoid/uikit/reatom-lit'
import {registerUikit} from '@chromvoid/uikit/register'
import {unoUtilities} from '@chromvoid/uikit/styles/uno-utilities'
import type {Theme} from 'vitepress'
import DefaultTheme from 'vitepress/theme-without-fonts'

import '@chromvoid/uikit/theme/tokens.css'
import {defineAsyncComponent} from 'vue'

import './custom.css'
import ComponentCatalog from './components/ComponentCatalog.vue'
import LiveDemo from './components/LiveDemo.vue'

let registered = false
const UIKitPlayground = defineAsyncComponent(() => import('./components/UIKitPlayground.vue'))

function syncDocsShellAccessibility(): void {
  const content = document.querySelector('#VPContent')
  if (content instanceof HTMLElement) {
    const nestedMain = content.querySelector('main,[role="main"]')
    if (!nestedMain) {
      content.setAttribute('role', 'main')
      content.setAttribute('tabindex', '-1')
      content.dataset.cvMainLandmark = 'true'
    } else if (content.dataset.cvMainLandmark === 'true') {
      content.removeAttribute('role')
      content.removeAttribute('tabindex')
      delete content.dataset.cvMainLandmark
    }
  }

  const searchButton = document.querySelector('#local-search .DocSearch-Button')
  if (searchButton instanceof HTMLButtonElement) {
    const visibleLabel = searchButton.textContent?.replace(/\s+/g, ' ').trim()
    if (visibleLabel) {
      searchButton.setAttribute('aria-label', visibleLabel)
    }
  }
}

function scheduleDocsShellAccessibilitySync(): void {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      syncDocsShellAccessibility()
    })
  })
}

function syncDocsThemeMode(): void {
  document.documentElement.dataset.theme = 'dark'
}

const theme: Theme = {
  ...DefaultTheme,
  enhanceApp(ctx) {
    DefaultTheme.enhanceApp?.(ctx)
    ctx.app.component('ComponentCatalog', ComponentCatalog)
    ctx.app.component('LiveDemo', LiveDemo)
    ctx.app.component('UIKitPlayground', UIKitPlayground)
    if (!registered && typeof window !== 'undefined') {
      setUnoUtilities(unoUtilities)
      registerUikit()
      registered = true
    }

    if (typeof window !== 'undefined') {
      syncDocsThemeMode()
      const previousAfterRouteChange = ctx.router.onAfterRouteChange
      ctx.router.onAfterRouteChange = async (to) => {
        await previousAfterRouteChange?.(to)
        syncDocsThemeMode()
        scheduleDocsShellAccessibilitySync()
      }

      scheduleDocsShellAccessibilitySync()
    }
  },
}

export default theme
