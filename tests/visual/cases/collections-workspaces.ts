import {setIconBasePath} from '../../../src/components/cv-icon'
import type {UikitVisualCase} from '../component-visual-types'
import {visualCase, waitForElementUpdate} from './helpers'

export const collectionsWorkspacesCases: readonly UikitVisualCase[] = [
  visualCase({
    id: 'cv-feed/states',
    component: 'cv-feed',
    title: 'Feed articles, active, disabled, loading, empty, error, and busy states',
    states: ['articles', 'active', 'disabled', 'loading', 'empty', 'error', 'busy'],
    html: `
      <div class="visual-grid">
        <cv-feed label="Activity feed" busy>
          <cv-feed-article article-id="one" active>
            <div class="visual-list-row"><span>Imported encrypted notes</span><cv-badge variant="success">Done</cv-badge></div>
          </cv-feed-article>
          <cv-feed-article article-id="two">
            <div class="visual-list-row"><span>Shared workspace invite</span><cv-badge variant="primary">New</cv-badge></div>
          </cv-feed-article>
          <cv-feed-article article-id="three" disabled>
            <div class="visual-list-row"><span>Disabled feed item</span><cv-badge>Muted</cv-badge></div>
          </cv-feed-article>
        </cv-feed>
        <cv-feed label="Loading feed" loading>
          <cv-spinner slot="loading"></cv-spinner>
        </cv-feed>
        <cv-feed label="Empty feed" empty>
          <cv-empty-state slot="empty" headline="No activity" description="Activity will appear here."></cv-empty-state>
        </cv-feed>
        <cv-feed label="Error feed" error>
          <cv-callout slot="error" variant="danger">Feed failed to load.</cv-callout>
        </cv-feed>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-carousel/states',
    component: 'cv-carousel',
    title: 'Carousel active slide, visible slides, paused autoplay, controls, and indicators',
    states: ['active-slide', 'visible-slides', 'paused', 'autoplay', 'controls', 'indicators'],
    html: `
      <div class="visual-grid">
        <cv-carousel active-index="1" visible-slides="2" autoplay paused aria-label="Highlights">
          <cv-carousel-slide value="one" label="First slide">
            <div class="visual-panel">
              <strong>First slide</strong>
              <p>Inactive slide content.</p>
            </div>
          </cv-carousel-slide>
          <cv-carousel-slide value="two" label="Second slide">
            <div class="visual-panel">
              <strong>Second slide</strong>
              <p>Active slide content.</p>
            </div>
          </cv-carousel-slide>
          <cv-carousel-slide value="three" label="Third slide">
            <div class="visual-panel">
              <strong>Third slide</strong>
              <p>Additional slide content.</p>
            </div>
          </cv-carousel-slide>
        </cv-carousel>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-grid/states',
    component: 'cv-grid',
    title: 'Grid columns, rows, selected, active, disabled, read-only, and multi-selection states',
    states: [
      'columns',
      'rows',
      'selected-cell',
      'active-cell',
      'disabled-cell',
      'multi-selection',
      'read-only',
    ],
    html: `
      <div class="visual-grid">
        <cv-grid selection-mode="multiple" aria-label="Vault grid" total-row-count="3" total-column-count="3">
          <cv-grid-column slot="columns" value="name" label="Name"></cv-grid-column>
          <cv-grid-column slot="columns" value="status" label="Status"></cv-grid-column>
          <cv-grid-column slot="columns" value="owner" label="Owner"></cv-grid-column>
          <cv-grid-row slot="rows" value="one" index="1">
            <cv-grid-cell column="name" selected>Personal</cv-grid-cell>
            <cv-grid-cell column="status" active><cv-badge variant="success">Synced</cv-badge></cv-grid-cell>
            <cv-grid-cell column="owner">Kaifat</cv-grid-cell>
          </cv-grid-row>
          <cv-grid-row slot="rows" value="two" index="2">
            <cv-grid-cell column="name">Work</cv-grid-cell>
            <cv-grid-cell column="status"><cv-badge variant="warning">Queued</cv-badge></cv-grid-cell>
            <cv-grid-cell column="owner">Team</cv-grid-cell>
          </cv-grid-row>
          <cv-grid-row slot="rows" value="three" index="3" disabled>
            <cv-grid-cell column="name" disabled>Archive</cv-grid-cell>
            <cv-grid-cell column="status">Disabled</cv-grid-cell>
            <cv-grid-cell column="owner">Legacy</cv-grid-cell>
          </cv-grid-row>
        </cv-grid>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-table/states',
    component: 'cv-table',
    title:
      'Table columns, sortable header, selected row, striped, compact, bordered, and sticky header states',
    states: [
      'columns',
      'rows',
      'sortable',
      'selected-row',
      'striped',
      'compact',
      'bordered',
      'sticky-header',
    ],
    html: `
      <div class="visual-grid">
        <cv-table
          aria-label="Vault table"
          sort-column="name"
          sort-direction="ascending"
          selectable="multi"
          striped
          compact
          bordered
          sticky-header
          total-row-count="3"
          total-column-count="3"
        >
          <cv-table-column slot="columns" value="name" label="Name" sortable></cv-table-column>
          <cv-table-column slot="columns" value="status" label="Status" sortable></cv-table-column>
          <cv-table-column slot="columns" value="owner" label="Owner"></cv-table-column>
          <cv-table-row slot="rows" value="one" index="1" selected>
            <cv-table-cell column="name" row-header>Personal</cv-table-cell>
            <cv-table-cell column="status"><cv-badge variant="success">Synced</cv-badge></cv-table-cell>
            <cv-table-cell column="owner">Kaifat</cv-table-cell>
          </cv-table-row>
          <cv-table-row slot="rows" value="two" index="2">
            <cv-table-cell column="name" row-header>Work</cv-table-cell>
            <cv-table-cell column="status"><cv-badge variant="warning">Queued</cv-badge></cv-table-cell>
            <cv-table-cell column="owner">Team</cv-table-cell>
          </cv-table-row>
          <cv-table-row slot="rows" value="three" index="3">
            <cv-table-cell column="name" row-header>Archive</cv-table-cell>
            <cv-table-cell column="status">Read only</cv-table-cell>
            <cv-table-cell column="owner">Legacy</cv-table-cell>
          </cv-table-row>
        </cv-table>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-treegrid/states',
    component: 'cv-treegrid',
    title: 'Treegrid columns, expanded branch, selected row, active cell, disabled row, and child rows',
    states: ['columns', 'expanded-branch', 'selected-row', 'active-cell', 'disabled-row', 'children'],
    requiredSelectors: [
      'cv-treegrid[data-visual-id="tree"] [part="columnheader"]',
      'cv-treegrid[data-visual-id="tree"] cv-treegrid-row[data-visual-id="child-a"]',
      'cv-treegrid[data-visual-id="tree"] cv-treegrid-cell[data-visual-id="root-name"][active]',
    ],
    html: `
      <div class="visual-wide-row">
        <cv-treegrid data-visual-id="tree" aria-label="Vault treegrid" selection-mode="multiple">
          <cv-treegrid-column value="name" label="Name"></cv-treegrid-column>
          <cv-treegrid-column value="status" label="Status"></cv-treegrid-column>
          <cv-treegrid-row data-visual-id="root-row" value="root" index="1">
            <cv-treegrid-cell data-visual-id="root-name" column="name">Workspace</cv-treegrid-cell>
            <cv-treegrid-cell column="status"><cv-badge variant="primary">Open</cv-badge></cv-treegrid-cell>
            <cv-treegrid-row data-visual-id="child-a" slot="children" value="child-a" index="2">
              <cv-treegrid-cell column="name">Notes</cv-treegrid-cell>
              <cv-treegrid-cell column="status"><cv-badge variant="success">Synced</cv-badge></cv-treegrid-cell>
            </cv-treegrid-row>
            <cv-treegrid-row data-visual-id="child-b" slot="children" value="child-b" index="3" disabled>
              <cv-treegrid-cell column="name" disabled>Archive</cv-treegrid-cell>
              <cv-treegrid-cell column="status">Disabled</cv-treegrid-cell>
            </cv-treegrid-row>
          </cv-treegrid-row>
        </cv-treegrid>
      </div>
    `,
    async afterMount(root) {
      const tree = root.querySelector<
        HTMLElement & {expandedValues: string[]; selectedValues: string[]; value: string}
      >('cv-treegrid[data-visual-id="tree"]')
      if (!tree) {
        throw new Error('Visual case selector not found: cv-treegrid[data-visual-id="tree"]')
      }

      await waitForElementUpdate(tree)
      const rootRow = tree.querySelector<HTMLElement & {value?: string}>('[data-visual-id="root-row"]')
      const rootCell = tree.querySelector<HTMLElement & {column?: string}>('[data-visual-id="root-name"]')
      const rootValue = rootRow?.value || rootRow?.getAttribute('value') || 'root'
      const rootColumn = rootCell?.column || rootCell?.getAttribute('column') || 'name'

      tree.expandedValues = [rootValue]
      await waitForElementUpdate(tree)

      tree.selectedValues = [rootValue]
      await waitForElementUpdate(tree)

      tree.value = `${rootValue}::${rootColumn}`
      await waitForElementUpdate(tree)
    },
  }),
  visualCase({
    id: 'cv-treeview/states',
    component: 'cv-treeview',
    title: 'Treeview expanded branch, selected, active, disabled, nested, and multiple-selection states',
    states: ['expanded-branch', 'selected', 'active', 'disabled', 'nested', 'multiple-selection'],
    html: `
      <div class="visual-grid">
        <cv-treeview aria-label="Vault tree" selection-mode="multiple">
          <cv-treeitem value="root" label="Workspace" branch expanded selected active level="1">
            <cv-treeitem slot="children" value="notes" label="Notes" selected level="2"></cv-treeitem>
            <cv-treeitem slot="children" value="files" label="Files" level="2"></cv-treeitem>
            <cv-treeitem slot="children" value="archive" label="Archive" disabled level="2"></cv-treeitem>
          </cv-treeitem>
          <cv-treeitem value="shared" label="Shared" branch level="1">
            <cv-treeitem slot="children" value="team" label="Team vault" level="2"></cv-treeitem>
          </cv-treeitem>
        </cv-treeview>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-toolbar/states',
    component: 'cv-toolbar',
    title: 'Toolbar horizontal, vertical, active item, disabled item, separator, wrap, and icons',
    states: ['horizontal', 'vertical', 'active-item', 'disabled-item', 'separator', 'wrap'],
    html: `
      <div class="visual-grid">
        <cv-toolbar value="bold" wrap aria-label="Editor toolbar">
          <cv-toolbar-item value="bold" active><strong>B</strong></cv-toolbar-item>
          <cv-toolbar-item value="italic"><em>I</em></cv-toolbar-item>
          <cv-toolbar-separator></cv-toolbar-separator>
          <cv-toolbar-item value="link">Link</cv-toolbar-item>
          <cv-toolbar-item value="disabled" disabled>Disabled</cv-toolbar-item>
        </cv-toolbar>
        <cv-toolbar orientation="vertical" aria-label="Vertical toolbar">
          <cv-toolbar-item value="one" active>One</cv-toolbar-item>
          <cv-toolbar-item value="two">Two</cv-toolbar-item>
          <cv-toolbar-separator separator-orientation="horizontal"></cv-toolbar-separator>
          <cv-toolbar-item value="three">Three</cv-toolbar-item>
        </cv-toolbar>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-window-splitter/states',
    component: 'cv-window-splitter',
    title: 'Window splitter horizontal, vertical, fixed, snap, primary, secondary, and separator states',
    states: ['horizontal', 'vertical', 'fixed', 'snap', 'primary', 'secondary', 'separator'],
    viewports: ['default', 'wide'],
    html: `
      <div class="visual-stack">
        <cv-window-splitter class="visual-splitter-frame visual-splitter-frame--compact" position="38" min="20" max="80" snap="30 50 70" aria-label="Horizontal splitter">
          <div slot="primary" class="visual-panel">Navigation pane<br>All entries<br>Shared vaults</div>
          <span slot="separator">⋮</span>
          <div slot="secondary" class="visual-panel">Details pane<br>Selected entry metadata</div>
        </cv-window-splitter>
        <cv-window-splitter class="visual-splitter-frame visual-splitter-frame--compact" orientation="vertical" fixed position="55" aria-label="Vertical splitter">
          <div slot="primary" class="visual-panel">Preview pane</div>
          <span slot="separator">⋯</span>
          <div slot="secondary" class="visual-panel">Activity log</div>
        </cv-window-splitter>
      </div>
    `,
  }),
]
