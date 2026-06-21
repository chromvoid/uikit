# cv-pagination

Page navigation with bounded previous/next actions and current-page announcement.

**Headless:** [`createPagination`](https://github.com/chromvoid/headless-ui/blob/main/specs/components/pagination.md)

## Anatomy

```
<cv-pagination> (host)
└── <nav part="nav" role="navigation" aria-label="Pagination">
    └── <ol part="list">
        ├── <li part="item">
        │   └── <button part="button previous-button">‹</button>
        ├── <li part="item">
        │   └── <button part="button page-button" aria-current="page"?>1</button>
        ├── <li part="item">
        │   └── <span part="ellipsis" aria-hidden="true">…</span>
        └── <li part="item">
            └── <button part="button next-button">›</button>
```

## Attributes

| Attribute        | Type    | Default | Description             |
| ---------------- | ------- | ------- | ----------------------- |
| `page`           | Number  | `1`     | Current page            |
| `page-count`     | Number  | `1`     | Total pages             |
| `sibling-count`  | Number  | `1`     | Adjacent visible pages  |
| `boundary-count` | Number  | `1`     | Start/end visible pages |
| `disabled`       | Boolean | `false` | Blocks navigation       |
| `compact`        | Boolean | `false` | Compact rendering hint  |

## Events

| Event            | Detail                   | Description                                          |
| ---------------- | ------------------------ | ---------------------------------------------------- |
| `cv-page-change` | `{ page, previousPage }` | Fires after user navigation changes the current page |

## CSS Parts

| Part              | Element    | Description                 |
| ----------------- | ---------- | --------------------------- |
| `nav`             | `<nav>`    | Navigation landmark wrapper |
| `list`            | `<ol>`     | Ordered page item list      |
| `item`            | `<li>`     | List item wrapper           |
| `button`          | `<button>` | Shared button part          |
| `previous-button` | `<button>` | Previous page button        |
| `page-button`     | `<button>` | Numbered page button        |
| `next-button`     | `<button>` | Next page button            |
| `ellipsis`        | `<span>`   | Non-interactive range gap   |

## CSS Custom Properties

| Property                       | Default                            | Description               |
| ------------------------------ | ---------------------------------- | ------------------------- |
| `--cv-pagination-gap`          | `var(--cv-space-1, 4px)`           | Gap between page controls |
| `--cv-pagination-button-size`  | `32px`                             | Square button size        |
| `--cv-pagination-border-color` | `var(--cv-color-border, #2a3245)`  | Button border color       |
| `--cv-pagination-background`   | `var(--cv-color-surface, #141923)` | Button background         |

## Usage

```html
<div class="pagination-demo-shell usage-demo" data-demo="pagination">
  <section class="pagination-demo-hero usage-demo__hero" aria-labelledby="pagination-demo-title">
    <div class="pagination-demo-copy usage-demo__copy">
      <span class="pagination-demo-kicker usage-demo__kicker">Page navigation</span>
      <h3 id="pagination-demo-title">Use pagination when the collection has known page bounds.</h3>
      <p>
        <code>cv-pagination</code> renders a navigation landmark, clamps page changes to the available range,
        disables the current page, and emits one event when user navigation commits.
      </p>
    </div>

    <dl class="pagination-demo-metrics usage-demo__metrics" aria-label="Pagination behavior summary">
      <div>
        <dt>Range</dt>
        <dd>ellipsis</dd>
      </div>
      <div>
        <dt>Event</dt>
        <dd>cv-page-change</dd>
      </div>
      <div>
        <dt>Current</dt>
        <dd>aria-current</dd>
      </div>
    </dl>
  </section>

  <section class="pagination-demo-section usage-demo__section" aria-labelledby="pagination-demo-controlled-title">
    <div class="pagination-demo-section-header usage-demo__section-header">
      <span class="pagination-demo-kicker usage-demo__kicker">Controlled list</span>
      <h4 id="pagination-demo-controlled-title">
        Listen for <code>cv-page-change</code> and update the surrounding result state
      </h4>
    </div>

    <div class="pagination-demo-panel pagination-demo-panel--primary usage-demo__panel">
      <div class="pagination-demo-result-head">
        <div>
          <span class="pagination-demo-label">Audit records</span>
          <strong class="pagination-demo-result-title">Evidence package exports</strong>
        </div>
        <output class="pagination-demo-output" aria-live="polite">Page 6 of 24 · records 126-150</output>
      </div>

      <div class="pagination-demo-scroll">
        <cv-pagination
          class="pagination-demo-primary-control"
          page="6"
          page-count="24"
          aria-label="Audit record pages"
        ></cv-pagination>
      </div>
    </div>
  </section>

  <section class="pagination-demo-section usage-demo__section" aria-labelledby="pagination-demo-variants-title">
    <div class="pagination-demo-section-header usage-demo__section-header">
      <span class="pagination-demo-kicker usage-demo__kicker">Variants</span>
      <h4 id="pagination-demo-variants-title">
        Tune density, boundaries, and unavailable states per surface
      </h4>
    </div>

    <div class="pagination-demo-grid">
      <div class="pagination-demo-panel usage-demo__panel">
        <span class="pagination-demo-label">Small collection</span>
        <p>No ellipsis is rendered while every page can fit.</p>
        <div class="pagination-demo-scroll">
          <cv-pagination page="2" page-count="5" aria-label="Small result pages"></cv-pagination>
        </div>
      </div>

      <div class="pagination-demo-panel pagination-demo-panel--wide usage-demo__panel">
        <span class="pagination-demo-label">Long range with wider context</span>
        <p>Increase <code>sibling-count</code> and <code>boundary-count</code> for dense data views.</p>
        <div class="pagination-demo-scroll">
          <cv-pagination
            page="10"
            page-count="32"
            sibling-count="2"
            boundary-count="2"
            aria-label="Vault activity pages"
          ></cv-pagination>
        </div>
      </div>

      <div class="pagination-demo-panel usage-demo__panel">
        <span class="pagination-demo-label">Compact rail</span>
        <p><code>compact</code> hides ellipsis markers for narrow toolbars and mobile-adjacent layouts.</p>
        <div class="pagination-demo-scroll">
          <cv-pagination page="4" page-count="8" compact aria-label="Compact pages"></cv-pagination>
        </div>
      </div>

      <div class="pagination-demo-panel usage-demo__panel">
        <span class="pagination-demo-label">Disabled while loading</span>
        <p><code>disabled</code> blocks navigation while preserving the current page announcement.</p>
        <div class="pagination-demo-scroll">
          <cv-pagination page="3" page-count="5" disabled aria-label="Locked pages"></cv-pagination>
        </div>
      </div>
    </div>
  </section>
</div>

<script>
  document
    .querySelectorAll('.pagination-demo-shell[data-demo="pagination"]:not([data-ready])')
    .forEach((shell) => {
      shell.dataset.ready = 'true'
      const pager = shell.querySelector('.pagination-demo-primary-control')
      const output = shell.querySelector('.pagination-demo-output')
      const pageSize = 25

      const renderPageState = (page, previousPage) => {
        if (!output || !pager) return
        const pageCount = Number(pager.pageCount || pager.getAttribute('page-count') || 1)
        const start = (page - 1) * pageSize + 1
        const end = page * pageSize
        const movement = previousPage && previousPage !== page ? ` · from page ${previousPage}` : ''
        output.textContent = `Page ${page} of ${pageCount} · records ${start}-${end}${movement}`
      }

      pager?.addEventListener('cv-page-change', (event) => {
        renderPageState(event.detail.page, event.detail.previousPage)
      })
    })
</script>
```
