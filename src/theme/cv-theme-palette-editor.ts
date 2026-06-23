import {css, nothing} from 'lit'

import {html} from '../reatom-lit/index.js'
import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'
import {formatHwbColor} from './palette/generator'
import {
  CV_THEME_PALETTE_CHANNELS,
  CV_THEME_PALETTE_RANGES,
  CV_THEME_PALETTE_ROLES,
  CV_THEME_PALETTE_SCHEMES,
  type CVThemePaletteChannel,
  type CVThemePaletteController,
  type CVThemePaletteRole,
} from './palette/index'
import type {CVThemeScheme} from './types'
import type {CVThemePaletteControllerElement} from './cv-theme-palette-controller'

const roleLabels: Record<CVThemePaletteRole, string> = {
  bg: 'Background',
  surface: 'Surface',
  text: 'Text',
  primary: 'Primary',
  accent: 'Accent',
  success: 'Success',
  warning: 'Warning',
  danger: 'Danger',
}

const channelLabels: Record<CVThemePaletteChannel, string> = {
  h: 'Hue',
  w: 'White',
  b: 'Black',
}

export class CVThemePaletteEditor extends ReatomLitElement {
  static elementName = 'cv-theme-palette-editor'

  static get properties() {
    return {
      model: {attribute: false},
    }
  }

  declare model?: CVThemePaletteController

  static styles = [
    css`
      :host {
        display: block;
        container-type: inline-size;
        color: var(--cv-color-text);
      }

      [part='base'] {
        display: grid;
        gap: var(--cv-space-4);
      }

      [part='scheme'] {
        display: grid;
        gap: var(--cv-space-3);
      }

      [part='scheme-title'] {
        margin: 0;
        font-size: var(--cv-font-size-lg);
        font-weight: var(--cv-font-weight-semibold);
      }

      [part='role-list'] {
        display: grid;
        gap: var(--cv-space-3);
      }

      [part='role-row'] {
        display: grid;
        grid-template-columns: minmax(110px, 150px) minmax(0, 1fr);
        gap: var(--cv-space-3);
        align-items: start;
        padding-block: var(--cv-space-3);
        border-block-end: 1px solid var(--cv-color-border-faint);
      }

      [part='role-heading'] {
        display: flex;
        align-items: center;
        gap: var(--cv-space-2);
        min-inline-size: 0;
      }

      [part='role-name'] {
        font-size: var(--cv-font-size-sm);
        font-weight: var(--cv-font-weight-medium);
      }

      [part='channels'] {
        display: grid;
        gap: var(--cv-space-2);
      }

      [part='channel-row'] {
        display: grid;
        grid-template-columns: 56px minmax(120px, 1fr) 96px;
        gap: var(--cv-space-2);
        align-items: center;
      }

      [part='channel-label'] {
        font-size: var(--cv-font-size-xs);
        color: var(--cv-color-text-muted);
      }

      cv-slider {
        inline-size: 100%;
      }

      cv-number {
        inline-size: 96px;
      }

      [part='status'] {
        min-block-size: 1.4em;
        color: var(--cv-color-danger);
        font-size: var(--cv-font-size-sm);
      }

      [part='actions'] {
        display: flex;
        flex-wrap: wrap;
        gap: var(--cv-space-2);
      }

      button {
        min-block-size: var(--cv-size-control-height);
        padding-inline: var(--cv-space-4);
        border: 1px solid var(--cv-color-border);
        border-radius: var(--cv-radius-sm);
        background: var(--cv-color-surface-2);
        color: var(--cv-color-text);
        font: inherit;
        cursor: pointer;
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }

      button[data-kind='primary'] {
        border-color: var(--cv-color-primary-border);
        background: var(--cv-color-primary);
        color: var(--cv-color-on-primary);
      }

      @container (inline-size < 560px) {
        [part='role-row'],
        [part='channel-row'] {
          grid-template-columns: 1fr;
        }

        cv-number {
          inline-size: 100%;
        }
      }
    `,
  ]

  static define() {
    if (!customElements.get(this.elementName)) {
      customElements.define(this.elementName, this)
    }
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this.resolveModelFromHost()
  }

