import {
  createPagination,
  type PaginationButtonProps,
  type PaginationModel,
} from '@chromvoid/headless-ui/pagination'
import {css, html, nothing} from 'lit'
import type {PropertyValues} from 'lit'

import {ReatomLitElement} from '../reatom-lit/ReatomLitElement'

export interface CVPaginationChangeDetail {
  page: number
  previousPage: number
}

export type CVPaginationChangeEvent = CustomEvent<CVPaginationChangeDetail>

let cvPaginationNonce = 0

export class CVPagination extends ReatomLitElement {
  static elementName = 'cv-pagination'

  static get properties() {
    return {
      page: {type: Number, reflect: true},
      pageCount: {type: Number, attribute: 'page-count', reflect: true},
      siblingCount: {type: Number, attribute: 'sibling-count'},
      boundaryCount: {type: Number, attribute: 'boundary-count'},
      disabled: {type: Boolean, reflect: true},
      compact: {type: Boolean, reflect: true},
      ariaLabel: {type: String, attribute: 'aria-label'},
    }
  }

  declare page: number
  declare pageCount: number
  declare siblingCount: number
  declare boundaryCount: number
  declare disabled: boolean
  declare compact: boolean
  declare ariaLabel: string

  private readonly idBase = `cv-pagination-${++cvPaginationNonce}`
  private model: PaginationModel

  constructor() {
    super()
    this.page = 1
    this.pageCount = 1
    this.siblingCount = 1
    this.boundaryCount = 1
    this.disabled = false
    this.compact = false
    this.ariaLabel = 'Pagination'
    this.model = this.createModel()
  }

  static styles = [
    css`
      :host {
        display: inline-block;
      }

      [part='list'] {
        display: inline-flex;
        align-items: center;
        gap: var(--cv-pagination-gap, var(--cv-space-1, 4px));
        margin: 0;
        padding: 0;
        list-style: none;
      }

      [part~='button'] {
        min-inline-size: var(--cv-pagination-button-size, 32px);
        block-size: var(--cv-pagination-button-size, 32px);
        border: 1px solid var(--cv-pagination-border-color, var(--cv-color-border, #2a3245));
        border-radius: var(--cv-radius-sm, 6px);
        background: var(--cv-pagination-background, var(--cv-color-surface, #141923));
        color: var(--cv-color-text, #e8ecf6);
        cursor: pointer;
      }

      [part~='button'][aria-current='page'] {
        border-color: var(--cv-color-primary, #65d7ff);
      }

      [part~='button']:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      [part='ellipsis'] {
        min-inline-size: var(--cv-pagination-button-size, 32px);
        text-align: center;
        color: var(--cv-color-text-muted, #9aa6bf);
      }

      :host([compact]) [part='ellipsis'] {
        display: none;
      }
    `,
  ]

  static define() {
    if (!customElements.get(this.elementName)) {
      customElements.define(this.elementName, this)
    }
  }

  override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    if (
      changedProperties.has('siblingCount') ||
      changedProperties.has('boundaryCount') ||
      changedProperties.has('ariaLabel')
    ) {
      this.model = this.createModel()
      this.syncPageFromModel()
      return
    }

    if (changedProperties.has('pageCount')) {
      this.model.actions.setPageCount(this.pageCount)
    }

    if (changedProperties.has('page')) {
      if (this.model.state.disabled()) {
        this.model = this.createModel()
      } else {
        this.model.actions.setPage(this.page)
      }
    }

    if (changedProperties.has('disabled')) {
      this.model.actions.setDisabled(this.disabled)
    }

    this.syncPageFromModel()
  }

  private createModel(): PaginationModel {
    return createPagination({
      idBase: this.idBase,
      page: this.page,
      pageCount: this.pageCount,
      siblingCount: this.siblingCount,
      boundaryCount: this.boundaryCount,
      disabled: this.disabled,
      ariaLabel: this.ariaLabel,
    })
  }

  private syncPageFromModel(): void {
    const nextPage = this.model.state.page()
    if (this.page !== nextPage) {
      this.page = nextPage
    }
  }

  private dispatchPageChange(previousPage: number): void {
    this.dispatchEvent(
      new CustomEvent<CVPaginationChangeDetail>('cv-page-change', {
        detail: {
          page: this.model.state.page(),
          previousPage,
        },
        bubbles: true,
        composed: true,
      }),
    )
  }

  private commitNavigation(action: () => void): void {
    const previousPage = this.model.state.page()
    action()
    this.syncPageFromModel()
    if (this.model.state.page() !== previousPage) {
      this.dispatchPageChange(previousPage)
    }
  }

  private getEventPage(event: Event): number {
    const target = event.currentTarget as HTMLElement
    const page = Number(target.dataset.page)
    return Number.isFinite(page) ? page : this.model.state.page()
  }

  private handlePreviousClick() {
    this.commitNavigation(this.model.actions.previous)
  }

  private handleNextClick() {
    this.commitNavigation(this.model.actions.next)
  }

  private handlePageClick(event: Event) {
    const page = this.getEventPage(event)
    this.commitNavigation(() => this.model.actions.setPage(page))
  }

  private renderButton(
    props: PaginationButtonProps,
    part: string,
    label: string | number,
    clickHandler: (event: Event) => void,
    page?: number,
  ) {
    return html`
      <button
        id=${props.id}
        type=${props.type}
        part=${part}
        data-page=${page ?? nothing}
        aria-label=${props['aria-label']}
        aria-current=${props['aria-current'] ?? nothing}
        aria-disabled=${props['aria-disabled'] ?? nothing}
        ?disabled=${props.disabled}
        @click=${clickHandler}
      >
        ${label}
      </button>
    `
  }

  protected override render() {
    const navProps = this.model.contracts.getNavProps()
    const previousProps = this.model.contracts.getPreviousProps()
    const nextProps = this.model.contracts.getNextProps()

    return html`
      <nav part="nav" role=${navProps.role} aria-label=${navProps['aria-label']}>
        <ol part="list">
          <li part="item">
            ${this.renderButton(previousProps, 'button previous-button', '‹', this.handlePreviousClick)}
          </li>
          ${this.model.state.items().map((item) =>
            item.type === 'ellipsis'
              ? html`
                  <li part="item"><span part="ellipsis" aria-hidden="true">…</span></li>
                `
              : html`
                  <li part="item">
                    ${this.renderButton(
                      this.model.contracts.getPageProps(item.page),
                      'button page-button',
                      item.page,
                      this.handlePageClick,
                      item.page,
                    )}
                  </li>
                `,
          )}
          <li part="item">
            ${this.renderButton(nextProps, 'button next-button', '›', this.handleNextClick)}
          </li>
        </ol>
      </nav>
    `
  }
}
