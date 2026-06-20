import {afterEach, describe, expect, it} from 'vitest'

import {CVMenu} from './cv-menu'
import {CVMenuGroup} from './cv-menu-group'
import {CVMenuItem} from './cv-menu-item'

CVMenu.define()
CVMenuGroup.define()
CVMenuItem.define()

const stylesToText = () =>
  (CVMenu.styles as Array<{cssText?: string}>).map((style) => style.cssText ?? '').join('\n')

const settle = async (element: CVMenu) => {
  await element.updateComplete
  await Promise.resolve()
  await element.updateComplete
  await Promise.resolve()
}

async function mountMenu(params: {closeOnSelect?: boolean; open?: boolean; ariaLabel?: string} = {}) {
  const menu = document.createElement('cv-menu') as CVMenu
  if (params.closeOnSelect === false) {
    menu.closeOnSelect = false
  }
  if (params.open === true) {
    menu.open = true
  }
  if (params.ariaLabel) {
    menu.ariaLabel = params.ariaLabel
  }

  menu.innerHTML = `
    <cv-menu-item value="a">Alpha</cv-menu-item>
    <cv-menu-item value="b" disabled>Beta</cv-menu-item>
    <cv-menu-item value="c">Gamma</cv-menu-item>
  `

  document.body.append(menu)
  await settle(menu)

  const root = menu.shadowRoot?.querySelector('[part="base"]') as HTMLElement
  const items = Array.from(menu.querySelectorAll('cv-menu-item')) as CVMenuItem[]

  return {menu, root, items}
}

async function mountMenuWithManyItems(params: {open?: boolean} = {}) {
  const menu = document.createElement('cv-menu') as CVMenu
  if (params.open === true) {
    menu.open = true
  }

  menu.innerHTML = `
    <cv-menu-item value="apple">Apple</cv-menu-item>
    <cv-menu-item value="apricot">Apricot</cv-menu-item>
    <cv-menu-item value="banana">Banana</cv-menu-item>
    <cv-menu-item value="blueberry">Blueberry</cv-menu-item>
    <cv-menu-item value="cherry">Cherry</cv-menu-item>
  `

  document.body.append(menu)
  await settle(menu)

  const root = menu.shadowRoot?.querySelector('[part="base"]') as HTMLElement
  const items = Array.from(menu.querySelectorAll('cv-menu-item')) as CVMenuItem[]

  return {menu, root, items}
}
afterEach(() => {
  document.body.innerHTML = ''
})