  private resolveModelFromHost(): void {
    if (this.model) return
    const host = this.closest('cv-theme-palette-controller') as CVThemePaletteControllerElement | null
    if (!host?.model) return
    this.model = host.model
  }

  private getHostController(): CVThemePaletteControllerElement | null {
    return this.closest('cv-theme-palette-controller') as CVThemePaletteControllerElement | null
  }

  private handleChannelInput(event: CustomEvent<{value: number}>) {
    this.updateChannelFromEvent(event)
  }

  private handleChannelChange(event: CustomEvent<{value: number}>) {
    this.updateChannelFromEvent(event)
  }

  private updateChannelFromEvent(event: CustomEvent<{value: number}>): void {
    if (!this.model) return
    const target = event.currentTarget as HTMLElement
    const scheme = target.dataset.scheme as CVThemeScheme
    const role = target.dataset.role as CVThemePaletteRole
    const channel = target.dataset.channel as CVThemePaletteChannel
    this.model.actions.updateChannel(scheme, role, channel, event.detail.value)
  }

  private handleSave() {
    const host = this.getHostController()
    if (host) {
      host.save()
      return
    }
    this.model?.actions.save()
  }

  private handleDiscard() {
    this.model?.actions.discard()
  }

  private handleReset() {
    this.model?.actions.resetDefaults()
  }

  protected override render() {
    const model = this.model
    if (!model) return nothing

    const draft = model.state.draft()
    const validation = model.state.validation()
    const canSave = model.state.canSave()
    const isDirty = model.state.isDirty()
    const firstIssue = validation.issues[0]?.message ?? ''

    return html`
      <div part="base">
        ${CV_THEME_PALETTE_SCHEMES.map(
          (scheme) => html`
            <section part="scheme" data-scheme=${scheme}>
              <h3 part="scheme-title">${scheme === 'dark' ? 'Dark' : 'Light'}</h3>
              <div part="role-list">
                ${CV_THEME_PALETTE_ROLES.map((role) => this.renderRole(scheme, role, draft.schemes[scheme][role]))}
              </div>
            </section>
          `,
        )}
        <div part="status" role="status" aria-live="polite">${firstIssue}</div>
        <div part="actions">
          <button data-kind="primary" ?disabled=${!canSave} @click=${this.handleSave}>Save</button>
          <button ?disabled=${!isDirty} @click=${this.handleDiscard}>Discard</button>
          <button @click=${this.handleReset}>Reset</button>
        </div>
      </div>
    `
  }

  private renderRole(scheme: CVThemeScheme, role: CVThemePaletteRole, color: {h: number; w: number; b: number}) {
    return html`
      <div part="role-row" data-role=${role}>
        <div part="role-heading">
          <cv-theme-palette-swatch .color=${formatHwbColor(color)} .label=${`${scheme} ${role}`}></cv-theme-palette-swatch>
          <span part="role-name">${roleLabels[role]}</span>
        </div>
        <div part="channels">
          ${CV_THEME_PALETTE_CHANNELS.map((channel) => this.renderChannel(scheme, role, channel, color[channel]))}
        </div>
      </div>
    `
  }

  private renderChannel(
    scheme: CVThemeScheme,
    role: CVThemePaletteRole,
    channel: CVThemePaletteChannel,
    value: number,
  ) {
    const range = CV_THEME_PALETTE_RANGES[scheme][role][channel]
    return html`
      <label part="channel-row">
        <span part="channel-label">${channelLabels[channel]}</span>
        <cv-slider
          .value=${value}
          .min=${range.min}
          .max=${range.max}
          .step=${range.step}
          data-scheme=${scheme}
          data-role=${role}
          data-channel=${channel}
          aria-label=${`${scheme} ${role} ${channelLabels[channel]}`}
          @cv-input=${this.handleChannelInput}
          @cv-change=${this.handleChannelChange}
        ></cv-slider>
        <cv-number
          .value=${value}
          .min=${range.min}
          .max=${range.max}
          .step=${range.step}
          data-scheme=${scheme}
          data-role=${role}
          data-channel=${channel}
          aria-label=${`${scheme} ${role} ${channelLabels[channel]} value`}
          @cv-change=${this.handleChannelChange}
        ></cv-number>
      </label>
    `
  }
}
