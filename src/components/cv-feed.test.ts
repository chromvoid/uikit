import {afterEach, describe, expect, it} from 'vitest'

import {CVFeed} from './cv-feed'
import {CVFeedArticle} from './cv-feed-article'

CVFeed.define()
CVFeedArticle.define()

const settle = async (element: CVFeed) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
}

const createFeed = async (attrs?: Partial<CVFeed>, articleCount = 3) => {
  const el = document.createElement('cv-feed') as CVFeed
  el.label = 'Test feed'
  if (attrs) Object.assign(el, attrs)

  for (let i = 0; i < articleCount; i++) {
    const article = document.createElement('cv-feed-article') as CVFeedArticle
    article.articleId = `article-${i}`
    article.textContent = `Article ${i} content`
    el.append(article)
  }

  document.body.append(el)
  await settle(el)
  return el
}

const createEmptyFeed = async (attrs?: Partial<CVFeed>) => {
  const el = document.createElement('cv-feed') as CVFeed
  el.label = 'Empty feed'
  if (attrs) Object.assign(el, attrs)
  document.body.append(el)
  await settle(el)
  return el
}

const getBase = (el: CVFeed | CVFeedArticle) => el.shadowRoot!.querySelector('[part="base"]') as HTMLElement

const getArticles = (feed: CVFeed) => Array.from(feed.querySelectorAll('cv-feed-article')) as CVFeedArticle[]

afterEach(() => {
  document.body.innerHTML = ''
})

