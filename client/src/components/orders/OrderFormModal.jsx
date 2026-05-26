import { useEffect, useMemo, useState } from 'react'
import { FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi'
import Modal from '../common/Modal.jsx'
import Button from '../common/Button.jsx'
import Input from '../common/Input.jsx'
import Select from '../common/Select.jsx'
import Loader from '../common/Loader.jsx'
import { menuService } from '../../services/menuService.js'
import { orderService } from '../../services/orderService.js'
import { PAYMENT_STATUS_OPTIONS } from '../../utils/constants.js'
import { cn, formatCurrency } from '../../utils/helpers.js'
import {
  buildOrderLineName,
  categoryHasDualPricing,
  formatRupee,
  getItemUnitPrice,
  getVariantLabel,
} from '../../utils/menuPricing.js'
import { useNotify } from '../../context/NotificationContext.jsx'

const initialForm = {
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  deliveryAddress: '',
  notes: '',
  status: 'pending',
  paymentStatus: 'unpaid',
  paymentMethod: 'card',
}

const emptyPicker = {
  categoryId: '',
  menuItemId: '',
  variant: 'regular',
}

const touchBtn =
  'touch-manipulation inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl transition active:scale-95'

function cartLineKey(line) {
  return `${line.menuItem}-${line.variant}`
}

function SectionTitle({ children }) {
  return <h3 className="text-xs font-semibold uppercase tracking-wide text-nb-gray">{children}</h3>
}

function VariantOption({ active, onClick, title, price }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'touch-manipulation flex min-h-[52px] flex-col items-start justify-center rounded-xl border px-3 py-2.5 text-left transition active:scale-[0.98]',
        active
          ? 'border-nb-neon-orange/70 bg-nb-neon-orange/15 ring-2 ring-nb-neon-orange/30'
          : 'border-white/10 bg-black/25 hover:bg-white/5'
      )}
    >
      <span className="text-sm font-medium text-nb-white">{title}</span>
      <span className="text-xs text-nb-gold">{price}</span>
    </button>
  )
}

