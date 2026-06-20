import type {UikitVisualCase} from '../component-visual-types'
import {setElementProps, visualCase, waitForElementUpdate} from './helpers'

export const navigationDisclosureCases: readonly UikitVisualCase[] = [
  visualCase({
    id: 'cv-accordion/states',
    component: 'cv-accordion',
    title: 'Accordion single, multiple, expanded, disabled, custom icon, and long content states',
    states: ['single', 'multiple', 'expanded', 'disabled-item', 'custom-icon', 'long-content'],
    viewports: ['compact', 'default'],
    requiredSelectors: [
      'cv-accordion-item[value="identity"] [part="panel"]',
      'cv-accordion-item[value="one"] [part="panel"]',
      'cv-accordion-item[value="two"] [part="panel"]',
    ],
    html: `
      <div class="visual-grid">
        <cv-accordion value="identity" aria-label="Single accordion">
          <cv-accordion-item value="identity" expanded>
            <span slot="trigger">Identity</span>
            <p>Expanded accordion panel content with body copy.</p>
          </cv-accordion-item>
          <cv-accordion-item value="recovery">
            <span slot="trigger">Recovery path with a longer trigger label that wraps under pressure</span>
            <p>Collapsed recovery content.</p>
          </cv-accordion-item>
          <cv-accordion-item value="disabled" disabled>
            <span slot="trigger">Disabled section</span>
            <p>Disabled content.</p>
          </cv-accordion-item>
        </cv-accordion>
        <cv-accordion data-visual-id="multi" allow-multiple aria-label="Multiple accordion">
          <cv-accordion-item value="one">
            <span slot="trigger">First expanded section with a long label</span>
            <p>First visible body.</p>
          </cv-accordion-item>
          <cv-accordion-item value="two">
            <span slot="trigger">Second expanded section with custom icons</span>
            <span slot="expand-icon">+</span>
            <span slot="collapse-icon">-</span>
            <p>Second visible body.</p>
          </cv-accordion-item>
        </cv-accordion>
      </div>
    `,
    async afterMount(root) {
      const multi = setElementProps<HTMLElement>(root, 'cv-accordion[data-visual-id="multi"]', {
        expandedValues: ['one', 'two'],
      })
      await waitForElementUpdate(multi)
      for (const item of root.querySelectorAll('cv-accordion-item')) {
        await waitForElementUpdate(item)
      }
    },
  }),
  visualCase({
    id: 'cv-breadcrumb/states',
    component: 'cv-breadcrumb',
    title: 'Breadcrumb links, current item, prefix, suffix, and custom separator',
    states: ['link-items', 'current', 'prefix', 'suffix', 'separator', 'long-label'],
    html: `
      <div class="visual-stack">
        <cv-breadcrumb aria-label="Breadcrumb">
          <cv-breadcrumb-item value="home" href="#home">Home</cv-breadcrumb-item>
          <cv-breadcrumb-item value="vaults" href="#vaults">
            <span slot="prefix">⌂</span>
            Vaults
          </cv-breadcrumb-item>
          <cv-breadcrumb-item value="current" current>
            Current workspace with a long label
            <span slot="suffix">•</span>
          </cv-breadcrumb-item>
        </cv-breadcrumb>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-disclosure/states',
    component: 'cv-disclosure',
    title: 'Disclosure open, closed, disabled, and long content states',
    states: ['closed', 'open', 'disabled', 'long-content'],
    html: `
      <div class="visual-grid">
        <cv-disclosure>
          <span slot="trigger">Closed disclosure</span>
          <p>Hidden by default.</p>
        </cv-disclosure>
        <cv-disclosure open>
          <span slot="trigger">Open disclosure</span>
          <p class="visual-long-text">Visible disclosure content with longer body copy that exercises wrapping.</p>
        </cv-disclosure>
        <cv-disclosure disabled>
          <span slot="trigger">Disabled disclosure</span>
          <p>Disabled content.</p>
        </cv-disclosure>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-tabs/states',
    component: 'cv-tabs',
    title: 'Tabs horizontal, vertical, selected, disabled, closable, and long panel states',
    states: ['horizontal', 'vertical', 'selected', 'disabled-tab', 'closable', 'long-content'],
    html: `
      <div class="visual-wide-grid">
        <cv-tabs value="overview">
          <cv-tab slot="nav" value="overview" closable>Overview</cv-tab>
          <cv-tab slot="nav" value="activity">Activity</cv-tab>
          <cv-tab slot="nav" value="disabled" disabled>Disabled</cv-tab>
          <cv-tab-panel tab="overview">Overview panel with key workspace metrics.</cv-tab-panel>
          <cv-tab-panel tab="activity">Activity panel content.</cv-tab-panel>
          <cv-tab-panel tab="disabled">Disabled panel.</cv-tab-panel>
        </cv-tabs>
        <cv-tabs class="visual-wide-row" value="settings" orientation="vertical">
          <cv-tab slot="nav" value="settings">Settings</cv-tab>
          <cv-tab slot="nav" value="members">Members</cv-tab>
          <cv-tab-panel tab="settings">
            <p class="visual-long-text">Vertical panel content validates side-by-side tab and panel layout.</p>
          </cv-tab-panel>
          <cv-tab-panel tab="members">Members panel.</cv-tab-panel>
        </cv-tabs>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-pagination/states',
    component: 'cv-pagination',
    title: 'Pagination normal, compact, disabled, boundary, and ellipsis states',
    states: ['page', 'page-count', 'ellipsis', 'compact', 'disabled'],
    html: `
      <div class="visual-stack">
        <cv-pagination page="5" page-count="18" aria-label="Results pages"></cv-pagination>
        <cv-pagination page="2" page-count="8" compact aria-label="Compact pages"></cv-pagination>
        <cv-pagination page="1" page-count="4" disabled aria-label="Disabled pages"></cv-pagination>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-steps/states',
    component: 'cv-steps',
    title: 'Steps horizontal, vertical, current, complete, error, disabled, and selectable states',
    states: ['horizontal', 'vertical', 'current', 'complete', 'error', 'disabled', 'selectable'],
    viewports: ['compact', 'default'],
    requiredSelectors: [
      'cv-steps[selectable]',
      'cv-step[status="complete"]',
      'cv-step[status="current"]',
      'cv-step[status="error"]',
      'cv-step[disabled]',
    ],
    html: `
      <div class="visual-wide-grid">
        <cv-steps current="encrypt" selectable>
          <cv-step value="prepare" status="complete">
            <span slot="marker">1</span>
            Prepare archive
          </cv-step>
          <cv-step value="encrypt" status="current">
            <span slot="marker">2</span>
            Encrypt files
          </cv-step>
          <cv-step value="upload" status="pending">
            <span slot="marker">3</span>
            Upload bundle with a longer label
          </cv-step>
          <cv-step value="verify" status="error">
            <span slot="marker">!</span>
            Verify receipt
          </cv-step>
        </cv-steps>
        <cv-steps orientation="vertical" current="two">
          <cv-step value="one" status="complete">
            <span slot="marker">✓</span>
            First vertical step
          </cv-step>
          <cv-step value="two" status="current">
            <span slot="marker">2</span>
            Current vertical step
          </cv-step>
          <cv-step value="three" status="pending">Pending vertical step</cv-step>
          <cv-step value="four" disabled>Disabled vertical step</cv-step>
        </cv-steps>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-sidebar/states',
    component: 'cv-sidebar',
    title: 'Sidebar expanded, collapsed, active item, disabled item, header, and footer states',
    states: ['expanded', 'collapsed', 'active-item', 'disabled-item', 'header', 'footer', 'sizes'],
    html: `
      <div class="visual-grid">
        <cv-sidebar aria-label="Workspace navigation">
          <strong slot="header">ChromVoid</strong>
          <cv-sidebar-item href="#overview" active>
            <span slot="prefix">•</span>
            Overview
          </cv-sidebar-item>
          <cv-sidebar-item href="#vaults">Vaults</cv-sidebar-item>
          <cv-sidebar-item href="#settings" disabled>Settings</cv-sidebar-item>
          <span slot="footer">v0.2 visual</span>
        </cv-sidebar>
        <cv-sidebar collapsed size="small" aria-label="Collapsed navigation">
          <strong slot="header">Threat Model</strong>
          <cv-sidebar-item href="#one" active>
            <span slot="prefix">A</span>
            Assets
            <span slot="suffix">live</span>
          </cv-sidebar-item>
          <cv-sidebar-item href="#two">
            <span slot="prefix">B</span>
            Boundaries
          </cv-sidebar-item>
        </cv-sidebar>
      </div>
    `,
  }),
  visualCase({
    id: 'cv-drawer/open',
    component: 'cv-drawer',
    title: 'Drawer open, placement, trigger, title, description, body, and footer states',
    states: ['open', 'placement-end', 'trigger', 'title', 'description', 'footer'],
    fullPage: true,
    requiredSelectors: ['cv-drawer [part="panel"]', 'cv-drawer [part="header-close"]'],
    html: `
      <div class="visual-stack">
        <cv-drawer open placement="end">
          <cv-button slot="trigger">Open drawer</cv-button>
          <span slot="title">Drawer title</span>
          <span slot="description">Drawer description copy.</span>
          <div class="visual-stack">
            <p>Drawer body content with a focused action stack.</p>
            <cv-field>
              <span slot="label">Drawer field</span>
              <cv-input value="Editable value"></cv-input>
            </cv-field>
          </div>
          <div slot="footer" class="visual-row">
            <cv-button>Cancel</cv-button>
            <cv-button variant="primary">Save</cv-button>
          </div>
        </cv-drawer>
      </div>
    `,
  }),
]
