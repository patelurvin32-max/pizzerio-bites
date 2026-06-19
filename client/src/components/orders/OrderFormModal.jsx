import { useEffect, useMemo, useState } from 'react'
import { FiImage, FiInfo, FiMinus, FiPlus, FiShoppingCart, FiTrash2 } from 'react-icons/fi'
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
  paymentMethod: 'cash',
  orderType: 'dine-in',
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

function getCartQty(cart, itemId) {
  return cart
    .filter((line) => line.menuItem === itemId)
    .reduce((sum, line) => sum + (Number(line.quantity) || 0), 0)
}

export default function OrderFormModal({ open, onClose, onSaved, editingOrder }) {
  const notify = useNotify()
  const [form, setForm] = useState(initialForm)
  const [cart, setCart] = useState([])
  const [picker, setPicker] = useState(emptyPicker)
  const [categories, setCategories] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [loadingMenu, setLoadingMenu] = useState(false)
  const [saving, setSaving] = useState(false)
  const [variantSheet, setVariantSheet] = useState(null)

  useEffect(() => {
    if (!open) return undefined
    if (editingOrder) {
      // Populate form and cart with existing order data
      setForm({
        customerName: editingOrder.customerName || '',
        customerEmail: editingOrder.customerEmail || '',
        customerPhone: editingOrder.customerPhone || '',
        deliveryAddress: editingOrder.deliveryAddress || '',
        notes: editingOrder.notes || '',
        status: editingOrder.status || 'pending',
        paymentStatus: editingOrder.paymentStatus || 'unpaid',
        paymentMethod: editingOrder.paymentMethod || 'cash',
        orderType: editingOrder.orderType || 'dine-in',
      })
      setCart(
        (editingOrder.items || []).map((item) => ({
          menuItem: item.menuItem,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          variant: 'single',
          id: `${item.menuItem}-single`,
        }))
      )
    } else {
      setForm(initialForm)
      setCart([])
    }
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
  }, [open, notify, editingOrder])

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

  const subtotal = useMemo(
    () => cart.reduce((sum, line) => sum + (Number(line.quantity) || 1) * (Number(line.unitPrice) || 0), 0),
    [cart]
  )

  function onCategoryChange(categoryId) {
    setPicker({ categoryId, menuItemId: '', variant: 'regular' })
  }

  function addToCart(item = selectedItem, variant = picker.variant) {
    if (!item) {
      notify.error('Select a menu item')
      return
    }
    const hasDualPricing = categoryHasDualPricing(item.category)
    const line = {
      menuItem: item._id,
      name: buildOrderLineName(item, hasDualPricing ? variant : 'single'),
      unitPrice: getItemUnitPrice(item, hasDualPricing ? variant : 'single'),
      quantity: 1,
      variant: hasDualPricing ? variant : 'single',
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
    setVariantSheet(null)
  }

  function chooseItem(item) {
    setPicker((p) => ({ ...p, menuItemId: item._id, variant: 'regular' }))
    if (categoryHasDualPricing(item.category)) {
      setVariantSheet({ item, variant: 'regular' })
      return
    }
    addToCart(item, 'single')
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
    if (cart.length === 0) {
      notify.error('Add at least one item to the cart')
      return
    }

    setSaving(true)
    try {
      const orderData = {
        ...form,
        taxRatePercent: 0,
        items: cart.map((l) => ({
          menuItem: l.menuItem,
          name: l.name,
          quantity: Number(l.quantity) || 1,
          unitPrice: Number(l.unitPrice) || 0,
        })),
      }

      if (editingOrder) {
        await orderService.update(editingOrder._id, orderData)
        notify.success('Order updated')
      } else {
        await orderService.create(orderData)
        notify.success('Order created')
      }
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
      title={editingOrder ? 'Edit order' : 'New order'}
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
              label="Name"
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
              <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                <div className="flex flex-wrap justify-center gap-2">
                  {categories.map((c) => (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => onCategoryChange(c._id)}
                      className={cn(
                        'touch-manipulation min-h-[40px] rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition active:scale-95',
                        picker.categoryId === c._id
                          ? 'border-nb-neon-orange bg-nb-neon-orange text-black shadow-[0_0_18px_rgba(255,122,0,0.3)]'
                          : 'border-white/10 bg-black/40 text-nb-gray hover:border-nb-neon-orange/40 hover:text-nb-cream'
                      )}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {categoryItems.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-nb-gray">
                  No items in this category.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {categoryItems.map((item) => {
                    const count = getCartQty(cart, item._id)
                    const hasDualPricing = categoryHasDualPricing(item.category)
                    return (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => chooseItem(item)}
                        className={cn(
                          'group relative flex min-h-[100px] flex-col overflow-hidden rounded-2xl border text-left shadow-[0_10px_24px_rgba(0,0,0,0.22)] transition active:scale-[0.98]',
                          picker.menuItemId === item._id
                            ? 'border-nb-neon-orange/70 ring-2 ring-nb-neon-orange/25'
                            : 'border-white/10 hover:border-nb-neon-orange/40'
                        )}
                      >
                        <div className="flex flex-1 flex-col justify-between rounded-t-2xl bg-white px-2.5 py-3 text-center text-[#3d2b38]">
                          <div>
                            <p className="line-clamp-2 text-sm font-semibold leading-tight sm:text-base">{item.name}</p>
                            <p className="mt-1 text-sm font-extrabold leading-tight">
                              {hasDualPricing ? 'Multi price' : formatRupee(item.price)}
                            </p>
                          </div>
                        </div>
                        <div className="h-1.5 bg-nb-neon-orange" />
                        {count > 0 && (
                          <span className="absolute -bottom-1 -right-1 inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-white text-base font-bold text-black shadow-lg">
                            {count}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-nb-cream">
                <FiShoppingCart className="h-4 w-4 text-nb-neon-orange" aria-hidden />
                <span>{cart.length} item{cart.length === 1 ? '' : 's'} in cart</span>
              </div>
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
              label="Order type"
              value={form.orderType}
              onChange={(e) => setForm({ ...form, orderType: e.target.value })}
            >
              <option value="dine-in">Dine-in</option>
              <option value="takeaway">Takeaway</option>
            </Select>
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

        {variantSheet && (
          <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/65 backdrop-blur-[2px] sm:items-center">
            <button
              type="button"
              aria-label="Close variant picker"
              className="absolute inset-0"
              onClick={() => setVariantSheet(null)}
            />
            <div className="relative w-full rounded-t-3xl bg-white p-5 text-[#241821] shadow-2xl sm:max-w-md sm:rounded-3xl">
              <h3 className="text-xl font-extrabold">Please choose</h3>
              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={() => setVariantSheet({ ...variantSheet, variant: 'regular' })}
                  className={cn(
                    'flex min-h-[64px] w-full items-center justify-between rounded-xl border px-4 text-left text-lg font-semibold',
                    variantSheet.variant === 'regular' ? 'border-[#3d2b38] bg-[#3d2b38]/5' : 'border-black/15'
                  )}
                >
                  <span>Regular <FiInfo className="ml-2 inline h-5 w-5 text-black/35" aria-hidden /></span>
                  <span className="text-black/35">{formatRupee(variantSheet.item.price)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVariantSheet({ ...variantSheet, variant: 'variant' })}
                  className={cn(
                    'flex min-h-[64px] w-full items-center justify-between rounded-xl border px-4 text-left text-lg font-semibold',
                    variantSheet.variant === 'variant' ? 'border-[#3d2b38] bg-[#3d2b38]/5' : 'border-black/15'
                  )}
                >
                  <span>{getVariantLabel(variantSheet.item.category)} <FiInfo className="ml-2 inline h-5 w-5 text-black/35" aria-hidden /></span>
                  <span className="text-black/35">{formatRupee(variantSheet.item.priceVariant)}</span>
                </button>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setVariantSheet(null)}
                  className="min-h-[56px] rounded-2xl border-2 border-[#3d2b38] text-lg font-bold text-[#3d2b38]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => addToCart(variantSheet.item, variantSheet.variant)}
                  className="min-h-[56px] rounded-2xl bg-[#3d2b38] text-lg font-bold text-white"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* <p className="hidden text-center text-xs text-nb-gray sm:block">
          Prices include tax. Subtotal is shown above the action buttons.
        </p> */}
      </div>
    </Modal>
  )
}
