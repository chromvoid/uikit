import {setIconBasePath} from '../../../src/components/cv-icon'
import type {UikitVisualCase} from '../component-visual-types'
import {dataSvg, setElementProps, visualCase, waitForElementUpdate} from './helpers'

export const overlaysFloatingCases: readonly UikitVisualCase[] = [
  visualCase({
    id: 'cv-bottom-sheet/open',
    component: 'cv-bottom-sheet',
    title: 'Bottom sheet open, handle, detent, title, body, and footer states',
    states: ['open', 'handle', 'middle-detent', 'title', 'description', 'footer'],
    fullPage: true,
    requiredSelectors: ['cv-bottom-sheet cv-dialog [part="content"]', 'cv-bottom-sheet cv-dialog [part="footer"]'],
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
    requiredSelectors: ['cv-image-viewer [part="image"]', 'cv-image-viewer [part="meta"]'],
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
    id: 'cv-image-viewer/mobile-header',
    component: 'cv-image-viewer',
    title: 'Mobile image viewer header with a long filename and compact actions',
    states: ['mobile-layout', 'long-title', 'counter', 'file-type', 'overflow-action', 'close-action'],
    fullPage: true,
    viewports: ['compact'],
    requiredSelectors: ['cv-image-viewer [part="header"]', 'cv-image-viewer [part="meta"]'],
    html: `
      <cv-image-viewer open current-index="0" layout="mobile"></cv-image-viewer>
    `,
    async afterMount(root) {
      setIconBasePath(
        new URL('../../../../../apps/webview/src/assets/icons/lucide', import.meta.url).toString(),
      )

      const viewer = setElementProps<HTMLElement & {updateComplete?: Promise<unknown>}>(
        root,
        'cv-image-viewer',
        {
          items: [
            {
              id: 'heic',
              title: 'IMG20260602172514.heic',
              alt: 'HEIC photo preview',
              meta: ['image/heic'],
              src: dataSvg('Photo'),
            },
          ],
          actions: [
            {value: 'share', label: 'Share'},
            {value: 'delete', label: 'Delete', dangerous: true},
          ],
          showThumbnails: false,
        },
      )

      await waitForElementUpdate(viewer)
      const icons = Array.from(
        viewer.shadowRoot?.querySelectorAll<HTMLElement & {name: string; updateComplete?: Promise<unknown>}>(
          'cv-icon',
        ) ?? [],
      )
      const iconNames = icons.map((icon) => icon.name)

      icons.forEach((icon) => {
        icon.name = ''
      })
      await Promise.all(icons.map((icon) => waitForElementUpdate(icon)))

      icons.forEach((icon, index) => {
        icon.name = iconNames[index] ?? ''
      })
      await new Promise<void>((resolve) => window.setTimeout(resolve, 100))
      await Promise.all(icons.map((icon) => waitForElementUpdate(icon)))

      if (icons.some((icon) => !icon.shadowRoot?.querySelector('svg'))) {
        throw new Error('Image viewer visual case could not load its header icons.')
      }

      const header = viewer.shadowRoot?.querySelector<HTMLElement>('[part="header"]')
      const headerActions = viewer.shadowRoot?.querySelector<HTMLElement>('[part="header-actions"]')
      const headerRect = header?.getBoundingClientRect()
      const headerActionsRect = headerActions?.getBoundingClientRect()

      const actionsAreVisible =
        headerActionsRect && headerRect && headerActionsRect.width >= 80 && headerActionsRect.right <= headerRect.right
      if (!actionsAreVisible) {
        throw new Error(
          `Image viewer mobile header actions are outside the header: width=${headerActionsRect?.width ?? 0} right=${headerActionsRect?.right ?? 0} headerRight=${headerRect?.right ?? 0}`,
        )
      }
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
          <cv-button slot="actions" size="small" variant="primary">Next</cv-button>
          <cv-button slot="actions" size="small">Skip</cv-button>
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
    id: 'cv-popover/bottom-arrow',
    component: 'cv-popover',
    title: 'Popover open bottom-start placement with arrow and long content',
    states: ['open', 'bottom-start', 'arrow', 'trigger', 'long-content'],
    diagnosticsIgnoredSelectors: ['.visual-overlay-frame'],
    requiredSelectors: ['cv-popover[arrow] [part="content"]', 'cv-popover[arrow] [part="arrow"]'],
    html: `
      <div class="visual-overlay-frame">
        <cv-popover open arrow placement="bottom-start" offset="12">
          <cv-button slot="trigger">Open popover</cv-button>
          <strong>Popover title</strong>
          <p class="visual-long-text">Popover content with longer body copy validates max width and wrapping.</p>
          <cv-button size="small" variant="primary">Action</cv-button>
        </cv-popover>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-popover/right-placement',
    component: 'cv-popover',
    title: 'Popover open right placement with compact content',
    states: ['open', 'right-placement', 'trigger', 'compact-content'],
    diagnosticsIgnoredSelectors: ['.visual-overlay-frame'],
    requiredSelectors: ['cv-popover[placement="right"] [part="content"]'],
    html: `
      <div class="visual-overlay-frame visual-overlay-frame--compact">
        <div class="visual-overlay-row">
          <cv-popover open placement="right">
            <cv-button slot="trigger">Right placement</cv-button>
            <div class="visual-popover-panel">
              <span class="visual-popover-panel__title">Sync options</span>
              <span class="visual-popover-panel__body">Choose the next vault sync action.</span>
              <cv-button size="small" variant="primary">Run sync</cv-button>
            </div>
          </cv-popover>
        </div>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-tooltip/open-arrow',
    component: 'cv-tooltip',
    title: 'Tooltip open arrow state',
    states: ['open', 'arrow', 'trigger'],
    diagnosticsIgnoredSelectors: ['.visual-overlay-frame'],
    requiredSelectors: ['cv-tooltip[arrow] [part="content"]', 'cv-tooltip[arrow] [part="arrow"]'],
    html: `
      <div class="visual-overlay-frame">
        <cv-tooltip open arrow>
          <cv-button slot="trigger">Hover target</cv-button>
          <span slot="content">Helpful tooltip copy</span>
        </cv-tooltip>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-tooltip/long-content',
    component: 'cv-tooltip',
    title: 'Tooltip long content state',
    states: ['open', 'long-content', 'compact-width'],
    diagnosticsIgnoredSelectors: ['.visual-overlay-frame'],
    requiredSelectors: ['cv-tooltip[data-visual-id="long"] [part="content"]'],
    html: `
      <div class="visual-overlay-frame">
        <cv-tooltip data-visual-id="long" open>
          <cv-button slot="trigger" aria-label="Info">i</cv-button>
          <span slot="content">Long tooltip content that should keep a compact width.</span>
        </cv-tooltip>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-tooltip/disabled',
    component: 'cv-tooltip',
    title: 'Tooltip disabled trigger state',
    states: ['disabled', 'trigger'],
    html: `
      <div class="visual-row">
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
    diagnosticsIgnoredSelectors: ['.visual-overlay-frame'],
    requiredSelectors: ['cv-context-menu [part="menu"]'],
    html: `
      <div class="visual-overlay-frame visual-overlay-frame--wide">
        <cv-context-menu open anchor-x="320" anchor-y="126" aria-label="Context menu">
          <div slot="target" class="visual-demo-box visual-demo-box--wide">Right click target remains readable</div>
          <cv-menu-item value="copy" active>Copy</cv-menu-item>
          <cv-menu-item value="rename" selected>Rename</cv-menu-item>
          <cv-menu-item value="delete" disabled>Delete</cv-menu-item>
        </cv-context-menu>
      </div>
    `,
  }),
]
