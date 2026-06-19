import type {UikitVisualCase} from '../component-visual-types'
import {setElementProps, visualCase} from './helpers'

export const navigationDisclosureCases: readonly UikitVisualCase[] = [
  visualCase({
    id: 'cv-accordion/states',
    component: 'cv-accordion',
    title: 'Accordion single, multiple, expanded, disabled, and long content states',
    states: ['single', 'multiple', 'expanded', 'disabled-item', 'long-content'],
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
            <span slot="trigger">Recovery</span>
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
            <span slot="trigger">Second expanded section</span>
            <p>Second visible body.</p>
          </cv-accordion-item>
        </cv-accordion>
      </div>
    `,
    afterMount(root) {
      setElementProps(root, 'cv-accordion[data-visual-id="multi"]', {
        expandedValues: ['one', 'two'],
      })
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
    html: `
      <div class="visual-grid">
        <cv-steps current="encrypt" selectable>
          <cv-step value="prepare" status="complete">Prepare archive</cv-step>
          <cv-step value="encrypt" status="current">Encrypt files</cv-step>
          <cv-step value="upload" status="pending">Upload</cv-step>
          <cv-step value="verify" status="error">Verify</cv-step>
        </cv-steps>
        <cv-steps orientation="vertical" current="two">
          <cv-step value="one" status="complete">First vertical step</cv-step>
          <cv-step value="two" status="current">Current vertical step</cv-step>
          <cv-step value="three" disabled>Disabled vertical step</cv-step>
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
          <strong slot="header">CV</strong>
          <cv-sidebar-item href="#one" active>A</cv-sidebar-item>
          <cv-sidebar-item href="#two">B</cv-sidebar-item>
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
