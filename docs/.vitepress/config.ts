import {defineConfig} from 'vitepress'

import {componentGroups} from './component-catalog.mjs'
import {liveDemoPlugin} from './markdown/liveDemo'
import {responsiveTablesPlugin} from './markdown/responsiveTables'

const description =
  'ChromVoid UIKit is a Lit-based component layer over @chromvoid/headless-ui with reusable theme tokens and accessible interactions.'

const forceDarkThemeScript = "document.documentElement.dataset.theme='dark'"
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const docsBase = process.env.DOCS_BASE?.trim()
const base = docsBase || (process.env.GITHUB_ACTIONS === 'true' && repoName ? `/${repoName}/` : '/')
const fontFaceStyle = `
@font-face {
  font-family: 'Manrope';
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
  src: url('${base}fonts/manrope-latin-400.woff2') format('woff2');
}

@font-face {
  font-family: 'Orbitron';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('${base}fonts/orbitron-latin-700.woff2') format('woff2');
}

@font-face {
  font-family: 'JetBrains Mono';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('${base}fonts/jetbrains-mono-latin-500.woff2') format('woff2');
}
`

const guideItems = [
  {text: 'Getting Started', link: '/guide/getting-started'},
  {text: 'Architecture', link: '/guide/architecture'},
  {text: 'Theming', link: '/guide/theming'},
  {text: 'Playground', link: '/guide/playground'},
]

export default defineConfig({
  title: 'ChromVoid UIKit',
  description,
  lang: 'en-US',
  base,
  appearance: 'force-dark',
  cleanUrls: false,
  lastUpdated: true,
  head: [
    ['script', {}, forceDarkThemeScript],
    ['style', {}, fontFaceStyle],
    ['meta', {name: 'theme-color', content: '#0b0d12'}],
    ['meta', {property: 'og:title', content: 'ChromVoid UIKit'}],
    ['meta', {property: 'og:description', content: description}],
    ['link', {rel: 'icon', href: `${base}favicon/favicon.ico`, sizes: 'any'}],
    [
      'link',
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: `${base}favicon/favicon-16x16.png`,
      },
    ],
    [
      'link',
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: `${base}favicon/favicon-32x32.png`,
      },
    ],
    [
      'link',
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '192x192',
        href: `${base}favicon/favicon-192x192.png`,
      },
    ],
    [
      'link',
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '512x512',
        href: `${base}favicon/favicon-512x512.png`,
      },
    ],
    [
      'link',
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: `${base}favicon/apple-touch-icon.png`,
      },
    ],
    [
      'link',
      {
        rel: 'preload',
        href: `${base}fonts/manrope-latin-400.woff2`,
        as: 'font',
        type: 'font/woff2',
        crossorigin: 'anonymous',
      },
    ],
    [
      'link',
      {
        rel: 'preload',
        href: `${base}fonts/orbitron-latin-700.woff2`,
        as: 'font',
        type: 'font/woff2',
        crossorigin: 'anonymous',
      },
    ],
  ],
  themeConfig: {
    logo: {src: `${base}assets/icon.png`, alt: 'ChromVoid UIKit'},
    nav: [
      {text: 'Guide', link: '/guide/getting-started'},
      {text: 'Playground', link: '/guide/playground'},
      {text: 'Components', link: '/components/'},
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: guideItems,
        },
      ],
      '/components/': [
        {
          text: 'Components',
          items: [{text: 'Overview', link: '/components/'}],
        },
        ...componentGroups.map((group) => ({
          text: group.title,
          items: group.items.map((item) => ({
            text: item.name,
            link: `/components/${item.slug}`,
          })),
        })),
      ],
    },
    search: {
      provider: 'local',
    },
    outline: [2, 3],
    socialLinks: [{icon: 'github', link: 'https://github.com/chromvoid/uikit'}],
    footer: {
      message: 'ChromVoid UIKit documentation',
      copyright: 'Released under MIT',
    },
    editLink: {
      pattern: 'https://github.com/chromvoid/uikit/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },
  markdown: {
    config: (md) => {
      liveDemoPlugin(md)
      responsiveTablesPlugin(md)
    },
  },
  vite: {
    build: {
      chunkSizeWarningLimit: 1100,
    },
  },
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => tag.startsWith('cv-'),
      },
    },
  },
})
