import {readFileSync} from 'node:fs'
import {resolve} from 'node:path'

import {afterEach, describe, expect, it} from 'vitest'

import {
  CVGuidanceAnchor,
  GUIDANCE_ANCHOR_REGISTER_EVENT,
  GUIDANCE_ANCHOR_UNREGISTER_EVENT,
  type CVGuidanceAnchorEventDetail,
} from './cv-guidance-anchor'

CVGuidanceAnchor.define()

const settle = async (element: CVGuidanceAnchor) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
}

const createGuidanceAnchor = async (attrs?: Partial<CVGuidanceAnchor>) => {
  const el = document.createElement('cv-guidance-anchor') as CVGuidanceAnchor
  if (attrs) Object.assign(el, attrs)
  document.body.append(el)
  await settle(el)
  return el
}

const getRegisterDetails = (target: EventTarget = document.body) => {
  const details: CVGuidanceAnchorEventDetail[] = []
  target.addEventListener(GUIDANCE_ANCHOR_REGISTER_EVENT, (event) => {
    details.push((event as CustomEvent<CVGuidanceAnchorEventDetail>).detail)
  })
  return details
}

const getUnregisterDetails = (target: EventTarget = document.body) => {
  const details: CVGuidanceAnchorEventDetail[] = []
  target.addEventListener(GUIDANCE_ANCHOR_UNREGISTER_EVENT, (event) => {
    details.push((event as CustomEvent<CVGuidanceAnchorEventDetail>).detail)
  })
  return details
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('cv-guidance-anchor', () => {
  it('reflects anchor metadata attributes from properties', async () => {
    const el = await createGuidanceAnchor({
      anchorId: 'files.create-or-upload',
      surface: 'files',
      owner: 'files',
    })

    expect(el.getAttribute('anchor-id')).toBe('files.create-or-upload')
    expect(el.getAttribute('surface')).toBe('files')
    expect(el.getAttribute('owner')).toBe('files')
  })

  it('reads anchor metadata properties from attributes', async () => {
    const el = document.createElement('cv-guidance-anchor') as CVGuidanceAnchor
    el.setAttribute('anchor-id', 'notes.create-note')
    el.setAttribute('surface', 'notes')
    el.setAttribute('owner', 'notes')
    document.body.append(el)
    await settle(el)

    expect(el.anchorId).toBe('notes.create-note')
    expect(el.surface).toBe('notes')
    expect(el.owner).toBe('notes')
  })

  it('dispatches a composed bubbling register event with the host as element', async () => {
    const details = getRegisterDetails()
    const el = await createGuidanceAnchor({
      anchorId: 'nav.passwords',
      surface: 'passwords',
      owner: 'password-manager',
    })

    expect(details).toEqual([
      {
        anchorId: 'nav.passwords',
        surface: 'passwords',
        owner: 'password-manager',
        element: el,
      },
    ])
  })

  it('lets register events cross a shadow boundary', async () => {
    const host = document.createElement('div')
    const shadowRoot = host.attachShadow({mode: 'open'})
    const details = getRegisterDetails(host)
    document.body.append(host)

    const el = document.createElement('cv-guidance-anchor') as CVGuidanceAnchor
    el.anchorId = 'settings.backup'
    el.surface = 'settings'
    el.owner = 'settings'
    shadowRoot.append(el)
    await settle(el)

    expect(details).toHaveLength(1)
    expect(details[0]).toMatchObject({
      anchorId: 'settings.backup',
      surface: 'settings',
      owner: 'settings',
      element: el,
    })
  })

  it('re-registers when anchor semantics change', async () => {
    const details = getRegisterDetails()
    const unregisterDetails = getUnregisterDetails()
    const el = await createGuidanceAnchor({
      anchorId: 'gateway.pair-extension',
      surface: 'gateway',
      owner: 'gateway',
    })

    el.anchorId = 'gateway.open-settings'
    await settle(el)

    expect(details).toHaveLength(2)
    expect(details[0]?.anchorId).toBe('gateway.pair-extension')
    expect(details[1]).toMatchObject({
      anchorId: 'gateway.open-settings',
      surface: 'gateway',
      owner: 'gateway',
      element: el,
    })
    expect(unregisterDetails).toEqual([
      {
        anchorId: 'gateway.pair-extension',
        surface: 'gateway',
        owner: 'gateway',
        element: el,
      },
    ])
  })

  it('dispatches a composed bubbling unregister event on disconnect', async () => {
    const el = await createGuidanceAnchor({
      anchorId: 'remote.connect',
      surface: 'remote',
      owner: 'remote',
    })
    const details = getUnregisterDetails(document.body)

    el.remove()

    expect(details).toEqual([
      {
        anchorId: 'remote.connect',
        surface: 'remote',
        owner: 'remote',
        element: el,
      },
    ])
  })

  it('does not inspect or expose child elements as the anchor target', async () => {
    const details = getRegisterDetails()
    const el = document.createElement('cv-guidance-anchor') as CVGuidanceAnchor
    const button = document.createElement('button')
    button.textContent = 'Create'
    el.anchorId = 'files.create-or-upload'
    el.surface = 'files'
    el.owner = 'files'
    el.append(button)
    document.body.append(el)
    await settle(el)

    expect(details[0]?.element).toBe(el)
    expect(details[0]?.element).not.toBe(button)
  })

  it('keeps UIKit primitive free of app-layer imports', () => {
    const imports = [
      'apps/webview',
      'core/guidance',
      'guidance.model',
      'guidance.registry',
      'navigation',
      'module-access',
      'i18n',
    ]
    const source = readFileSync(resolve('src/components/cv-guidance-anchor.ts'), 'utf8')

    for (const forbiddenImport of imports) {
      expect(source).not.toContain(forbiddenImport)
    }
  })
})
