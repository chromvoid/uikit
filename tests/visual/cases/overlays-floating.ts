import type {UikitVisualCase} from '../component-visual-types'
import {dataSvg, setElementProps, visualCase} from './helpers'

export const overlaysFloatingCases: readonly UikitVisualCase[] = [
  visualCase({
    id: 'cv-bottom-sheet/open',
    component: 'cv-bottom-sheet',
    title: 'Bottom sheet open, handle, detent, title, body, and footer states',
    states: ['open', 'handle', 'middle-detent', 'title', 'description', 'footer'],
    fullPage: true,
    html: `
      <cv-bottom-sheet open detent="middle" detents="collapsed middle expanded" show-handle>
        <span slot="title">Bottom sheet title</span>
        <span slot="description">Sheet description copy stays below the title.</span>
        <div class="visual-stack">
          <cv-field>
            <span slot="label">Sheet input</span>
            <cv-input value="Sheet value"></cv-input>
          </cv-field>
          <cv-callout variant="info">The sheet is rendered at the middle detent.</cv-callout>
        </div>
        <div slot="footer" class="visual-row">
          <cv-button>Dismiss</cv-button>
          <cv-button variant="primary">Apply</cv-button>
        </div>
      </cv-bottom-sheet>
    `,
  }),
  visualCase({
    id: 'cv-dialog/open',
    component: 'cv-dialog',
    title: 'Dialog open, modal, title, description, body, footer, and close states',
    states: ['open', 'modal', 'title', 'description', 'footer', 'closable'],
    fullPage: true,
    html: `
      <cv-dialog open>
        <cv-button slot="trigger">Open dialog</cv-button>
        <span slot="title">Confirm export</span>
        <span slot="description">Review export settings before continuing.</span>
        <div class="visual-stack">
          <cv-callout variant="warning">Exported files remain encrypted.</cv-callout>
          <cv-field>
            <span slot="label">Archive name</span>
            <cv-input value="vault-export-2026"></cv-input>
          </cv-field>
        </div>
        <div slot="footer" class="visual-row">
          <cv-button>Cancel</cv-button>
          <cv-button variant="primary">Export</cv-button>
        </div>
      </cv-dialog>
    `,
  }),
  visualCase({
    id: 'cv-image-viewer/open',
    component: 'cv-image-viewer',
    title: 'Image viewer open, chrome, thumbnails, actions, busy, and metadata states',
    states: ['open', 'image', 'metadata', 'thumbnails', 'actions', 'chrome-visible'],
    fullPage: true,
    html: `
      <cv-image-viewer open current-index="1" show-thumbnails chrome-visible></cv-image-viewer>
    `,
    afterMount(root) {
      setElementProps(root, 'cv-image-viewer', {
        items: [
          {
            id: 'one',
            title: 'Encrypted diagram',
            alt: 'Encrypted diagram preview',
            meta: ['640 × 420', 'PNG'],
            src: dataSvg('Diagram'),
            thumbnailSrc: dataSvg('Diagram'),
          },
          {
            id: 'two',
            title: 'Vault snapshot',
            alt: 'Vault snapshot preview',
            meta: ['640 × 420', 'PNG'],
            src: dataSvg('Vault'),
            thumbnailSrc: dataSvg('Vault'),
          },
          {
            id: 'three',
            title: 'Attachment preview',
            alt: 'Attachment preview',
            meta: ['640 × 420', 'PNG'],
            src: dataSvg('Attachment'),
            thumbnailSrc: dataSvg('Attachment'),
          },
        ],
        actions: [
          {value: 'download', label: 'Download'},
          {value: 'delete', label: 'Delete', dangerous: true},
        ],
        thumbnailWindow: {
          indices: [0, 1, 2],
          beforeCount: 0,
          afterCount: 0,
          thumbnailStepPx: 64,
        },
      })
    },
  }),
  visualCase({
    id: 'cv-guidance-anchor/content',
    component: 'cv-guidance-anchor',
    title: 'Guidance anchor metadata wrapper with visible child content',
    states: ['registered-metadata', 'display-contents', 'child-content'],
    html: `
      <cv-guidance-anchor anchor-id="import-button" surface="vault" owner="visual-test">
        <cv-button variant="primary">Anchored action</cv-button>
      </cv-guidance-anchor>
    `,
  }),
  visualCase({
    id: 'cv-guidance-panel/states',
    component: 'cv-guidance-panel',
    title: 'Guidance panel variants, icon, progress, compact, and actions',
    states: ['coach-mark', 'hint', 'warning', 'blocked', 'icon', 'progress', 'compact', 'actions'],
    html: `
      <div class="visual-grid">
        <cv-guidance-panel variant="coach-mark" has-icon>
          <span slot="icon">?</span>
          <span slot="title">Coach mark</span>
          <span slot="progress">1 of 3</span>
          <p>Use this action to import encrypted data into the vault.</p>
          <div slot="actions">
            <button data-guidance-action="primary">Next</button>
            <button data-guidance-action="secondary">Skip</button>
          </div>
        </cv-guidance-panel>
        <cv-guidance-panel variant="hint" density="compact">
          <span slot="title">Compact hint</span>
          <p>Hints stay readable in dense surfaces.</p>
        </cv-guidance-panel>
        <cv-guidance-panel variant="warning" has-icon>
          <span slot="icon">!</span>
          <span slot="title">Warning guidance</span>
          <p>Warn before destructive workspace actions.</p>
        </cv-guidance-panel>
        <cv-guidance-panel variant="blocked">
          <span slot="title">Blocked guidance</span>
          <p>This state explains why the flow cannot proceed.</p>
        </cv-guidance-panel>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-popover/states',
    component: 'cv-popover',
    title: 'Popover open, placement, arrow, trigger, and long content states',
    states: ['open', 'placement', 'arrow', 'trigger', 'long-content'],
    fullPage: true,
    html: `
      <div class="visual-row">
        <cv-popover open arrow placement="bottom-start">
          <cv-button slot="trigger">Open popover</cv-button>
          <strong>Popover title</strong>
          <p class="visual-long-text">Popover content with longer body copy validates max width and wrapping.</p>
          <cv-button size="small" variant="primary">Action</cv-button>
        </cv-popover>
        <cv-popover open placement="right">
          <span slot="trigger">Right placement</span>
          <span>Compact content</span>
        </cv-popover>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-tooltip/states',
    component: 'cv-tooltip',
    title: 'Tooltip open, arrow, disabled, hover trigger, and long content states',
    states: ['open', 'arrow', 'disabled', 'trigger', 'long-content'],
    fullPage: true,
    html: `
      <div class="visual-row">
        <cv-tooltip open arrow>
          <cv-button slot="trigger">Hover target</cv-button>
          <span slot="content">Helpful tooltip copy</span>
        </cv-tooltip>
        <cv-tooltip open>
          <cv-button slot="trigger" aria-label="Info">i</cv-button>
          <span slot="content">Long tooltip content that should keep a compact width.</span>
        </cv-tooltip>
        <cv-tooltip disabled open>
          <cv-button slot="trigger">Disabled tooltip</cv-button>
          <span slot="content">Hidden disabled content</span>
        </cv-tooltip>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-menu/states',
    component: 'cv-menu',
    title: 'Menu open, selected, active, disabled, checkbox, radio, and submenu states',
    states: ['open', 'selected', 'active', 'disabled', 'checkbox', 'radio', 'submenu'],
    html: `
      <div class="visual-grid">
        <cv-menu open aria-label="Actions menu">
          <cv-menu-item value="open" active>Open</cv-menu-item>
          <cv-menu-item value="favorite" type="checkbox" checked>Favorite</cv-menu-item>
          <cv-menu-item value="share" selected>Share</cv-menu-item>
          <cv-menu-item value="mode" type="radio" checked>Mode</cv-menu-item>
          <cv-menu-item value="more" has-submenu>More actions</cv-menu-item>
          <cv-menu-item value="disabled" disabled>Disabled</cv-menu-item>
        </cv-menu>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-context-menu/states',
    component: 'cv-context-menu',
    title: 'Context menu open, target, anchor position, active, selected, and disabled states',
    states: ['open', 'target', 'anchor-position', 'active', 'selected', 'disabled'],
    fullPage: true,
    html: `
      <div class="visual-grid">
        <cv-context-menu open anchor-x="120" anchor-y="72" aria-label="Context menu">
          <div slot="target" class="visual-demo-box">Right click target</div>
          <cv-menu-item value="copy" active>Copy</cv-menu-item>
          <cv-menu-item value="rename" selected>Rename</cv-menu-item>
          <cv-menu-item value="delete" disabled>Delete</cv-menu-item>
        </cv-context-menu>
      </div>
    `,
  }),
]