describe('cv-menu', () => {
  describe('style contract', () => {
    it('defines discrete display presence for base', () => {
      const cssText = stylesToText()

      expect(cssText).toMatch(/\[part='base'\][\s\S]*transition:[\s\S]*display[\s\S]*allow-discrete/)
      expect(cssText).toMatch(/transition-behavior:\s*allow-discrete/)
    })
  })

  // --- Shadow DOM structure ---

  describe('shadow DOM structure', () => {
    it('renders [part="base"] element', async () => {
      const {root} = await mountMenu()
      expect(root).not.toBeNull()
    })

    it('base has role="menu" from headless contracts', async () => {
      const {root} = await mountMenu()
      expect(root.getAttribute('role')).toBe('menu')
    })

    it('renders a default slot inside base', async () => {
      const {menu} = await mountMenu()
      const slot = menu.shadowRoot!.querySelector('slot:not([name])')
      expect(slot).not.toBeNull()
    })

    it('base is hidden when menu is closed', async () => {
      const {root} = await mountMenu()
      expect(root.hidden).toBe(true)
    })

    it('base is visible when menu is open', async () => {
      const {root} = await mountMenu({open: true})
      expect(root.hidden).toBe(false)
    })
  })

  // --- Default property values ---

  describe('default property values', () => {
    it('has correct defaults', async () => {
      const {menu} = await mountMenu()
      expect(menu.value).toBe('')
      expect(menu.open).toBe(false)
      expect(menu.closeOnSelect).toBe(true)
      expect(menu.ariaLabel).toBe('')
    })
  })

  // --- Attribute reflection ---

  describe('attribute reflection', () => {
    it('open reflects as boolean attribute', async () => {
      const {menu} = await mountMenu({open: true})
      expect(menu.hasAttribute('open')).toBe(true)

      menu.open = false
      await settle(menu)
      expect(menu.hasAttribute('open')).toBe(false)
    })

    it('value reflects as string attribute', async () => {
      const {menu, items} = await mountMenu({open: true})
      items[0]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(menu)
      expect(menu.getAttribute('value')).toBe('a')
    })

    it('close-on-select reflects as boolean attribute', async () => {
      const {menu} = await mountMenu({closeOnSelect: false})
      expect(menu.hasAttribute('close-on-select')).toBe(false)
    })

    it('supports close-on-select="false" for declarative keep-open usage', async () => {
      const menu = document.createElement('cv-menu') as CVMenu
      menu.setAttribute('open', '')
      menu.setAttribute('close-on-select', 'false')
      menu.innerHTML = `
        <cv-menu-item value="a">Alpha</cv-menu-item>
      `

      document.body.append(menu)
      await settle(menu)

      const item = menu.querySelector('cv-menu-item') as CVMenuItem
      item.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(menu)

      expect(menu.closeOnSelect).toBe(false)
      expect(menu.open).toBe(true)
      expect(menu.value).toBe('a')
    })
  })

  // --- Events ---

  describe('events', () => {
    it('input event fires with {value, activeId, open} detail shape', async () => {
      const {menu, root} = await mountMenu({open: true})
      let detail: unknown

      menu.addEventListener('cv-input', (e) => {
        detail = (e as CustomEvent).detail
      })

      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}))
      await settle(menu)

      expect(detail).toHaveProperty('value')
      expect(detail).toHaveProperty('activeId')
      expect(detail).toHaveProperty('open')
    })

    it('change event fires with {value, activeId, open} detail shape on value change', async () => {
      const {menu, root} = await mountMenu({open: true})
      let detail: unknown

      menu.addEventListener('cv-change', (e) => {
        detail = (e as CustomEvent).detail
      })

      // Navigate to first enabled item (a) and select
      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'Home', bubbles: true}))
      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}))
      await settle(menu)

      expect(detail).toHaveProperty('value')
      expect(detail).toHaveProperty('activeId')
      expect(detail).toHaveProperty('open')
    })

    it('change event does not fire when active item changes without value change', async () => {
      const {menu, root} = await mountMenu({open: true})
      let changeCount = 0

      menu.addEventListener('cv-change', () => changeCount++)

      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}))
      await settle(menu)

      expect(changeCount).toBe(0)
    })

    it('input event fires on active item change', async () => {
      const {menu, root} = await mountMenu({open: true})
      let inputCount = 0

      menu.addEventListener('cv-input', () => inputCount++)

      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}))
      await settle(menu)

      expect(inputCount).toBeGreaterThan(0)
    })
  })

  // --- ARIA ---

  describe('ARIA', () => {
    it('base has role="menu"', async () => {
      const {root} = await mountMenu()
      expect(root.getAttribute('role')).toBe('menu')
    })

    it('base has tabindex="-1"', async () => {
      const {root} = await mountMenu()
      expect(root.getAttribute('tabindex')).toBe('-1')
    })

    it('base has aria-label when provided', async () => {
      const {root} = await mountMenu({ariaLabel: 'Actions'})
      expect(root.getAttribute('aria-label')).toBe('Actions')
    })

    it('items get role="menuitem" from headless contracts', async () => {
      const {items} = await mountMenu({open: true})
      for (const item of items) {
        expect(item.getAttribute('role')).toBe('menuitem')
      }
    })

    it('items get tabindex="-1" from headless contracts', async () => {
      const {items} = await mountMenu({open: true})
      for (const item of items) {
        expect(item.getAttribute('tabindex')).toBe('-1')
      }
    })

    it('disabled item gets aria-disabled="true" from headless contracts', async () => {
      const {items} = await mountMenu({open: true})
      const disabledItem = items[1]! // value="b" is disabled
      expect(disabledItem.getAttribute('aria-disabled')).toBe('true')
    })

    it('enabled items do not have aria-disabled attribute', async () => {
      const {items} = await mountMenu({open: true})
      const enabledItem = items[0]!
      expect(enabledItem.hasAttribute('aria-disabled')).toBe(false)
    })
  })

  // --- Keyboard navigation ---

  describe('keyboard navigation', () => {
    it('ArrowDown moves active to next enabled item', async () => {
      const {menu, root, items} = await mountMenu({open: true})

      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}))
      await settle(menu)

      // Should skip disabled item and land on 'c' (Gamma) since 'a' was initial active and 'b' is disabled
      // Or land on first item if no initial active. Behavior depends on headless model.
      const activeItem = items.find((item) => item.getAttribute('data-active') === 'true')
      expect(activeItem).not.toBeUndefined()
    })

    it('ArrowUp moves active to previous enabled item', async () => {
      const {menu, root} = await mountMenu({open: true})

      // Move to end first
      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'End', bubbles: true}))
      await settle(menu)

      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowUp', bubbles: true}))
      await settle(menu)

      // Should skip disabled 'b' and land on 'a'
      const items = Array.from(menu.querySelectorAll('cv-menu-item')) as CVMenuItem[]
      const activeItem = items.find((item) => item.getAttribute('data-active') === 'true')
      expect(activeItem).not.toBeUndefined()
    })

    it('Home moves active to first enabled item', async () => {
      const {menu, root, items} = await mountMenu({open: true})

      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'Home', bubbles: true}))
      await settle(menu)

      expect(items[0]!.getAttribute('data-active')).toBe('true')
    })

    it('End moves active to last enabled item', async () => {
      const {menu, root, items} = await mountMenu({open: true})

      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'End', bubbles: true}))
      await settle(menu)

      expect(items[2]!.getAttribute('data-active')).toBe('true')
    })

    it('Escape closes the menu', async () => {
      const {menu, root} = await mountMenu({open: true})

      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))
      await settle(menu)

      expect(menu.open).toBe(false)
    })

    it('ArrowDown skips disabled items', async () => {
      const {menu, root, items} = await mountMenu({open: true})

      // Navigate: Home -> ArrowDown should skip disabled 'b' and land on 'c'
      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'Home', bubbles: true}))
      await settle(menu)
      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}))
      await settle(menu)

      expect(items[2]!.getAttribute('data-active')).toBe('true')
    })

    it('ArrowDown wraps from last to first enabled item', async () => {
      const {menu, root, items} = await mountMenu({open: true})

      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'End', bubbles: true}))
      await settle(menu)
      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}))
      await settle(menu)

      expect(items[0]!.getAttribute('data-active')).toBe('true')
    })

    it('ArrowUp wraps from first to last enabled item', async () => {
      const {menu, root, items} = await mountMenu({open: true})

      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'Home', bubbles: true}))
      await settle(menu)
      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowUp', bubbles: true}))
      await settle(menu)

      expect(items[2]!.getAttribute('data-active')).toBe('true')
    })

    it('keyboard interaction is safe when all items are disabled', async () => {
      const menu = document.createElement('cv-menu') as CVMenu
      menu.open = true
      menu.innerHTML = `
        <cv-menu-item value="a" disabled>Alpha</cv-menu-item>
        <cv-menu-item value="b" disabled>Beta</cv-menu-item>
      `
      document.body.append(menu)
      await settle(menu)

      const root = menu.shadowRoot!.querySelector('[part="base"]') as HTMLElement
      for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter']) {
        root.dispatchEvent(new KeyboardEvent('keydown', {key, bubbles: true}))
      }
      await settle(menu)

      expect(menu.value).toBe('')
      expect(menu.querySelector('cv-menu-item[data-active="true"]')).toBeNull()
    })
  })

  // --- Typeahead ---

  describe('typeahead', () => {
    it('printable character moves active to matching item by label prefix', async () => {
      const {menu, root, items} = await mountMenuWithManyItems({open: true})

      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'b', bubbles: true}))
      await settle(menu)

      // Should activate an item starting with 'b'
      const activeItem = items.find((item) => item.getAttribute('data-active') === 'true')
      expect(activeItem).not.toBeUndefined()
      expect(activeItem!.value).toMatch(/^b/)
    })

    it('typeahead wraps around to beginning of list', async () => {
      const {menu, root, items} = await mountMenuWithManyItems({open: true})

      // Move to cherry (last)
      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'End', bubbles: true}))
      await settle(menu)

      // Type 'a' should wrap around to apple
      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'a', bubbles: true}))
      await settle(menu)

      const activeItem = items.find((item) => item.getAttribute('data-active') === 'true')
      expect(activeItem).not.toBeUndefined()
      expect(activeItem!.value).toMatch(/^a/)
    })

    it('repeated same letter cycles through items sharing that prefix', async () => {
      const {menu, root, items} = await mountMenuWithManyItems({open: true})

      // Initial active is "apple"; the first "a" advances past it
      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'a', bubbles: true}))
      await settle(menu)
      let activeItem = items.find((item) => item.getAttribute('data-active') === 'true')
      expect(activeItem?.value).toBe('apricot')

      // The second "a" wraps back to "apple"
      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'a', bubbles: true}))
      await settle(menu)
      activeItem = items.find((item) => item.getAttribute('data-active') === 'true')
      expect(activeItem?.value).toBe('apple')
    })

    it('multi-letter query matches items by prefix', async () => {
      const {menu, root, items} = await mountMenuWithManyItems({open: true})

      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'b', bubbles: true}))
      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'l', bubbles: true}))
      await settle(menu)

      const activeItem = items.find((item) => item.getAttribute('data-active') === 'true')
      expect(activeItem?.value).toBe('blueberry')
    })
  })

  // --- Item selection ---

  describe('item selection', () => {
    it('Enter selects the active item and updates value', async () => {
      const {menu, root} = await mountMenu({open: true})

      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'Home', bubbles: true}))
      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}))
      await settle(menu)

      expect(menu.value).toBe('a')
    })

    it('click on item selects it', async () => {
      const {menu, items} = await mountMenu({open: true})

      items[0]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(menu)

      expect(menu.value).toBe('a')
    })

    it('selection closes the menu when closeOnSelect is true (default)', async () => {
      const {menu, items} = await mountMenu({open: true})

      items[0]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(menu)

      expect(menu.open).toBe(false)
    })

    it('selection keeps menu open when closeOnSelect is false', async () => {
      const {menu, items} = await mountMenu({open: true, closeOnSelect: false})

      items[0]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(menu)

      expect(menu.value).toBe('a')
      expect(menu.open).toBe(true)
    })

    it('selected item gets selected=true', async () => {
      const {menu, items} = await mountMenu({open: true, closeOnSelect: false})

      items[0]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(menu)

      expect(items[0]!.selected).toBe(true)
    })

    it('selecting a new item deselects the old one', async () => {
      const {menu, items} = await mountMenu({open: true, closeOnSelect: false})

      items[0]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(menu)
      expect(items[0]!.selected).toBe(true)

      items[2]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(menu)
      expect(items[0]!.selected).toBe(false)
      expect(items[2]!.selected).toBe(true)
    })
  })

  // --- Disabled items ---

  describe('disabled items', () => {
    it('disabled item cannot be selected via click', async () => {
      const {menu, items} = await mountMenu({open: true})

      items[1]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(menu)

      expect(menu.value).not.toBe('b')
    })

    it('disabled item is skipped during keyboard navigation', async () => {
      const {menu, root, items} = await mountMenu({open: true})

      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'Home', bubbles: true}))
      await settle(menu)
      expect(items[0]!.getAttribute('data-active')).toBe('true')

      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}))
      await settle(menu)

      // Should skip 'b' (disabled) and move to 'c'
      expect(items[1]!.getAttribute('data-active')).not.toBe('true')
      expect(items[2]!.getAttribute('data-active')).toBe('true')
    })
  })

  // --- Open/close behavior ---

  describe('open/close behavior', () => {
    it('opens via open property', async () => {
      const {menu, root} = await mountMenu()

      menu.open = true
      await settle(menu)

      expect(menu.open).toBe(true)
      expect(root.hidden).toBe(false)
    })

    it('closes via open property', async () => {
      const {menu, root} = await mountMenu({open: true})

      menu.open = false
      await settle(menu)

      expect(menu.open).toBe(false)
      expect(root.hidden).toBe(true)
    })

    it('closes on outside pointerdown', async () => {
      const {menu} = await mountMenu({open: true})

      document.body.dispatchEvent(new MouseEvent('pointerdown', {bubbles: true}))
      await settle(menu)

      expect(menu.open).toBe(false)
    })

    it('does not close on pointerdown inside the menu', async () => {
      const {menu, items} = await mountMenu({open: true})

      items[0]!.dispatchEvent(new MouseEvent('pointerdown', {bubbles: true, composed: true}))
      await settle(menu)

      expect(menu.open).toBe(true)
    })

    it('Escape close dispatches cv-input with open=false', async () => {
      const {menu, root} = await mountMenu({open: true})
      let detail: {open: boolean} | undefined

      menu.addEventListener('cv-input', (e) => {
        detail = (e as CustomEvent<{open: boolean}>).detail
      })

      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))
      await settle(menu)

      expect(menu.open).toBe(false)
      expect(detail?.open).toBe(false)
    })

    it('[open] attribute reflects on host', async () => {
      const {menu} = await mountMenu({open: true})
      expect(menu.hasAttribute('open')).toBe(true)

      menu.open = false
      await settle(menu)
      expect(menu.hasAttribute('open')).toBe(false)
    })
  })

  // --- Headless contract delegation ---

  describe('headless contract delegation', () => {
    it('role="menu" on base comes from contracts.getMenuProps()', async () => {
      // This verifies the base element gets role from headless, not hardcoded
      const {root} = await mountMenu()
      expect(root.getAttribute('role')).toBe('menu')
    })

    it('item role comes from contracts.getItemProps()', async () => {
      const {items} = await mountMenu({open: true})
      // All normal items should get role="menuitem" from headless
      expect(items[0]!.getAttribute('role')).toBe('menuitem')
    })

    it('item aria-disabled comes from contracts.getItemProps()', async () => {
      const {items} = await mountMenu({open: true})
      const disabledItem = items[1]! // value="b"
      expect(disabledItem.getAttribute('aria-disabled')).toBe('true')
    })

    it('item data-active attribute comes from contracts.getItemProps()', async () => {
      const {menu, root, items} = await mountMenu({open: true})

      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'Home', bubbles: true}))
      await settle(menu)

      expect(items[0]!.getAttribute('data-active')).toBe('true')
      expect(items[2]!.getAttribute('data-active')).toBe('false')
    })

    it('items get id from contracts.getItemProps()', async () => {
      const {items} = await mountMenu({open: true})
      for (const item of items) {
        expect(item.id).toBeTruthy()
      }
    })

    it('base gets id from contracts.getMenuProps()', async () => {
      const {root} = await mountMenu()
      expect(root.id).toBeTruthy()
    })
  })

  // --- Slot change rebuild ---

  describe('slot change rebuild', () => {
    it('preserves selected value on slotchange rebuild when still valid', async () => {
      const {menu, items} = await mountMenu({open: true, closeOnSelect: false})

      items[2]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(menu)
      expect(menu.value).toBe('c')

      items[0]!.remove()
      await settle(menu)

      expect(menu.value).toBe('c')
      expect((menu.querySelector('cv-menu-item[value="c"]') as CVMenuItem).selected).toBe(true)
    })

    it('clears value when the selected item is removed', async () => {
      const {menu, items} = await mountMenu({open: true, closeOnSelect: false})

      items[0]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(menu)
      expect(menu.value).toBe('a')

      items[0]!.remove()
      await settle(menu)

      expect(menu.value).toBe('')
    })
  })

  // --- Checkable items via cv-menu-group ---

  describe('checkable items via cv-menu-group', () => {
    const mountCheckableMenu = async (groupHtml: string) => {
      const menu = document.createElement('cv-menu') as CVMenu
      menu.open = true
      menu.innerHTML = groupHtml
      document.body.append(menu)
      await settle(menu)
      const items = Array.from(menu.querySelectorAll('cv-menu-item')) as CVMenuItem[]
      return {menu, items}
    }

    it('checkbox group item toggles aria-checked without closing or setting value', async () => {
      const {menu, items} = await mountCheckableMenu(`
        <cv-menu-group type="checkbox" label="View">
          <cv-menu-item value="x">X</cv-menu-item>
        </cv-menu-group>
      `)

      expect(items[0]!.getAttribute('role')).toBe('menuitemcheckbox')

      items[0]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(menu)
      expect(items[0]!.getAttribute('aria-checked')).toBe('true')
      expect(items[0]!.checked).toBe(true)
      expect(menu.open).toBe(true)
      expect(menu.value).toBe('')

      items[0]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(menu)
      expect(items[0]!.getAttribute('aria-checked')).toBe('false')
    })

    it('labeled radio group checks exclusively', async () => {
      const {menu, items} = await mountCheckableMenu(`
        <cv-menu-group type="radio" label="Sort">
          <cv-menu-item value="x">X</cv-menu-item>
          <cv-menu-item value="y">Y</cv-menu-item>
        </cv-menu-group>
      `)

      expect(items[0]!.getAttribute('role')).toBe('menuitemradio')

      items[0]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(menu)
      items[1]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(menu)

      expect(items[0]!.getAttribute('aria-checked')).toBe('false')
      expect(items[1]!.getAttribute('aria-checked')).toBe('true')
      expect(menu.open).toBe(true)
      expect(menu.value).toBe('')
    })
  })

  // --- removeAttribute('value') null guard ---

  describe('removeAttribute("value") null guard', () => {
    it('does not throw when value attribute is removed', async () => {
      const {menu} = await mountMenu({open: true, closeOnSelect: false})
      menu.setAttribute('value', 'a')
      await settle(menu)
      expect(menu.value).toBe('a')

      expect(() => menu.removeAttribute('value')).not.toThrow()
      await settle(menu)

      // Should normalize to empty string and clear selection, not crash.
      expect(menu.value).toBe('')
    })
  })

  // --- Programmatic value='' clears selection (no resurrection) ---

  describe('programmatic value clearing', () => {
    it('setting value to "" clears the model selection', async () => {
      const {menu, items} = await mountMenu({open: true, closeOnSelect: false})

      items[0]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(menu)
      expect(menu.value).toBe('a')

      menu.value = ''
      await settle(menu)

      expect(menu.value).toBe('')
      expect((menu.querySelector('cv-menu-item[value="a"]') as CVMenuItem).selected).toBe(false)
    })

    it('cleared value is not resurrected by a subsequent interaction', async () => {
      const {menu, items} = await mountMenu({open: true, closeOnSelect: false})

      items[0]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(menu)
      expect(menu.value).toBe('a')

      menu.value = ''
      await settle(menu)

      // An unrelated interaction (focus / keyboard navigation) must not bring
      // back the old selection.
      const root = menu.shadowRoot?.querySelector('[part="base"]') as HTMLElement
      root.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}))
      await settle(menu)

      expect(menu.value).toBe('')
    })
  })

  // --- Tab closes the menu (no keyboard trap) ---

  describe('Tab key', () => {
    it('Tab closes the open menu and does not preventDefault', async () => {
      const {menu, root} = await mountMenu({open: true})
      expect(menu.open).toBe(true)

      const event = new KeyboardEvent('keydown', {key: 'Tab', bubbles: true, cancelable: true})
      root.dispatchEvent(event)
      await settle(menu)

      expect(menu.open).toBe(false)
      // Focus must be allowed to move out of the menu.
      expect(event.defaultPrevented).toBe(false)
    })
  })

  // --- Reconnect (remove + re-append keeps item listeners) ---

  describe('reconnect', () => {
    it('item clicks still select after remove() + re-append()', async () => {
      const {menu} = await mountMenu({open: true, closeOnSelect: false})

      menu.remove()
      await settle(menu)
      document.body.append(menu)
      await settle(menu)

      const items = Array.from(menu.querySelectorAll('cv-menu-item')) as CVMenuItem[]
      items[0]!.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
      await settle(menu)

      expect(menu.value).toBe('a')
    })
  })
})
