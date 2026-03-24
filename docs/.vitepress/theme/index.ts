import {registerUikit} from '@chromvoid/uikit/register'
import type {Theme} from 'vitepress'

import '@chromvoid/uikit/theme/tokens.css'
import DefaultTheme from 'vitepress/theme'

import './custom.css'
import ComponentCatalog from './components/ComponentCatalog.vue'
import LiveDemo from './components/LiveDemo.vue'
import UIKitPlayground from './components/UIKitPlayground.vue'

let registered = false

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