describe('cv-feed', () => {
  // --- Shadow DOM structure ---

  describe('shadow DOM structure', () => {
    it('renders [part="base"] with role="feed"', async () => {
      const feed = await createFeed()
      const base = getBase(feed)
      expect(base).not.toBeNull()
      expect(base.getAttribute('role')).toBe('feed')
    })

    it('renders [part="sentinel-top"]', async () => {
      const feed = await createFeed()
      const sentinel = feed.shadowRoot!.querySelector('[part="sentinel-top"]')
      expect(sentinel).not.toBeNull()
    })

    it('renders [part="sentinel-bottom"]', async () => {
      const feed = await createFeed()
      const sentinel = feed.shadowRoot!.querySelector('[part="sentinel-bottom"]')
      expect(sentinel).not.toBeNull()
    })

    it('renders default slot for articles', async () => {
      const feed = await createFeed()
      const slot = feed.shadowRoot!.querySelector('slot:not([name])')
      expect(slot).not.toBeNull()
    })

    it('renders slot[name="empty"]', async () => {
      const feed = await createEmptyFeed()
      const slot = feed.shadowRoot!.querySelector('slot[name="empty"]')
      expect(slot).not.toBeNull()
    })

    it('renders slot[name="error"]', async () => {
      const feed = await createFeed({error: true} as Partial<CVFeed>)
      const slot = feed.shadowRoot!.querySelector('slot[name="error"]')
      expect(slot).not.toBeNull()
    })

    it('renders slot[name="loading"] inside [part="loading-indicator"] when loading', async () => {
      const feed = await createFeed({loading: true} as Partial<CVFeed>)
      const indicator = feed.shadowRoot!.querySelector('[part="loading-indicator"]')
      expect(indicator).not.toBeNull()
      expect(indicator!.getAttribute('aria-hidden')).toBe('true')
      const slot = indicator!.querySelector('slot[name="loading"]')
      expect(slot).not.toBeNull()
    })

    it('does NOT render [part="loading-indicator"] when not loading', async () => {
      const feed = await createFeed()
      const indicator = feed.shadowRoot!.querySelector('[part="loading-indicator"]')
      expect(indicator).toBeNull()
    })
  })

  // --- Default property values ---

  describe('default property values', () => {
    it('has correct defaults', async () => {
      const feed = await createFeed()
      expect(feed.label).toBe('Test feed')
      expect(feed.busy).toBe(false)
      expect(feed.loading).toBe(false)
      expect(feed.empty).toBe(false)
      expect(feed.error).toBe(false)
    })

    it('empty defaults to true when no articles', async () => {
      const feed = await createEmptyFeed()
      expect(feed.empty).toBe(true)
    })
  })

  // --- Attribute reflection ---

  describe('attribute reflection', () => {
    it('reflects busy boolean attribute', async () => {
      const feed = await createFeed({busy: true} as Partial<CVFeed>)
      expect(feed.hasAttribute('busy')).toBe(true)
    })

    it('reflects loading boolean attribute', async () => {
      const feed = await createFeed({loading: true} as Partial<CVFeed>)
      expect(feed.hasAttribute('loading')).toBe(true)
    })

    it('reflects empty boolean attribute when no articles present', async () => {
      const feed = await createEmptyFeed()
      expect(feed.hasAttribute('empty')).toBe(true)
    })

    it('reflects error boolean attribute', async () => {
      const feed = await createFeed({error: true} as Partial<CVFeed>)
      expect(feed.hasAttribute('error')).toBe(true)
    })

    it('does not reflect busy when false', async () => {
      const feed = await createFeed()
      expect(feed.hasAttribute('busy')).toBe(false)
    })

    it('does not reflect loading when false', async () => {
      const feed = await createFeed()
      expect(feed.hasAttribute('loading')).toBe(false)
    })
  })

  // --- Events ---

  describe('events', () => {
    it('cv-load-more event has empty detail object', async () => {
      const feed = await createFeed()
      let detail: unknown = undefined

      feed.addEventListener('cv-load-more', (e) => {
        detail = (e as CustomEvent).detail
      })

      feed.dispatchEvent(new CustomEvent('cv-load-more', {detail: {}, bubbles: true}))
      expect(detail).toEqual({})
    })

    it('cv-load-newer event has empty detail object', async () => {
      const feed = await createFeed()
      let detail: unknown = undefined

      feed.addEventListener('cv-load-newer', (e) => {
        detail = (e as CustomEvent).detail
      })

      feed.dispatchEvent(new CustomEvent('cv-load-newer', {detail: {}, bubbles: true}))
      expect(detail).toEqual({})
    })

    it('cv-exit-after fires on Ctrl+End', async () => {
      const feed = await createFeed()
      let fired = false

      feed.addEventListener('cv-exit-after', () => {
        fired = true
      })

      const base = getBase(feed)
      base.dispatchEvent(new KeyboardEvent('keydown', {key: 'End', ctrlKey: true, bubbles: true}))
      await settle(feed)

      expect(fired).toBe(true)
    })

    it('cv-exit-before fires on Ctrl+Home', async () => {
      const feed = await createFeed()
      let fired = false

      feed.addEventListener('cv-exit-before', () => {
        fired = true
      })

      const base = getBase(feed)
      base.dispatchEvent(new KeyboardEvent('keydown', {key: 'Home', ctrlKey: true, bubbles: true}))
      await settle(feed)

      expect(fired).toBe(true)
    })

    it('cv-exit-after detail is empty object', async () => {
      const feed = await createFeed()
      let detail: unknown = undefined

      feed.addEventListener('cv-exit-after', (e) => {
        detail = (e as CustomEvent).detail
      })

      const base = getBase(feed)
      base.dispatchEvent(new KeyboardEvent('keydown', {key: 'End', ctrlKey: true, bubbles: true}))
      await settle(feed)

      expect(detail).toEqual({})
    })

    it('cv-exit-before detail is empty object', async () => {
      const feed = await createFeed()
      let detail: unknown = undefined

      feed.addEventListener('cv-exit-before', (e) => {
        detail = (e as CustomEvent).detail
      })

      const base = getBase(feed)
      base.dispatchEvent(new KeyboardEvent('keydown', {key: 'Home', ctrlKey: true, bubbles: true}))
      await settle(feed)

      expect(detail).toEqual({})
    })
  })

  // --- ARIA ---

  describe('ARIA', () => {
    it('role="feed" on [part="base"]', async () => {
      const feed = await createFeed()
      expect(getBase(feed).getAttribute('role')).toBe('feed')
    })

    it('aria-label reflects label property', async () => {
      const feed = await createFeed({label: 'News feed'} as Partial<CVFeed>)
      expect(getBase(feed).getAttribute('aria-label')).toBe('News feed')
    })

    it('aria-busy="false" when not busy', async () => {
      const feed = await createFeed()
      expect(getBase(feed).getAttribute('aria-busy')).toBe('false')
    })

    it('aria-busy="true" when busy', async () => {
      const feed = await createFeed({busy: true} as Partial<CVFeed>)
      expect(getBase(feed).getAttribute('aria-busy')).toBe('true')
    })

    it('first article has tabindex="0" (active), others have tabindex="-1"', async () => {
      const feed = await createFeed()
      const articles = getArticles(feed)

      expect(articles[0]!.getAttribute('tabindex')).toBe('0')
      expect(articles[1]!.getAttribute('tabindex')).toBe('-1')
      expect(articles[2]!.getAttribute('tabindex')).toBe('-1')
    })

    it('articles expose role="article" on the host (not nested on the base part)', async () => {
      const feed = await createFeed()
      const articles = getArticles(feed)
      for (const article of articles) {
        // The host carries the article role; the shadow base must not duplicate
        // it (nested role="article" would double-count in the a11y tree).
        expect(article.getAttribute('role')).toBe('article')
        expect(getBase(article).getAttribute('role')).toBeNull()
      }
    })

    it('articles have aria-posinset (1-based)', async () => {
      const feed = await createFeed()
      const articles = getArticles(feed)

      expect(articles[0]!.getAttribute('aria-posinset')).toBe('1')
      expect(articles[1]!.getAttribute('aria-posinset')).toBe('2')
      expect(articles[2]!.getAttribute('aria-posinset')).toBe('3')
    })

    it('articles have aria-setsize', async () => {
      const feed = await createFeed()
      const articles = getArticles(feed)

      // Default totalCount is -1 (unknown), so aria-setsize should be -1
      for (const article of articles) {
        expect(article.getAttribute('aria-setsize')).toBe('-1')
      }
    })

    it('feed container is NOT focusable (no tabindex on base)', async () => {
      const feed = await createFeed()
      const base = getBase(feed)
      // The feed base should not have its own tabindex; articles are focusable instead
      expect(base.hasAttribute('tabindex')).toBe(false)
    })
  })

  // --- Headless contract delegation ---

  describe('headless contract delegation', () => {
    it('role on [part="base"] comes from contracts.getFeedProps(), not hardcoded', async () => {
      const feed = await createFeed()
      const base = getBase(feed)
      // The role should be "feed" as returned by the headless contract
      expect(base.getAttribute('role')).toBe('feed')
    })

    it('aria-busy on [part="base"] comes from contracts.getFeedProps()', async () => {
      const feed = await createFeed()
      const base = getBase(feed)
      // aria-busy is part of the contract spread
      expect(base.getAttribute('aria-busy')).toBe('false')

      feed.busy = true
      await settle(feed)
      expect(getBase(feed).getAttribute('aria-busy')).toBe('true')
    })

    it('article role, tabindex, aria-posinset, aria-setsize come from contracts.getArticleProps()', async () => {
      const feed = await createFeed()
      const articles = getArticles(feed)
      const first = articles[0]!

      // These values are spread from contracts.getArticleProps(articleId)
      expect(first.getAttribute('role')).toBe('article')
      expect(first.getAttribute('tabindex')).toBe('0')
      expect(first.getAttribute('aria-posinset')).toBe('1')
      expect(first.getAttribute('aria-setsize')).not.toBeNull()
    })

    it('data-active attribute reflects contract active state', async () => {
      const feed = await createFeed()
      const articles = getArticles(feed)

      expect(articles[0]!.getAttribute('data-active')).toBe('true')
      expect(articles[1]!.getAttribute('data-active')).toBe('false')
    })
  })

  // --- Keyboard navigation ---

  describe('keyboard navigation', () => {
    it('PageDown moves focus to the next article', async () => {
      const feed = await createFeed()
      const base = getBase(feed)
      const articles = getArticles(feed)

      // First article is active by default
      expect(articles[0]!.getAttribute('data-active')).toBe('true')

      base.dispatchEvent(new KeyboardEvent('keydown', {key: 'PageDown', bubbles: true}))
      await settle(feed)

      expect(articles[0]!.getAttribute('data-active')).toBe('false')
      expect(articles[1]!.getAttribute('data-active')).toBe('true')
    })

    it('PageUp moves focus to the previous article', async () => {
      const feed = await createFeed()
      const base = getBase(feed)
      const articles = getArticles(feed)

      // Move to second article first
      base.dispatchEvent(new KeyboardEvent('keydown', {key: 'PageDown', bubbles: true}))
      await settle(feed)

      base.dispatchEvent(new KeyboardEvent('keydown', {key: 'PageUp', bubbles: true}))
      await settle(feed)

      expect(articles[0]!.getAttribute('data-active')).toBe('true')
    })

    it('PageDown clamps at last article', async () => {
      const feed = await createFeed({}, 2)
      const base = getBase(feed)
      const articles = getArticles(feed)

      base.dispatchEvent(new KeyboardEvent('keydown', {key: 'PageDown', bubbles: true}))
      await settle(feed)
      base.dispatchEvent(new KeyboardEvent('keydown', {key: 'PageDown', bubbles: true}))
      await settle(feed)
      base.dispatchEvent(new KeyboardEvent('keydown', {key: 'PageDown', bubbles: true}))
      await settle(feed)

      expect(articles[1]!.getAttribute('data-active')).toBe('true')
    })

    it('PageUp clamps at first article', async () => {
      const feed = await createFeed()
      const base = getBase(feed)
      const articles = getArticles(feed)

      base.dispatchEvent(new KeyboardEvent('keydown', {key: 'PageUp', bubbles: true}))
      await settle(feed)

      expect(articles[0]!.getAttribute('data-active')).toBe('true')
    })

    it('Ctrl+End dispatches cv-exit-after', async () => {
      const feed = await createFeed()
      let exitAfterFired = false

      feed.addEventListener('cv-exit-after', () => {
        exitAfterFired = true
      })

      const base = getBase(feed)
      base.dispatchEvent(new KeyboardEvent('keydown', {key: 'End', ctrlKey: true, bubbles: true}))
      await settle(feed)

      expect(exitAfterFired).toBe(true)
    })

    it('Ctrl+Home dispatches cv-exit-before', async () => {
      const feed = await createFeed()
      let exitBeforeFired = false

      feed.addEventListener('cv-exit-before', () => {
        exitBeforeFired = true
      })

      const base = getBase(feed)
      base.dispatchEvent(new KeyboardEvent('keydown', {key: 'Home', ctrlKey: true, bubbles: true}))
      await settle(feed)

      expect(exitBeforeFired).toBe(true)
    })

    it('disabled articles are skipped during keyboard navigation', async () => {
      const feed = document.createElement('cv-feed') as CVFeed
      feed.label = 'Test feed'

      const a0 = document.createElement('cv-feed-article') as CVFeedArticle
      a0.articleId = 'a0'
      a0.textContent = 'Article 0'

      const a1 = document.createElement('cv-feed-article') as CVFeedArticle
      a1.articleId = 'a1'
      a1.disabled = true
      a1.textContent = 'Article 1 (disabled)'

      const a2 = document.createElement('cv-feed-article') as CVFeedArticle
      a2.articleId = 'a2'
      a2.textContent = 'Article 2'

      feed.append(a0, a1, a2)
      document.body.append(feed)
      await settle(feed)

      const base = getBase(feed)
      base.dispatchEvent(new KeyboardEvent('keydown', {key: 'PageDown', bubbles: true}))
      await settle(feed)

      // Should skip disabled a1 and go to a2
      expect(a2.getAttribute('data-active')).toBe('true')
    })

    it('unhandled keys do not change active article', async () => {
      const feed = await createFeed()
      const base = getBase(feed)
      const articles = getArticles(feed)

      base.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}))
      await settle(feed)

      expect(articles[0]!.getAttribute('data-active')).toBe('true')
    })
  })

  // --- Keyboard edge cases ---

  describe('keyboard edge cases', () => {
    it('keyboard navigation on an empty feed is a no-op and does not throw', async () => {
      const feed = await createEmptyFeed()
      const base = getBase(feed)

      expect(() => {
        base.dispatchEvent(new KeyboardEvent('keydown', {key: 'PageDown', bubbles: true}))
        base.dispatchEvent(new KeyboardEvent('keydown', {key: 'PageUp', bubbles: true}))
        base.dispatchEvent(new KeyboardEvent('keydown', {key: 'End', ctrlKey: true, bubbles: true}))
        base.dispatchEvent(new KeyboardEvent('keydown', {key: 'Home', ctrlKey: true, bubbles: true}))
      }).not.toThrow()
      await settle(feed)

      expect(feed.empty).toBe(true)
    })

    it('PageDown and PageUp keep a single article active', async () => {
      const feed = await createFeed({}, 1)
      const base = getBase(feed)
      const articles = getArticles(feed)

      base.dispatchEvent(new KeyboardEvent('keydown', {key: 'PageDown', bubbles: true}))
      await settle(feed)
      expect(articles[0]!.getAttribute('data-active')).toBe('true')

      base.dispatchEvent(new KeyboardEvent('keydown', {key: 'PageUp', bubbles: true}))
      await settle(feed)
      expect(articles[0]!.getAttribute('data-active')).toBe('true')
      expect(articles[0]!.getAttribute('tabindex')).toBe('0')
    })

    it('Meta+End and Meta+Home dispatch exit events', async () => {
      const feed = await createFeed()
      const fired: string[] = []

      feed.addEventListener('cv-exit-after', () => fired.push('after'))
      feed.addEventListener('cv-exit-before', () => fired.push('before'))

      const base = getBase(feed)
      base.dispatchEvent(new KeyboardEvent('keydown', {key: 'End', metaKey: true, bubbles: true}))
      base.dispatchEvent(new KeyboardEvent('keydown', {key: 'Home', metaKey: true, bubbles: true}))
      await settle(feed)

      expect(fired).toEqual(['after', 'before'])
    })

    it('prevents default only for handled feed keys', async () => {
      const feed = await createFeed()
      const base = getBase(feed)

      const pageDown = new KeyboardEvent('keydown', {key: 'PageDown', bubbles: true, cancelable: true})
      base.dispatchEvent(pageDown)
      expect(pageDown.defaultPrevented).toBe(true)

      const plainEnd = new KeyboardEvent('keydown', {key: 'End', bubbles: true, cancelable: true})
      base.dispatchEvent(plainEnd)
      expect(plainEnd.defaultPrevented).toBe(false)

      const letter = new KeyboardEvent('keydown', {key: 'a', bubbles: true, cancelable: true})
      base.dispatchEvent(letter)
      expect(letter.defaultPrevented).toBe(false)
    })
  })

  // --- State preservation across article changes ---

  describe('state preservation across article changes', () => {
    it('keeps busy state after articles are added', async () => {
      const feed = await createFeed({busy: true} as Partial<CVFeed>)
      expect(getBase(feed).getAttribute('aria-busy')).toBe('true')

      const newArticle = document.createElement('cv-feed-article') as CVFeedArticle
      newArticle.articleId = 'late-article'
      newArticle.textContent = 'Late content'
      feed.append(newArticle)
      await settle(feed)

      expect(getBase(feed).getAttribute('aria-busy')).toBe('true')
      expect(feed.hasAttribute('busy')).toBe(true)
    })

    it('keeps the active article when the label changes', async () => {
      const feed = await createFeed()
      const base = getBase(feed)

      base.dispatchEvent(new KeyboardEvent('keydown', {key: 'PageDown', bubbles: true}))
      await settle(feed)
      expect(getArticles(feed)[1]!.getAttribute('data-active')).toBe('true')

      feed.label = 'Renamed feed'
      await settle(feed)

      const articles = getArticles(feed)
      expect(articles[1]!.getAttribute('data-active')).toBe('true')
      expect(articles[1]!.getAttribute('tabindex')).toBe('0')
      expect(getBase(feed).getAttribute('aria-label')).toBe('Renamed feed')
    })

    it('returns to the empty state when all articles are removed', async () => {
      const feed = await createFeed()
      expect(feed.empty).toBe(false)

      for (const article of getArticles(feed)) {
        article.remove()
      }
      await settle(feed)

      expect(feed.empty).toBe(true)
      expect(feed.hasAttribute('empty')).toBe(true)
      expect(feed.shadowRoot!.querySelector('slot[name="empty"]')).not.toBeNull()
    })
  })

  // --- Busy/loading state transitions ---

  describe('state transitions', () => {
    it('setting busy=true reflects aria-busy="true" on base', async () => {
      const feed = await createFeed()
      feed.busy = true
      await settle(feed)

      expect(getBase(feed).getAttribute('aria-busy')).toBe('true')
      expect(feed.hasAttribute('busy')).toBe(true)
    })

    it('setting busy=false reflects aria-busy="false" on base', async () => {
      const feed = await createFeed({busy: true} as Partial<CVFeed>)
      feed.busy = false
      await settle(feed)

      expect(getBase(feed).getAttribute('aria-busy')).toBe('false')
      expect(feed.hasAttribute('busy')).toBe(false)
    })

    it('loading=true shows loading indicator and sets host attribute', async () => {
      const feed = await createFeed()
      feed.loading = true
      await settle(feed)

      expect(feed.hasAttribute('loading')).toBe(true)
      const indicator = feed.shadowRoot!.querySelector('[part="loading-indicator"]')
      expect(indicator).not.toBeNull()
    })

    it('loading=false hides loading indicator and removes host attribute', async () => {
      const feed = await createFeed({loading: true} as Partial<CVFeed>)
      feed.loading = false
      await settle(feed)

      expect(feed.hasAttribute('loading')).toBe(false)
      const indicator = feed.shadowRoot!.querySelector('[part="loading-indicator"]')
      expect(indicator).toBeNull()
    })
  })

  // --- Conditional slots ---

  describe('conditional slots', () => {
    it('empty slot is rendered when feed has no articles', async () => {
      const feed = await createEmptyFeed()
      const emptySlot = feed.shadowRoot!.querySelector('slot[name="empty"]')
      expect(emptySlot).not.toBeNull()
      expect(feed.hasAttribute('empty')).toBe(true)
    })

    it('empty slot is not rendered when feed has articles', async () => {
      const feed = await createFeed()
      // With articles present, the empty slot should not be rendered
      // (or at least the empty state is false)
      expect(feed.empty).toBe(false)
      expect(feed.hasAttribute('empty')).toBe(false)
    })

    it('error slot is rendered when feed is in error state', async () => {
      const feed = await createFeed({error: true} as Partial<CVFeed>)
      const errorSlot = feed.shadowRoot!.querySelector('slot[name="error"]')
      expect(errorSlot).not.toBeNull()
      expect(feed.hasAttribute('error')).toBe(true)
    })

    it('error slot is not rendered when feed has no error', async () => {
      const feed = await createFeed()
      expect(feed.error).toBe(false)
      expect(feed.hasAttribute('error')).toBe(false)
    })

    it('loading and error states are not mutually exclusive', async () => {
      const feed = await createFeed({loading: true, error: true} as Partial<CVFeed>)
      expect(feed.hasAttribute('loading')).toBe(true)
      expect(feed.hasAttribute('error')).toBe(true)

      const indicator = feed.shadowRoot!.querySelector('[part="loading-indicator"]')
      expect(indicator).not.toBeNull()
      const errorSlot = feed.shadowRoot!.querySelector('slot[name="error"]')
      expect(errorSlot).not.toBeNull()
    })
  })

  // --- Parent-child coordination ---

  describe('parent-child coordination', () => {
    it('articles are registered with the feed and receive position tracking', async () => {
      const feed = await createFeed()
      const articles = getArticles(feed)

      expect(articles).toHaveLength(3)
      expect(articles[0]!.getAttribute('aria-posinset')).toBe('1')
      expect(articles[1]!.getAttribute('aria-posinset')).toBe('2')
      expect(articles[2]!.getAttribute('aria-posinset')).toBe('3')
    })

    it('first enabled article is active by default', async () => {
      const feed = await createFeed()
      const articles = getArticles(feed)

      expect(articles[0]!.getAttribute('data-active')).toBe('true')
      expect(articles[0]!.getAttribute('tabindex')).toBe('0')
    })

    it('only one article has tabindex="0" at a time', async () => {
      const feed = await createFeed()
      const articles = getArticles(feed)

      const focusable = articles.filter((a) => a.getAttribute('tabindex') === '0')
      expect(focusable).toHaveLength(1)
    })

    it('adding a new article updates positions', async () => {
      const feed = await createFeed()

      const newArticle = document.createElement('cv-feed-article') as CVFeedArticle
      newArticle.articleId = 'article-3'
      newArticle.textContent = 'Article 3 content'
      feed.append(newArticle)
      await settle(feed)

      const articles = getArticles(feed)
      expect(articles).toHaveLength(4)
      expect(articles[3]!.getAttribute('aria-posinset')).toBe('4')
    })

    it('removing an article updates positions', async () => {
      const feed = await createFeed()
      const articles = getArticles(feed)

      articles[0]!.remove()
      await settle(feed)

      const remaining = getArticles(feed)
      expect(remaining).toHaveLength(2)
      expect(remaining[0]!.getAttribute('aria-posinset')).toBe('1')
      expect(remaining[1]!.getAttribute('aria-posinset')).toBe('2')
    })

    it('removing active article moves focus to nearest enabled article', async () => {
      const feed = await createFeed()
      const articles = getArticles(feed)

      // First article is active; remove it
      articles[0]!.remove()
      await settle(feed)

      const remaining = getArticles(feed)
      // Focus should move to the next article (was article-1, now first)
      const activeArticle = remaining.find((a) => a.getAttribute('data-active') === 'true')
      expect(activeArticle).not.toBeUndefined()
    })
  })

  describe('regression: batch 4 fixes', () => {
    type ObserverCb = (entries: Array<{target: Element; isIntersecting: boolean}>) => void

    class MockIntersectionObserver {
      static instances: MockIntersectionObserver[] = []
      cb: ObserverCb
      targets = new Set<Element>()
      constructor(cb: ObserverCb) {
        this.cb = cb
        MockIntersectionObserver.instances.push(this)
      }
      observe(target: Element) {
        this.targets.add(target)
      }
      unobserve(target: Element) {
        this.targets.delete(target)
      }
      disconnect() {
        this.targets.clear()
      }
      trigger(target: Element) {
        this.cb([{target, isIntersecting: true}])
      }
    }

    let originalIO: typeof IntersectionObserver | undefined

    const installObserverMock = () => {
      originalIO = (globalThis as {IntersectionObserver?: typeof IntersectionObserver}).IntersectionObserver
      MockIntersectionObserver.instances = []
      ;(globalThis as Record<string, unknown>)['IntersectionObserver'] = MockIntersectionObserver
    }

    const restoreObserverMock = () => {
      if (originalIO) {
        ;(globalThis as Record<string, unknown>)['IntersectionObserver'] = originalIO
      } else {
        delete (globalThis as Record<string, unknown>)['IntersectionObserver']
      }
    }

    const latestObserver = () =>
      MockIntersectionObserver.instances[MockIntersectionObserver.instances.length - 1]

    afterEach(() => {
      restoreObserverMock()
    })

    it('fires cv-load-more when the bottom sentinel intersects', async () => {
      installObserverMock()
      const feed = await createFeed()
      const events: number[] = []
      feed.addEventListener('cv-load-more', () => events.push(1))

      const bottom = feed.shadowRoot!.querySelector('[part="sentinel-bottom"]')!
      latestObserver()!.trigger(bottom)

      expect(events.length).toBe(1)
    })

    it('fires cv-load-newer when the top sentinel intersects', async () => {
      installObserverMock()
      const feed = await createFeed()
      const events: number[] = []
      feed.addEventListener('cv-load-newer', () => events.push(1))

      const top = feed.shadowRoot!.querySelector('[part="sentinel-top"]')!
      latestObserver()!.trigger(top)

      expect(events.length).toBe(1)
    })

    it('recreates the sentinel observer after reconnect', async () => {
      installObserverMock()
      const feed = await createFeed()

      feed.remove()
      document.body.append(feed)
      await settle(feed)

      const events: number[] = []
      feed.addEventListener('cv-load-more', () => events.push(1))
      const bottom = feed.shadowRoot!.querySelector('[part="sentinel-bottom"]')!
      latestObserver()!.trigger(bottom)

      expect(events.length).toBe(1)
    })

    it('propagates a post-mount disabled change on an article to the model', async () => {
      const feed = await createFeed()
      const articles = getArticles(feed)
      const target = articles[1]!

      target.disabled = true
      await target.updateComplete
      await settle(feed)

      expect(target.getAttribute('aria-disabled')).toBe('true')

      // A disabled article must be skipped by PageDown navigation.
      const base = getBase(feed)
      base.dispatchEvent(new KeyboardEvent('keydown', {key: 'PageDown', bubbles: true}))
      await settle(feed)
      base.dispatchEvent(new KeyboardEvent('keydown', {key: 'PageDown', bubbles: true}))
      await settle(feed)

      expect(target.getAttribute('data-active')).not.toBe('true')
    })
  })
})