export default function OrderFormModal({ open, onClose, onSaved }) {
  const notify = useNotify()
  const [form, setForm] = useState(initialForm)
  const [cart, setCart] = useState([])
  const [picker, setPicker] = useState(emptyPicker)
  const [categories, setCategories] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [loadingMenu, setLoadingMenu] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    setForm(initialForm)
    setCart([])
    setPicker(emptyPicker)
    setLoadingMenu(true)
    Promise.all([menuService.publicCategories(), menuService.publicItems()])
      .then(([catRes, itemRes]) => {
        const cats = (catRes.items || []).filter((c) => c.active !== false).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        const items = (itemRes.items || []).filter((m) => m.available !== false)
        setCategories(cats)
        setMenuItems(items)
        if (cats.length) {
          setPicker((p) => ({ ...p, categoryId: cats[0]._id }))
        }
      })
      .catch((e) => notify.error(e.message))
      .finally(() => setLoadingMenu(false))
    return undefined
  }, [open, notify])

  const categoryItems = useMemo(() => {
    if (!picker.categoryId) return []
    return menuItems
      .filter((m) => (m.category?._id || m.category) === picker.categoryId)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [menuItems, picker.categoryId])

  const selectedItem = useMemo(
    () => menuItems.find((m) => m._id === picker.menuItemId),
    [menuItems, picker.menuItemId]
  )

  const dualPricing = selectedItem && categoryHasDualPricing(selectedItem.category)
  const variantLabel = getVariantLabel(selectedItem?.category)

  const previewName = selectedItem ? buildOrderLineName(selectedItem, picker.variant) : ''
  const previewPrice = selectedItem ? getItemUnitPrice(selectedItem, picker.variant) : 0

  const subtotal = useMemo(
    () => cart.reduce((sum, line) => sum + (Number(line.quantity) || 1) * (Number(line.unitPrice) || 0), 0),
    [cart]
  )

  function onCategoryChange(categoryId) {
    setPicker({ categoryId, menuItemId: '', variant: 'regular' })
  }

  function onItemChange(menuItemId) {
    setPicker({
      categoryId: picker.categoryId,
      menuItemId,
      variant: 'regular',
    })
  }

  function addToCart() {
    if (!selectedItem) {
      notify.error('Select a menu item')
      return
    }
    const line = {
      menuItem: selectedItem._id,
      name: buildOrderLineName(selectedItem, picker.variant),
      unitPrice: getItemUnitPrice(selectedItem, picker.variant),
      quantity: 1,
      variant: dualPricing ? picker.variant : 'single',
    }
    const key = cartLineKey(line)
    setCart((prev) => {
      const idx = prev.findIndex((l) => cartLineKey(l) === key)
      if (idx >= 0) {
        return prev.map((l, i) => (i === idx ? { ...l, quantity: l.quantity + 1 } : l))
      }
      return [...prev, { ...line, id: key }]
    })
    setPicker((p) => ({ ...p, menuItemId: '', variant: 'regular' }))
    notify.success('Added to cart')
  }

  function changeQty(id, delta) {
    setCart((prev) => {
      const line = prev.find((l) => l.id === id)
      if (!line) return prev
      const next = line.quantity + delta
      if (next < 1) return prev.filter((l) => l.id !== id)
      return prev.map((l) => (l.id === id ? { ...l, quantity: next } : l))
    })
  }

  function removeFromCart(id) {
    setCart((prev) => prev.filter((line) => line.id !== id))
  }

  async function handleSubmit() {
    if (!form.customerName.trim()) {
      notify.error('Customer name is required')
      return
    }
    if (cart.length === 0) {
      notify.error('Add at least one item to the cart')
      return
    }

    setSaving(true)
    try {
      await orderService.create({
        ...form,
        taxRatePercent: 0,
        items: cart.map((l) => ({
          menuItem: l.menuItem,
          name: l.name,
          quantity: Number(l.quantity) || 1,
          unitPrice: Number(l.unitPrice) || 0,
        })),
      })
      notify.success('Order created')
      onSaved?.()
      onClose()
    } catch (e) {
      notify.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New order"
      wide
      sheet
      footer={
        <div className="flex w-full flex-col gap-3">
          <div className="flex items-center justify-between rounded-xl border border-nb-neon-orange/30 bg-nb-neon-orange/10 px-4 py-3">
            <span className="text-sm font-medium text-nb-cream">Subtotal ({cart.length} items)</span>
            <span className="text-lg font-bold text-nb-gold">{formatCurrency(subtotal)}</span>
          </div>
          <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
            <Button variant="ghost" fullWidth size="lg" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button fullWidth size="lg" onClick={handleSubmit} disabled={saving || loadingMenu}>
              {saving ? 'Creating…' : 'Create order'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 pb-2">
        <section className="space-y-3">
          <SectionTitle>Customer</SectionTitle>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input
              label="Name *"
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              autoComplete="name"
            />
            <Input
              label="Phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={form.customerPhone}
              onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={form.customerEmail}
              onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
            />
            {/* <Input
              label="Delivery address"
              value={form.deliveryAddress}
              onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
              placeholder="Optional — dine-in leave blank"
              className="md:col-span-2"
            /> */}
          </div>
        </section>

        <section className="space-y-3">
          <SectionTitle>Add items</SectionTitle>
          {loadingMenu ? (
            <div className="py-8">
              <Loader label="Loading menu" />
            </div>
          ) : (
            <div className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4">
              {/* Category chips — fast tap on phones */}
              <div className="-mx-1 overflow-x-auto pb-1 scrollbar-thin">
                <div className="flex w-max min-w-full gap-2 px-1 sm:flex-wrap sm:w-auto">
                  {categories.map((c) => (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => onCategoryChange(c._id)}
                      className={cn(
                        'touch-manipulation shrink-0 rounded-full border px-4 py-2.5 text-sm font-medium transition active:scale-95',
                        picker.categoryId === c._id
                          ? 'border-nb-neon-orange/70 bg-nb-neon-orange/20 text-nb-white'
                          : 'border-white/10 bg-black/30 text-nb-gray hover:text-nb-cream'
                      )}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Select
                  label="Category"
                  value={picker.categoryId}
                  onChange={(e) => onCategoryChange(e.target.value)}
                  className="md:hidden"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Item"
                  value={picker.menuItemId}
                  onChange={(e) => onItemChange(e.target.value)}
                  disabled={!picker.categoryId}
                  className="md:col-span-1"
                >
                  <option value="">Select item</option>
                  {categoryItems.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              </div>

              {dualPricing && selectedItem && (
                <div className="space-y-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-nb-gray">Type</span>
                  <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
                    <VariantOption
                      active={picker.variant === 'regular'}
                      onClick={() => setPicker({ ...picker, variant: 'regular' })}
                      title="Regular"
                      price={formatRupee(selectedItem.price)}
                    />
                    <VariantOption
                      active={picker.variant === 'variant'}
                      onClick={() => setPicker({ ...picker, variant: 'variant' })}
                      title={variantLabel}
                      price={formatRupee(selectedItem.priceVariant)}
                    />
                  </div>
                </div>
              )}

              {selectedItem && (
                <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm">
                  <p className="text-nb-gray">Selected</p>
                  <p className="mt-0.5 font-medium leading-snug text-nb-white">{previewName}</p>
                  <p className="mt-1 text-base font-semibold text-nb-gold">{formatRupee(previewPrice)}</p>
                </div>
              )}

              <Button type="button" size="lg" fullWidth onClick={addToCart} disabled={!selectedItem} className="!min-h-[52px]">
                <FiPlus className="h-5 w-5 shrink-0" aria-hidden />
                Add to cart
              </Button>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <SectionTitle>Cart</SectionTitle>
            {cart.length > 0 && (
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-nb-cream">
                {cart.length} line{cart.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {cart.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-nb-gray">
              No items yet. Choose a category and item above.
            </p>
          ) : (
            <ul className="space-y-3">
              {cart.map((line) => {
                const lineTotal = (Number(line.quantity) || 1) * (Number(line.unitPrice) || 0)
                return (
                  <li
                    key={line.id}
                    className="rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4"
                  >
                    <div className="flex gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium leading-snug text-nb-white">{line.name}</p>
                        <p className="mt-1 text-xs text-nb-gray">{formatRupee(line.unitPrice)} each</p>
                      </div>
                      <p className="shrink-0 text-base font-bold text-nb-gold">{formatRupee(lineTotal)}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/5 pt-3">
                      <div className="flex items-center rounded-xl border border-white/10 bg-black/30">
                        <button
                          type="button"
                          className={cn(touchBtn, 'text-nb-cream hover:bg-white/5')}
                          onClick={() => changeQty(line.id, -1)}
                          aria-label="Decrease quantity"
                        >
                          <FiMinus className="h-5 w-5" />
                        </button>
                        <span className="min-w-[2.5rem] px-1 text-center text-base font-semibold tabular-nums text-nb-white">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          className={cn(touchBtn, 'text-nb-cream hover:bg-white/5')}
                          onClick={() => changeQty(line.id, 1)}
                          aria-label="Increase quantity"
                        >
                          <FiPlus className="h-5 w-5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        className={cn(
                          touchBtn,
                          'gap-1.5 border border-nb-neon-red/30 bg-nb-neon-red/10 px-3 text-sm font-medium text-nb-neon-red'
                        )}
                        onClick={() => removeFromCart(line.id)}
                        aria-label="Remove item"
                      >
                        <FiTrash2 className="h-4 w-4" />
                        <span className="hidden min-[400px]:inline">Remove</span>
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <SectionTitle>Order details</SectionTitle>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Select
              label="Payment status"
              value={form.paymentStatus}
              onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}
            >
              {PAYMENT_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Select
              label="Payment method"
              value={form.paymentMethod}
              onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
              className="md:col-span-2"
            >
              {/* <option value="card">Card</option> */}
              <option value="cash">Cash</option>
              <option value="online">Online</option>
              {/* <option value="wallet">Wallet</option> */}
            </Select>
            <Input
              label="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="md:col-span-2"
              placeholder="Allergies, pickup time, table number…"
            />
          </div>
        </section>

        {/* <p className="hidden text-center text-xs text-nb-gray sm:block">
          Prices include tax. Subtotal is shown above the action buttons.
        </p> */}
      </div>
    </Modal>
  )
}
