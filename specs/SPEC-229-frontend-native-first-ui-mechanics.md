---
id: SPEC-229
title: UIKit Native-First UI Mechanics
type: spec
status: draft
version: 0.1.0
owner: Team ChromVoid
domain: uikit
priority: medium
created_at: 2026-06-12
updated_at: 2026-06-12
depends_on: [SPEC-225]
blocks: []
replaces: []
tags: [uikit, headless-ui, native-html, css, accessibility, performance, webview]
---

# 1) Краткое описание

## 1.1 Резюме

`SPEC-229` фиксирует native-first правило для UIKit UI-механики и ее потребителей: если поведение можно выразить HTML/CSS без потери accessibility, бизнес-логики и управляемого состояния, начинать нужно с native HTML/CSS или уже существующего UIKit/headless wrapper поверх native API. JavaScript остается для доменной логики, реактивных моделей, workflow state, сложной accessibility-механики и progressive enhancement fallback-ов.

## 1.2 Источники

- [NoLoJS site](https://aarontgrogg.github.io/NoLoJS/) - каталог no/low-JS паттернов для accordion, carousel, lazy media, popover/modal, scroll, tabs and related UI mechanics.
- [NoLoJS repository](https://github.com/aarontgrogg/NoLoJS) - README с принципом сокращать JS workload там, где HTML/CSS уже решают задачу.
- Локальный review агента от 2026-06-12, приложенный к задаче, с сопоставлением NoLoJS-подхода и текущего ChromVoid-кода.

NoLoJS является внешним reference material, а не нормативной зависимостью проекта. Нормативными для UIKit остаются этот документ, `AGENTS.md`, component specs in `packages/uikit/specs`, headless specs and feature specs under root `specs/`.

## 1.3 Постановка проблемы

В ChromVoid уже есть strong JS architecture: Reatom models own state, Lit components render state, UIKit/headless components own reusable behavior. Но часть UI-механики исторически легко уходит в custom JS даже тогда, когда платформа уже дает native primitive: disclosure, top-layer popover/dialog, scroll rails, lazy media and presence animation. Это увеличивает количество listeners, aria wiring, imperative lifecycle code and state synchronization points без продуктовой необходимости, особенно если такая механика попадает в reusable UIKit layer.

## 1.4 Цель

- Уменьшать custom JS для простой UI-механики.
- Закрепить правило выбора native HTML/CSS before custom JS.
- Сохранить существующие Web Components/Reatom границы: бизнес-логика остается в models/controllers/services.
- Не ломать обоснованные JS-heavy поверхности: virtual lists, media gallery, password-manager workflows, real tabs, dialogs and controlled composite widgets.
- Дать reviewer checklist для будущих frontend PR.

---

# 2) Область применения

## 2.1 Входит в область применения

- `packages/uikit/src` components and their specs.
- `packages/headless-ui/src` behavior contracts and their specs when they back UIKit components.
- `apps/webview/src` product UI when it consumes UIKit/headless primitives or chooses native HTML/CSS instead of a UIKit component.
- `backend/landings/src` marketing UI when it uses shared UIKit/frontend interaction patterns.
- Future UIKit/frontend specs, implementation plans and code reviews.

## 2.2 Не входит в область применения

- Core encryption, storage, sync, transports, backend services and Tauri IPC semantics.
- Removing JS from business workflows.
- Replacing existing accessible UIKit/headless components only for lower JS count.
- Rewriting complex product surfaces whose behavior is already model-owned and stateful.

## 2.3 Нецели

- Не вводить "no JS at all" как цель.
- Не запрещать Lit, Reatom, headless-ui or UIKit.
- Не дублировать browser primitives in custom components when the platform primitive is sufficient.
- Не переносить workflow state, permissions, validation or domain decisions into CSS/DOM.

---

# 3) Определения

| Термин | Значение |
| ------ | -------- |
| Native-first | Решение начинается с HTML/CSS/browser API, если они покрывают semantic behavior, accessibility and interaction contract. |
| No-JS UI mechanic | UI-механика, работающая только через HTML/CSS, например simple `<details>/<summary>` disclosure or CSS scroll-snap rail. |
| Low-JS UI mechanic | UI-механика, где JS только связывает native primitive with model state, events, fallback or progressive enhancement. |
| Business logic | Правила домена, workflow, permissions, validation, persistence, security, async side effects and app state transitions. |
| Composite widget | Виджет с coordinated focus/keyboard/selection state across multiple interactive descendants, for example real tabs, menu, combobox or roving-focus accordion. |
| Presence animation | Чисто визуальное появление/исчезновение already-owned state через CSS transitions/animations. |

---

# 4) Нормативный принцип

## 4.1 Decision rule

When adding or changing frontend UI mechanics, choose the first option that satisfies behavior, accessibility, product state and browser support:

1. Native HTML element or CSS feature.
2. Existing UIKit/headless component that wraps native behavior or centralizes accessibility/state.
3. Low-JS adapter that keeps state in model/headless layer and lets HTML/CSS handle mechanics.
4. Custom JS implementation only when the behavior is composite, domain-owned, async, virtualized, gesture-heavy or not reliably expressible with native primitives.

## 4.2 Architecture rule

Native-first does not override ChromVoid component architecture:

- Components render model/headless state and call model/headless actions.
- Models/controllers/services own business logic and workflow state.
- CSS may own appearance, layout, presence animation, scroll behavior and media loading hints.
- DOM state must not become the source of truth when the same state is shared across route, shell or feature components.
- Progressive enhancement fallback belongs in the owning UIKit/headless component or a narrow adapter, not copied across feature components.

## 4.3 Accessibility rule

Native primitives are preferred only when their semantics fit the product interaction. Do not force native mechanics into a shape that creates incorrect roles, broken focus, hidden state ambiguity or unclear keyboard behavior.

---

# 5) Requirements

## 5.1 Functional requirements

| ID | Requirement |
| --- | ----------- |
| **FR-229-001 Disclosure** | Simple FAQ/settings/help/welcome expand-collapse panels should use `<details>/<summary>` or a lightweight `cv-disclosure` path before `cv-accordion`. |
| **FR-229-002 Accordion boundary** | Keep `cv-accordion` for controlled, grouped, roving-focus, APG-heavy or app-state-bound accordion scenarios. Do not use it as the default for simple content disclosure. |
| **FR-229-003 Popover unification** | New menus, guidance panels, lightweight contextual panels and tooltip-like affordances should use `cv-popover` or a component that delegates to it instead of adding feature-local document listeners and positioning. |
| **FR-229-004 Dialog boundary** | Keep `cv-dialog` for modal/non-modal top-layer surfaces that need focus restore, scroll lock, lifecycle events, mobile safe-area behavior or model-owned open state. Do not replace it with ad-hoc native dialog usage in feature code. |
| **FR-229-005 Form choice semantics** | Do not use `role="tablist"` for choices that are not tabs. Entry type, mode and segmented form choices should use radio-group/segmented-control semantics. |
| **FR-229-006 Lazy media** | Images, videos and iframes outside virtualized or immediately critical content should opt into native loading/decoding hints such as `loading="lazy"` and `decoding="async"` where applicable. |
| **FR-229-007 Scroll rails** | Horizontal rails, thumbnails, feature cards and action strips should start from `overflow-x` + CSS scroll snap before JS carousel/swiper logic. |
| **FR-229-008 Carousel boundary** | Use JS only when a rail needs stateful pagination, synchronized selection, zoom/gesture state, analytics-critical lifecycle or non-scroll interaction semantics. |
| **FR-229-009 Presence animation** | For purely visual open/close or enter/exit appearance, JS should own state/lifecycle only; CSS should own the transition using existing tokens and `SPEC-225` motion rules. |
| **FR-229-010 Browser fallback** | If native support is incomplete, progressive enhancement fallback must be centralized in UIKit/headless/shared code, not copied across feature components. |
| **FR-229-011 Review evidence** | Frontend PRs that add custom JS for disclosure, popover, scroll rails, lazy media or visual-only animation should state why native/CSS-first primitives were insufficient. |

## 5.2 Non-functional requirements

| ID | Requirement |
| --- | ----------- |
| **NFR-229-001 Maintainability** | Prefer fewer feature-local listeners, DOM measurements and imperative cleanup paths when native/CSS mechanics cover the behavior. |
| **NFR-229-002 Performance** | Prefer browser-managed scrolling, lazy loading, top-layer behavior and CSS transitions before JS-driven equivalents. |
| **NFR-229-003 Accessibility** | Do not reduce semantic clarity to reduce JS. Correct role, focus, keyboard and announcement behavior outrank JS count. |
| **NFR-229-004 Reactivity** | Do not fix native/CSS integration with polling, `setTimeout`, repeated `requestUpdate()` or DOM queries as state source. |
| **NFR-229-005 Consistency** | Reuse existing UIKit/headless specs and components before adding feature-local variants. |

---

# 6) Component policy

## 6.1 Disclosure and accordion

Preferred order:

1. `<details>/<summary>` for static or local simple disclosure.
2. `cv-disclosure` when ChromVoid styling, events or headless integration are needed.
3. `cv-accordion` when the surface is a true composite widget or needs controlled grouped state.

Do not migrate complex accordions blindly. Migrate only when the use case is simple content reveal and no feature state depends on composite behavior.

## 6.2 Popover and contextual panels

`cv-popover` is the standard for lightweight anchored top-layer/contextual UI. It already owns Popover API detection, native/manual mode and fallback behavior. Feature code should not add its own outside-click, Escape and positioning stack unless the behavior is outside the `cv-popover` contract and the gap is better solved by extending that contract.

## 6.3 Dialog and top layer

`cv-dialog` remains the standard for dialogs and non-modal top-layer surfaces that need lifecycle, focus restore, scroll lock or mobile behavior. Native-first means using the component that already wraps native `<dialog>`/`popover` correctly, not bypassing it in app code.

## 6.4 Tabs, segmented choices and radio groups

Use real tabs only for alternate panels of content where `tablist`/`tab`/`tabpanel` semantics are true. For choosing a type, mode, filter or form variant, use radio-group or segmented-control semantics.

`cv-tabs` remains appropriate for real tabbed interfaces with roving focus, disabled states, close behavior or headless model integration.

## 6.5 Lazy media

Default guidance:

- Add `loading="lazy"` for non-critical images/iframes in long, non-virtualized lists and marketing/content sections.
- Add `decoding="async"` for image previews where immediate synchronous decode is not required.
- Keep eager loading for above-the-fold hero/critical media, canvas-derived flows, measured gallery preloading or virtualized content where lifecycle is already managed.

## 6.6 Scroll rails and carousels

Default guidance:

- Use CSS scroll snap for simple horizontal browsing.
- Use native scroll buttons/links only as enhancement when needed.
- Use JS carousel state only for complex sync, gestures, selection, analytics or non-scroll behavior.

The main media gallery is intentionally outside the simple rail policy because it has gesture, zoom, session and media-state requirements.

## 6.7 CSS presence and motion

For visual-only appearance:

- State owner: model/headless/component state that already exists.
- Visual implementation: CSS transitions/animations, `@starting-style`, `transition-behavior: allow-discrete` where supported, and motion tokens from `SPEC-225`.
- JS responsibility: state changes, lifecycle events and fallback only.

Do not move real workflow transitions into CSS. If a transition affects save/import/delete/move/pairing/auth state, it stays model-owned.

---

# 7) Known ChromVoid baseline

These existing choices are aligned with this spec and should be treated as precedent:

| Area | Existing baseline |
| ---- | ----------------- |
| Popover | `cv-popover` uses native Popover API detection with fallback. |
| Dialog | `cv-dialog` uses native top-layer primitives internally while retaining required lifecycle/focus behavior. |
| Simple disclosure | Some welcome/mobile content already uses `<details>/<summary>`. |
| Lazy media | Some image preview paths already use async decoding. |
| Scroll rails | Landing mobile rail already uses CSS scroll snap. |
| Motion | `SPEC-225` already requires CSS/token/reduced-motion discipline for visual motion. |

---

# 8) Priority adoption targets

| Priority | Target | Expected direction |
| -------- | ------ | ------------------ |
| P1 | Simple FAQ/settings/help/welcome accordions | Prefer `<details>/<summary>` or `cv-disclosure`; keep `cv-accordion` only for composite behavior. |
| P1 | Passmanager entry type switch | Replace tab semantics with radio-group/segmented-choice semantics when touched by related work. |
| P1 | New contextual panels | Use/extend `cv-popover`; avoid feature-local outside-click/positioning stacks. |
| P2 | File thumbnails and long non-virtualized media lists | Add native lazy/decode hints where not already covered by virtualization or critical rendering. |
| P2 | Horizontal action/card rails | Start with CSS scroll snap; add JS only for explicit stateful requirements. |
| P2 | Visual-only open/close animation | Prefer CSS presence; keep JS as state/lifecycle boundary. |

---

# 9) Non-application cases

Do not apply this spec literally to:

- `cv-tabs` for true tabbed surfaces with headless model, roving focus, disabled or close behavior.
- `cv-dialog`, because it already uses native top-layer primitives but still needs JS for lifecycle, focus restore, scroll lock and mobile details.
- Virtual lists, because DOM lifecycle and rendering cost are explicitly JS-managed.
- Media gallery/image viewer, because gesture, zoom, preload, selection and session state are product behavior.
- Password-manager workflows, because entry/group/create/import/OTP navigation is business and security-sensitive app state.
- Any flow where CSS/HTML would become a competing source of truth for Reatom/model state.

---

# 10) Review checklist

For frontend PRs touching UI mechanics, reviewers should ask:

1. Is this simple disclosure, contextual panel, scroll rail, lazy media or visual-only animation?
2. If yes, did the implementation start from native HTML/CSS or existing UIKit/headless primitives?
3. If custom JS was added, is the reason composite behavior, business state, async workflow, virtualization, gestures or browser fallback?
4. Does state still live in Reatom/headless/model/controller/service rather than DOM queries?
5. Are roles and keyboard/focus semantics correct for the actual interaction, not just visually similar?
6. Are fallbacks centralized instead of duplicated in feature code?
7. Are motion and presence changes consistent with `SPEC-225`?

---

# 11) Verification strategy

This spec does not require new tests by itself. Implementation PRs derived from it should verify at the correct layer:

- Unit tests for behavior, events, DOM contract and accessibility state.
- No app-level unit tests that assert product CSS values or computed styles.
- Screenshot/e2e checks for visual regressions, responsive scroll rails, disclosure appearance and motion.
- Browser/manual checks for native Popover API, `<dialog>`, `<details>`, lazy media and CSS scroll-snap behavior when those primitives are central to the change.