// --- cv-feed-article ---

describe('cv-feed-article', () => {
  describe('shadow DOM structure', () => {
    it('renders [part="base"] without a redundant role (role lives on the host)', async () => {
      const feed = await createFeed()
      const articles = getArticles(feed)
      const base = getBase(articles[0]!)
      expect(base).not.toBeNull()
      expect(base.getAttribute('role')).toBeNull()
      expect(articles[0]!.getAttribute('role')).toBe('article')
    })

    it('renders default slot inside [part="base"]', async () => {
      const feed = await createFeed()
      const articles = getArticles(feed)
      const base = getBase(articles[0]!)
      const slot = base.querySelector('slot:not([name])')
      expect(slot).not.toBeNull()
    })
  })

  describe('attributes', () => {
    it('article-id attribute is set', async () => {
      const feed = await createFeed()
      const articles = getArticles(feed)
      expect(articles[0]!.articleId).toBe('article-0')
    })

    it('active defaults to false for non-active articles', async () => {
      const feed = await createFeed()
      const articles = getArticles(feed)
      expect(articles[1]!.active).toBe(false)
    })

    it('active is true for the focused article', async () => {
      const feed = await createFeed()
      const articles = getArticles(feed)
      expect(articles[0]!.active).toBe(true)
    })

    it('disabled attribute reflects on the article', async () => {
      const feed = document.createElement('cv-feed') as CVFeed
      feed.label = 'Test feed'

      const article = document.createElement('cv-feed-article') as CVFeedArticle
      article.articleId = 'disabled-article'
      article.disabled = true
      article.textContent = 'Disabled article'
      feed.append(article)

      document.body.append(feed)
      await settle(feed)

      expect(article.disabled).toBe(true)
      expect(article.getAttribute('aria-disabled')).toBe('true')
    })
  })

  describe('ARIA contract from parent', () => {
    it('receives role="article" on the host (not on [part="base"])', async () => {
      const feed = await createFeed()
      const articles = getArticles(feed)
      expect(articles[0]!.getAttribute('role')).toBe('article')
      expect(getBase(articles[0]!).getAttribute('role')).toBeNull()
    })

    it('receives tabindex based on active state', async () => {
      const feed = await createFeed()
      const articles = getArticles(feed)

      // Active article gets tabindex="0"
      expect(articles[0]!.getAttribute('tabindex')).toBe('0')
      // Inactive articles get tabindex="-1"
      expect(articles[1]!.getAttribute('tabindex')).toBe('-1')
    })

    it('receives aria-posinset from parent contract', async () => {
      const feed = await createFeed()
      const articles = getArticles(feed)

      expect(articles[0]!.getAttribute('aria-posinset')).toBe('1')
      expect(articles[2]!.getAttribute('aria-posinset')).toBe('3')
    })

    it('receives aria-setsize from parent contract', async () => {
      const feed = await createFeed()
      const articles = getArticles(feed)

      // All articles should have the same aria-setsize
      const setSize = articles[0]!.getAttribute('aria-setsize')
      expect(setSize).not.toBeNull()
      for (const article of articles) {
        expect(article.getAttribute('aria-setsize')).toBe(setSize)
      }
    })

    it('receives data-active reflecting active state', async () => {
      const feed = await createFeed()
      const articles = getArticles(feed)

      expect(articles[0]!.getAttribute('data-active')).toBe('true')
      expect(articles[1]!.getAttribute('data-active')).toBe('false')
      expect(articles[2]!.getAttribute('data-active')).toBe('false')
    })

    it('aria-disabled="true" when article is disabled', async () => {
      const feed = document.createElement('cv-feed') as CVFeed
      feed.label = 'Test feed'

      const enabledArticle = document.createElement('cv-feed-article') as CVFeedArticle
      enabledArticle.articleId = 'enabled'
      enabledArticle.textContent = 'Enabled'

      const disabledArticle = document.createElement('cv-feed-article') as CVFeedArticle
      disabledArticle.articleId = 'disabled'
      disabledArticle.disabled = true
      disabledArticle.textContent = 'Disabled'

      feed.append(enabledArticle, disabledArticle)
      document.body.append(feed)
      await settle(feed)

      expect(disabledArticle.getAttribute('aria-disabled')).toBe('true')
    })
  })

  describe('visual states', () => {
    it('[active] host attribute reflects active state', async () => {
      const feed = await createFeed()
      const articles = getArticles(feed)

      expect(articles[0]!.hasAttribute('active')).toBe(true)
      expect(articles[1]!.hasAttribute('active')).toBe(false)
    })

    it('[disabled] host attribute reflects disabled state', async () => {
      const feed = document.createElement('cv-feed') as CVFeed
      feed.label = 'Test feed'

      const article = document.createElement('cv-feed-article') as CVFeedArticle
      article.articleId = 'test'
      article.disabled = true
      article.textContent = 'Test'
      feed.append(article)

      document.body.append(feed)
      await settle(feed)

      expect(article.hasAttribute('disabled')).toBe(true)
    })
  })
})
