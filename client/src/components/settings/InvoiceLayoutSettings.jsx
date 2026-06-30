import { useCallback, useEffect, useMemo, useState } from 'react'
import Card from '../common/Card.jsx'
import Button from '../common/Button.jsx'
import Input from '../common/Input.jsx'
import Select from '../common/Select.jsx'
import Modal from '../common/Modal.jsx'
import InvoiceDocument from '../orders/InvoiceDocument.jsx'
import InvoiceLayoutFieldList, { CollapsibleSection } from './InvoiceLayoutFieldList.jsx'
import api from '../../services/api.js'
import { useNotify } from '../../context/NotificationContext.jsx'
import {
  createDefaultInvoiceLayout,
  FONT_OPTIONS,
  INVOICE_LAYOUT_KEY,
  mergeInvoiceLayout,
  SAMPLE_INVOICE_DATA,
} from '../../utils/invoiceLayoutDefaults.js'

const SECTIONS = ['header', 'orderDetails', 'footer']

export default function InvoiceLayoutSettings({ restaurantInfo }) {
  const notify = useNotify()
  const [layout, setLayout] = useState(createDefaultInvoiceLayout)
  const [saving, setSaving] = useState(false)
  const [openSection, setOpenSection] = useState('header')
  const [desktopOpenSection, setDesktopOpenSection] = useState('header')
  const [previewOpen, setPreviewOpen] = useState(false)

  const loadLayout = useCallback(async () => {
    try {
      const { data } = await api.get('/api/settings/app')
      const items = Array.isArray(data?.items) ? data.items : []
      const row = items.find((x) => x.key === INVOICE_LAYOUT_KEY)
      const merged = mergeInvoiceLayout(row?.value)
      if (restaurantInfo) {
        merged.header.fields = merged.header.fields.map((field) => {
          if (field.content?.trim()) return field
          if (field.id === 'businessName' && restaurantInfo.name) return { ...field, content: restaurantInfo.name }
          if (field.id === 'addressLine1' && restaurantInfo.address) return { ...field, content: restaurantInfo.address }
          if (field.id === 'phone' && restaurantInfo.phone) return { ...field, content: restaurantInfo.phone }
          if (field.id === 'email' && restaurantInfo.email) return { ...field, content: restaurantInfo.email }
          if (field.id === 'taxNumber' && restaurantInfo.gstin) return { ...field, content: restaurantInfo.gstin }
          return field
        })
        merged.footer.fields = merged.footer.fields.map((field) => {
          if (field.content?.trim()) return field
          if (field.id === 'thankYouMessage' && restaurantInfo.footerNote) {
            return { ...field, content: restaurantInfo.footerNote }
          }
          return field
        })
      }
      setLayout(merged)
    } catch (e) {
      notify.error(e.message)
    }
  }, [notify, restaurantInfo])

  useEffect(() => {
    loadLayout()
  }, [loadLayout])

  const previewData = useMemo(
    () => ({
      ...SAMPLE_INVOICE_DATA,
      restaurant: {
        ...SAMPLE_INVOICE_DATA.restaurant,
        ...(restaurantInfo || {}),
      },
      invoiceLayout: layout,
    }),
    [layout, restaurantInfo]
  )

  function updateSection(section, patch) {
    setLayout((prev) => ({ ...prev, [section]: { ...prev[section], ...patch } }))
  }

  function toggleSection(section) {
    setOpenSection((current) => (current === section ? '' : section))
  }

  function toggleDesktopSection(section) {
    setDesktopOpenSection((current) => (current === section ? '' : section))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await api.post('/api/settings/app', { key: INVOICE_LAYOUT_KEY, value: layout })
      notify.success('Invoice layout saved')
      loadLayout()
    } catch (e) {
      notify.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const headerPanel = (
    <div className="space-y-3">
      <InvoiceLayoutFieldList
        fields={layout.header.fields}
        onChange={(fields) => updateSection('header', { fields })}
        contentPlaceholder="Leave blank to use restaurant defaults"
      />
    </div>
  )

  const orderDetailsPanel = (
    <div className="rounded-xl border border-dashed border-white/15 bg-black/20 px-4 py-6 text-center">
      <p className="text-sm font-medium text-nb-cream">Order details configuration</p>
      <p className="mt-2 text-sm text-nb-gray">
        Detailed field settings for bill number, date, items, and totals will be added here.
        Invoices currently show the standard order details block.
      </p>
    </div>
  )

  const footerPanel = (
    <div className="space-y-3">
      <p className="text-sm text-nb-gray">
        Configure footer messages and optional blocks. Drag to reorder.
      </p>
      <InvoiceLayoutFieldList
        fields={layout.footer.fields}
        onChange={(fields) => updateSection('footer', { fields })}
        showFormatting
        contentPlaceholder="Enter message"
      />
    </div>
  )

  const sectionContent = {
    header: headerPanel,
    orderDetails: orderDetailsPanel,
    footer: footerPanel,
  }

  return (
    <Card glow className="overflow-hidden">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-bold text-nb-white">Invoice layout settings</h2>
        </div>
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="mt-2 rounded-full border border-nb-neon-orange/40 bg-nb-neon-orange/10 px-4 py-2 text-sm font-semibold text-nb-neon-orange transition hover:bg-nb-neon-orange/20 sm:mt-0"
        >
          Preview
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Input
          label="Custom template name"
          value={layout.templateName}
          onChange={(e) => setLayout({ ...layout, templateName: e.target.value })}
        />
        <Select
          label="Choose font style"
          value={layout.fontStyle}
          onChange={(e) => setLayout({ ...layout, fontStyle: e.target.value })}
        >
          {FONT_OPTIONS.map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-4 space-y-3 lg:hidden">
        {SECTIONS.map((section) => (
          <CollapsibleSection
            key={section}
            title={section === 'orderDetails' ? 'Order details' : section.charAt(0).toUpperCase() + section.slice(1)}
            open={openSection === section}
            onToggle={() => toggleSection(section)}
          >
            {sectionContent[section]}
          </CollapsibleSection>
        ))}
      </div>

      <div className="mt-4 hidden lg:block">
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <div className="mb-3">
            <p className="font-heading text-base font-bold text-nb-white">Desktop section</p>
          </div>
          <div className="space-y-3">
            {SECTIONS.map((section) => (
              <CollapsibleSection
                key={section}
                title={section === 'orderDetails' ? 'Order details' : section.charAt(0).toUpperCase() + section.slice(1)}
                open={desktopOpenSection === section}
                onToggle={() => toggleDesktopSection(section)}
              >
                {sectionContent[section]}
              </CollapsibleSection>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button fullWidth className="sm:w-auto sm:min-w-[160px]" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Invoice preview"
        wide
        sheet
      >
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 p-2">
          <InvoiceDocument data={previewData} />
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" onClick={() => setPreviewOpen(false)}>
            Close preview
          </Button>
        </div>
      </Modal>
    </Card>
  )
}
