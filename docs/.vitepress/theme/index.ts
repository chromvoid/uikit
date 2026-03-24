import {registerUikit} from '@chromvoid/uikit/register'
import type {Theme} from 'vitepress'
import DefaultTheme from 'vitepress/theme-without-fonts'

import '@chromvoid/uikit/theme/tokens.css'
import {defineAsyncComponent} from 'vue'

import './custom.css'
import ComponentCatalog from './components/ComponentCatalog.vue'
import LiveDemo from './components/LiveDemo.vue'

let registered = false
const UIKitPlayground = defineAsyncComponent(() => import('./components/UIKitPlayground.vue'))

const theme: Theme = {
  ...DefaultTheme,
  enhanceApp(ctx) {
    DefaultTheme.enhanceApp?.(ctx)
    ctx.app.component('ComponentCatalog', ComponentCatalog)
    ctx.app.component('LiveDemo', LiveDemo)
    ctx.app.component('UIKitPlayground', UIKitPlayground)
    if (!registered && typeof window !== 'undefined') {
      registerUikit()
      registered = true
    }
  },
}

export default theme
