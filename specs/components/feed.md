# cv-feed

Bidirectional infinite-scrolling feed container that dynamically loads articles as the user scrolls, with APG-compliant keyboard navigation and focus management.

**Headless:** [`createFeed`](https://github.com/chromvoid/headless-ui/blob/main/specs/components/feed.md)

## Cross-Spec Consistency

This document is the UIKit surface contract for Feed.

- Headless `createFeed` is the source of truth for state, transitions, and invariants.
- UIKit mirrors headless contracts through DOM attributes and events.
- Any intentional divergence between UIKit and headless MUST be documented in both specs.

## Anatomy

```
<cv-feed> (host)
└── <div part="base" role="feed">
    ├── <div part="sentinel-top">                ← IntersectionObserver target for loading newer
    ├── <div part="loading-indicator" aria-hidden="true">  ← only when [loading]
    │   └── <slot name="loading">
    ├── <slot name="empty">                      ← only when [empty]
    ├── <slot name="error">                      ← only when [error]
    ├── <slot>                                   ← accepts <cv-feed-article> children
    └── <div part="sentinel-bottom">             ← IntersectionObserver target for loading more
```

## Attributes

| Attribute | Type    | Default | Description                                                              |
| --------- | ------- | ------- | ------------------------------------------------------------------------ |
| `label`   | String  | `""`    | Accessible name for the feed (`aria-label`)                              |
| `busy`    | Boolean | `false` | Reflects `aria-busy` during load operations                              |
| `loading` | Boolean | `false` | Shows loading indicator                                                  |
| `empty`   | Boolean | `false` | Indicates no articles are loaded (read-only, reflected from headless)    |
| `error`   | Boolean | `false` | Indicates an error state is present (read-only, reflected from headless) |

## Slots

| Slot        | Description                                      |
| ----------- | ------------------------------------------------ |
| `(default)` | One or more `<cv-feed-article>` children         |
| `empty`     | Content shown when the feed has no articles      |
| `error`     | Content shown when the feed is in an error state |
| `loading`   | Custom loading indicator content                 |

## CSS Parts

| Part                | Element  | Description                                           |
| ------------------- | -------- | ----------------------------------------------------- |
| `base`              | `<div>`  | Root wrapper with `role="feed"`                       |
| `sentinel-top`      | `<div>`  | Top intersection sentinel for loading newer content   |
| `sentinel-bottom`   | `<div>`  | Bottom intersection sentinel for loading more content |
| `empty`             | `<slot>` | Empty state slot wrapper                              |
| `error`             | `<slot>` | Error state slot wrapper                              |
| `loading-indicator` | `<div>`  | Loading indicator wrapper                             |

## CSS Custom Properties

| Property                       | Default                   | Description                                         |
| ------------------------------ | ------------------------- | --------------------------------------------------- |
| `--cv-feed-gap`                | `var(--cv-space-3, 12px)` | Spacing between articles                            |
| `--cv-feed-padding-block`      | `var(--cv-space-3, 12px)` | Vertical padding of the feed container              |
| `--cv-feed-padding-inline`     | `0`                       | Horizontal padding of the feed container            |
| `--cv-feed-sentinel-height`    | `1px`                     | Height of sentinel elements (should remain minimal) |
| `--cv-feed-loading-min-height` | `48px`                    | Minimum height of the loading indicator area        |

## Visual States

| Host selector      | Description                                                       |
| ------------------ | ----------------------------------------------------------------- |
| `:host([busy])`    | Feed is busy loading content; `aria-busy="true"` on the feed root |
| `:host([loading])` | Loading indicator is visible                                      |
| `:host([empty])`   | Feed has no articles; empty slot is rendered                      |
| `:host([error])`   | Feed has an error; error slot is rendered                         |

## ARIA Contract

- Root element has `role="feed"`
- Root element exposes `aria-label` (from `label` attribute) and `aria-busy` (from `busy` attribute)
- The feed container itself is NOT focusable
- Articles are focusable via roving tabindex managed by headless
- `Ctrl+End` and `Ctrl+Home` move focus outside the feed (adapter responsibility)

All ARIA attributes on the feed root are derived from `contracts.getFeedProps()`. UIKit does not compute ARIA state independently.

## Events

| Event            | Detail | Description                                                               |
| ---------------- | ------ | ------------------------------------------------------------------------- |
| `cv-load-more`   | `{}`   | Fired when the bottom sentinel enters the viewport (IntersectionObserver) |
| `cv-load-newer`  | `{}`   | Fired when the top sentinel enters the viewport (IntersectionObserver)    |
| `cv-exit-after`  | `{}`   | Fired on `Ctrl+End`; consumer should move focus after the feed            |
| `cv-exit-before` | `{}`   | Fired on `Ctrl+Home`; consumer should move focus before the feed          |

These events are output-only signals. The feed does not use `input` or `change` events because it has no user-modifiable value state.

## Reactive State Mapping

`cv-feed` is a visual adapter over headless `createFeed`.

### Attribute to Headless (UIKit -> Headless)

| UIKit Property | Direction      | Headless Binding                               |
| -------------- | -------------- | ---------------------------------------------- |
| `label`        | attr -> option | passed as `ariaLabel` in `createFeed(options)` |
| `busy`         | attr -> action | `actions.setBusy(value)`                       |

### Headless to DOM (Headless -> UIKit)

| Headless State            | Direction       | DOM Reflection                                   |
| ------------------------- | --------------- | ------------------------------------------------ |
| `state.isBusy()`          | state -> attr   | `[busy]` host attribute                          |
| `state.isLoading()`       | state -> attr   | `[loading]` host attribute                       |
| `state.isEmpty()`         | state -> attr   | `[empty]` host attribute                         |
| `state.hasError()`        | state -> attr   | `[error]` host attribute                         |
| `state.error()`           | state -> render | error message available for the error slot       |
| `state.canLoadMore()`     | state -> render | bottom sentinel visibility / observer activation |
| `state.canLoadNewer()`    | state -> render | top sentinel visibility / observer activation    |
| `state.articleIds()`      | state -> render | ordered list for rendering articles              |
| `state.activeArticleId()` | state -> render | focus management on child articles               |

### Contract Spreading

- `contracts.getFeedProps()` is spread onto `[part="base"]` -- applies `role`, `aria-label`, `aria-busy`
- `contracts.getArticleProps(articleId)` is spread onto each `cv-feed-article` child -- applies `role`, `tabindex`, `aria-posinset`, `aria-setsize`, `aria-disabled`, `data-active`, `onFocus`

### UIKit-Only Concerns (NOT in headless)

- IntersectionObserver setup on `[part="sentinel-top"]` and `[part="sentinel-bottom"]`
- DOM focus transfer for `Ctrl+End` / `Ctrl+Home` (dispatches `cv-exit-after` / `cv-exit-before` events)
- Empty state and error state conditional slot rendering
- Loading indicator rendering
- `cv-load-more` and `cv-load-newer` event dispatch

## Behavioral Contract

### Bidirectional Loading

- The bottom sentinel `[part="sentinel-bottom"]` is observed via IntersectionObserver. When it intersects the viewport and `state.canLoadMore()` is `true`, `actions.loadMore()` is called and `cv-load-more` is dispatched.
- The top sentinel `[part="sentinel-top"]` is observed via IntersectionObserver. When it intersects the viewport and `state.canLoadNewer()` is `true`, `actions.loadNewer()` is called and `cv-load-newer` is dispatched.
- Concurrent load operations are guarded by headless (second call is a no-op while loading).

### Keyboard Navigation

Per W3C APG Feed Pattern:

- `PageDown`: move focus to the next article (headless `focusNextArticle`)
- `PageUp`: move focus to the previous article (headless `focusPrevArticle`)
- `Ctrl+End`: dispatch `cv-exit-after` event; consumer moves focus after the feed
- `Ctrl+Home`: dispatch `cv-exit-before` event; consumer moves focus before the feed

Keyboard events are forwarded to `actions.handleKeyDown(event)`. The return value determines adapter behavior:

- `'next'` / `'prev'`: headless handled focus movement
- `'exit-after'`: UIKit dispatches `cv-exit-after`
- `'exit-before'`: UIKit dispatches `cv-exit-before`
- `null`: key not handled, no action

### Conditional Rendering

- When `state.isEmpty()` is `true`, the `empty` named slot is rendered and the default slot is hidden.
- When `state.hasError()` is `true`, the `error` named slot is rendered.
- When `state.isLoading()` is `true`, the `loading` named slot / default loading indicator is rendered.
- Empty and error states are not mutually exclusive with loading; the feed may show a loading indicator alongside an error slot.

## Usage

```html
<div class="feed-demo-shell usage-demo" data-demo="feed" data-live-demo-height="780">
  <section class="feed-demo-hero usage-demo__hero" aria-labelledby="feed-demo-title">
    <div class="feed-demo-copy usage-demo__copy">
      <span class="feed-demo-kicker usage-demo__kicker">Bidirectional stream</span>
      <h3 id="feed-demo-title">Feed emits load requests; consumers slot in new articles.</h3>
      <p>
        This is not virtualization. Scroll sentinels request more records, then the wrapper appends or
        prepends <code>cv-feed-article</code> nodes while the feed exposes a busy update state.
      </p>
    </div>

    <dl class="feed-demo-status" aria-label="Feed runtime state">
      <div>
        <dt>Loaded</dt>
        <dd data-feed-loaded>3 articles</dd>
      </div>
      <div>
        <dt>Active</dt>
        <dd data-feed-active>Latest device handoff</dd>
      </div>
      <div>
        <dt>Busy</dt>
        <dd data-feed-busy>false</dd>
      </div>
      <div>
        <dt>Last event</dt>
        <dd data-feed-last>Ready</dd>
      </div>
    </dl>
  </section>

  <section class="feed-demo-board" aria-label="Interactive feed demo">
    <div class="feed-demo-toolbar" aria-label="Feed demo controls">
      <cv-button data-feed-action="newer" variant="primary">Load newer</cv-button>
      <cv-button data-feed-action="older">Load older</cv-button>
      <cv-button data-feed-action="error" variant="danger">Trigger error</cv-button>
      <cv-button data-feed-action="clear">Clear error</cv-button>
      <cv-button data-feed-action="empty">Empty</cv-button>
      <cv-button data-feed-action="reset">Reset</cv-button>
    </div>

    <div class="feed-demo-main">
      <div class="feed-demo-frame">
        <button type="button" class="feed-demo-boundary" data-feed-before>Focus target before feed</button>

        <div class="feed-demo-scroll-wrap">
          <div class="feed-demo-scroll" data-feed-scroll>
            <cv-feed class="feed-demo-feed" label="Vault activity stream">
              <cv-empty-state
                slot="empty"
                headline="No activity loaded"
                description="Use Reset or either load control to repopulate the stream."
              ></cv-empty-state>
              <cv-callout slot="error" variant="danger">
                Feed failed to load. Clear the error to continue.
              </cv-callout>
            </cv-feed>
          </div>

          <div class="feed-demo-load-status" data-feed-load-status aria-live="polite" hidden>
            <cv-spinner></cv-spinner>
            <span>Loading articles...</span>
          </div>
        </div>

        <button type="button" class="feed-demo-boundary" data-feed-after>Focus target after feed</button>
      </div>

      <aside class="feed-demo-log usage-demo__log" aria-label="Feed event log">
        <span class="feed-demo-label">Event log</span>
        <ol data-feed-events aria-live="polite"></ol>
      </aside>
    </div>
  </section>
</div>

<script>
  document.querySelectorAll('.feed-demo-shell[data-demo="feed"]:not([data-ready])').forEach((shell) => {
    shell.dataset.ready = 'true'

    const feed = shell.querySelector('.feed-demo-feed')
    const scroller = shell.querySelector('[data-feed-scroll]')
    const beforeTarget = shell.querySelector('[data-feed-before]')
    const afterTarget = shell.querySelector('[data-feed-after]')
    const loadedOutput = shell.querySelector('[data-feed-loaded]')
    const activeOutput = shell.querySelector('[data-feed-active]')
    const busyOutput = shell.querySelector('[data-feed-busy]')
    const lastOutput = shell.querySelector('[data-feed-last]')
    const loadStatus = shell.querySelector('[data-feed-load-status]')
    const loadStatusText = loadStatus?.querySelector('span')
    const eventList = shell.querySelector('[data-feed-events]')

    if (
      !feed ||
      !scroller ||
      !loadedOutput ||
      !activeOutput ||
      !busyOutput ||
      !lastOutput ||
      !loadStatus ||
      !loadStatusText ||
      !eventList
    ) {
      return
    }

    const initialRecords = [
      {
        id: 'activity-01',
        title: 'Latest device handoff',
        meta: 'aria-posinset 1',
        body: 'Desktop approved an Android USB bridge session.',
      },
      {
        id: 'activity-02',
        title: 'Muted recovery reminder',
        meta: 'disabled article',
        body: 'Disabled items stay in the set but are skipped by PageDown.',
        disabled: true,
      },
      {
        id: 'activity-03',
        title: 'Encrypted archive opened',
        meta: 'keyboard target',
        body: 'Focus an article, then use PageDown or PageUp to move through the stream.',
      },
    ]
    const newerSeed = [
      {
        id: 'activity-new-02',
        title: 'Fresh sync proof received',
        meta: 'prepended',
        body: 'Newer entries are inserted above the current content.',
      },
      {
        id: 'activity-new-01',
        title: 'Policy changed on phone',
        meta: 'prepended',
        body: 'The focused article contract stays stable as positions are recalculated.',
      },
    ]
    const olderSeed = [
      {
        id: 'activity-old-01',
        title: 'Archive exported',
        meta: 'appended',
        body: 'Older entries are appended when the bottom sentinel or control requests more.',
      },
      {
        id: 'activity-old-02',
        title: 'Vault note imported',
        meta: 'appended',
        body: 'The feed root reports aria-busy while the wrapper simulates loading.',
      },
      {
        id: 'activity-old-03',
        title: 'Pairing challenge reviewed',
        meta: 'appended',
        body: 'All article positions update from the same headless contract.',
      },
    ]

    let newerQueue = []
    let olderQueue = []
    let sentinelLoadArmed = false
    let loadingDirection = null

    const cloneRecords = (records) => records.map((record) => ({...record}))

    const getArticleElements = () => [...feed.querySelectorAll('cv-feed-article')]

    const clearArticles = () => {
      getArticleElements().forEach((article) => article.remove())
    }

    const createArticle = (record) => {
      const article = document.createElement('cv-feed-article')
      article.articleId = record.id
      article.disabled = record.disabled === true
      article.innerHTML = `
        <article class="feed-demo-article">
          <div>
            <h4>${record.title}</h4>
            <p>${record.body}</p>
          </div>
          <span>${record.meta}</span>
        </article>
      `
      return article
    }

    const insertRecords = (records, direction) => {
      const fragment = document.createDocumentFragment()
      records.forEach((record) => fragment.append(createArticle(record)))

      if (direction === 'newer') {
        feed.insertBefore(fragment, feed.querySelector('cv-feed-article'))
        return
      }

      feed.append(fragment)
    }

    const getActiveLabel = () => {
      const active = feed.querySelector('cv-feed-article[data-active="true"] h4')
      return active?.textContent?.trim() || 'none'
    }

    const addEvent = (message) => {
      const item = document.createElement('li')
      item.textContent = message
      lastOutput.textContent = message
      eventList.prepend(item)

      while (eventList.children.length > 5) {
        eventList.lastElementChild?.remove()
      }
    }

    const syncStatus = () => {
      const count = getArticleElements().length
      const busy = feed.busy
        ? 'true'
        : feed.shadowRoot?.querySelector('[part="base"]')?.getAttribute('aria-busy') || 'false'

      loadedOutput.textContent = `${count} ${count === 1 ? 'article' : 'articles'}`
      activeOutput.textContent = getActiveLabel()
      busyOutput.textContent = busy
    }

    const scheduleStatusSync = () => {
      requestAnimationFrame(syncStatus)
    }

    const setBusy = (direction, value) => {
      feed.busy = value
      scroller.toggleAttribute('data-loading', value)
      loadStatus.hidden = !value
      loadStatusText.textContent =
        direction === 'newer' ? 'Prepending newer records...' : 'Appending older records...'
      scheduleStatusSync()
    }

    const loadRecords = async (direction, source) => {
      if (loadingDirection) {
        addEvent(`Ignored ${source}; ${loadingDirection} load is already running.`)
        return
      }

      const queue = direction === 'newer' ? newerQueue : olderQueue
      const batch = queue.splice(0, 2)

      if (batch.length === 0) {
        addEvent(`No ${direction === 'newer' ? 'newer' : 'older'} records left.`)
        return
      }

      loadingDirection = direction
      feed.error = false
      setBusy(direction, true)
      addEvent(`${source}: loading ${batch.length} ${direction} records.`)
      const previousScrollHeight = scroller.scrollHeight
      const previousScrollTop = scroller.scrollTop
      await new Promise((resolve) => setTimeout(resolve, 420))
      insertRecords(batch, direction)
      setBusy(direction, false)
      loadingDirection = null
      scheduleStatusSync()

      if (direction === 'newer' && source.startsWith('cv-load')) {
        requestAnimationFrame(() => {
          scroller.scrollTop = previousScrollTop + (scroller.scrollHeight - previousScrollHeight)
        })
      }

      if (direction === 'newer' && source === 'control') {
        requestAnimationFrame(() => {
          scroller.scrollTop = 0
        })
      }
    }

    const armSentinelLoading = () => {
      if (loadingDirection || sentinelLoadArmed) return
      sentinelLoadArmed = true
      addEvent('Sentinels armed for scroll-triggered loading.')
    }

    const resetFeed = () => {
      newerQueue = cloneRecords(newerSeed)
      olderQueue = cloneRecords(olderSeed)
      sentinelLoadArmed = false
      loadingDirection = null
      feed.error = false
      feed.loading = false
      feed.busy = false
      loadStatus.hidden = true
      scroller.removeAttribute('data-loading')
      clearArticles()
      insertRecords(cloneRecords(initialRecords), 'older')
      addEvent('Reset loaded the initial feed records.')
      scheduleStatusSync()
      requestAnimationFrame(() => {
        scroller.scrollTop = 0
      })
    }

    feed.addEventListener('cv-load-more', () => {
      if (!sentinelLoadArmed) return
      sentinelLoadArmed = false
      void loadRecords('older', 'cv-load-more')
    })

    feed.addEventListener('cv-load-newer', () => {
      if (!sentinelLoadArmed) return
      sentinelLoadArmed = false
      void loadRecords('newer', 'cv-load-newer')
    })

    feed.addEventListener('cv-exit-before', () => {
      addEvent('cv-exit-before moved focus before the feed.')
      beforeTarget?.focus()
    })

    feed.addEventListener('cv-exit-after', () => {
      addEvent('cv-exit-after moved focus after the feed.')
      afterTarget?.focus()
    })

    feed.addEventListener('keydown', (event) => {
      if (event.key === 'PageDown' || event.key === 'PageUp') {
        requestAnimationFrame(() => {
          addEvent(`${event.key} moved active article to ${getActiveLabel()}.`)
          syncStatus()
        })
      }
    })

    shell.querySelectorAll('[data-feed-action]').forEach((control) => {
      control.addEventListener('click', () => {
        const action = control.dataset.feedAction

        if (action === 'newer') void loadRecords('newer', 'control')
        if (action === 'older') void loadRecords('older', 'control')
        if (action === 'error') {
          feed.error = true
          addEvent('Error slot rendered.')
          scheduleStatusSync()
        }
        if (action === 'clear') {
          feed.error = false
          addEvent('Error cleared.')
          scheduleStatusSync()
        }
        if (action === 'empty') {
          clearArticles()
          feed.error = false
          addEvent('Articles removed; empty slot rendered.')
          scheduleStatusSync()
        }
        if (action === 'reset') resetFeed()
      })
    })

    scroller.addEventListener('wheel', armSentinelLoading, {passive: true})
    scroller.addEventListener('touchstart', armSentinelLoading, {passive: true})
    scroller.addEventListener('pointerdown', armSentinelLoading)

    resetFeed()
    addEvent('Use the scroll area or load controls to request more articles.')
  })
</script>
```

## Child Elements

### cv-feed-article

Individual article within a feed. The parent `cv-feed` manages all ARIA attributes on this element via headless contracts.

#### Anatomy

```
<cv-feed-article> (host)
└── <div part="base" role="article">
    └── <slot>
```

#### Attributes

| Attribute    | Type    | Default | Description                                                               |
| ------------ | ------- | ------- | ------------------------------------------------------------------------- |
| `article-id` | String  | `""`    | Required unique identifier for this article within the feed               |
| `active`     | Boolean | `false` | Whether this article is the currently focused article. Managed by parent. |
| `disabled`   | Boolean | `false` | Whether this article is disabled (skipped during keyboard navigation)     |

#### Slots

| Slot        | Description     |
| ----------- | --------------- |
| `(default)` | Article content |

#### CSS Parts

| Part   | Element | Description                        |
| ------ | ------- | ---------------------------------- |
| `base` | `<div>` | Root wrapper with `role="article"` |

#### CSS Custom Properties

| Property                          | Default                                      | Description                             |
| --------------------------------- | -------------------------------------------- | --------------------------------------- |
| `--cv-feed-article-padding`       | `var(--cv-space-3, 12px)`                    | Padding inside the article              |
| `--cv-feed-article-border-radius` | `var(--cv-radius-sm, 6px)`                   | Border radius of the article            |
| `--cv-feed-article-focus-ring`    | `2px solid var(--cv-color-primary, #65d7ff)` | Focus ring style for the active article |

#### Visual States

| Host selector       | Description                                                 |
| ------------------- | ----------------------------------------------------------- |
| `:host([active])`   | Article is the currently focused/active article in the feed |
| `:host([disabled])` | Article is disabled and skipped during keyboard navigation  |

#### Reactive State Mapping

`cv-feed-article` receives its ARIA props from the parent `cv-feed` via `contracts.getArticleProps(articleId)`:

| Contract Prop   | DOM Reflection                                                |
| --------------- | ------------------------------------------------------------- |
| `role`          | `role="article"` on `[part="base"]`                           |
| `tabindex`      | `tabindex="0"` (active) or `tabindex="-1"` (inactive) on host |
| `aria-posinset` | Position within the feed (1-based)                            |
| `aria-setsize`  | Total article count or `-1` if unknown                        |
| `aria-disabled` | `"true"` when article is disabled                             |
| `data-active`   | `"true"` or `"false"` reflecting active state                 |
| `onFocus`       | Sets this article as active in headless state                 |
