import { Fragment, useMemo } from 'react'
import logo from '../../assets/logo.jpeg'
import { formatCurrency } from '../../utils/helpers.js'
import {
  FONT_SIZE_MAP,
  getSortedEnabledFields,
  mergeInvoiceLayout,
  resolveFooterFieldValue,
  resolveHeaderFieldValue,
} from '../../utils/invoiceLayoutDefaults.js'

const UNCategorized = 'Other'

function groupInvoiceItemsByCategory(items = []) {
  const groups = new Map()

  for (const item of items) {
    const category = item.menuItem?.category
    const name = category?.name || UNCategorized
    const sortOrder = category?.sortOrder ?? Number.MAX_SAFE_INTEGER

    if (!groups.has(name)) {
      groups.set(name, { name, sortOrder, items: [] })
    }
    groups.get(name).items.push(item)
  }

  return [...groups.values()]
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
      return a.name.localeCompare(b.name)
    })
    .map((group) => ({
      ...group,
      items: [...group.items].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    }))
}

function footerFieldStyle(field) {
  return {
    fontSize: FONT_SIZE_MAP[field.fontSize || 'small'],
    fontWeight: field.bold ? 'bold' : 'normal',
    textDecoration: field.underline ? 'underline' : 'none',
    textAlign: 'center',
    margin: '0 0 4px',
  }
}

function HeaderField({ field, restaurant }) {
  if (field.id === 'logo') {
    return (
      <img
        src={restaurant.logoUrl || logo}
        alt={restaurant.name}
        style={{ height: 64, margin: '0 auto 6px', display: 'block' }}
      />
    )
  }

  const value = resolveHeaderFieldValue(field, restaurant)
  if (!value && field.id !== 'invoiceTitle') return null

  if (field.id === 'businessName') {
    return (
      <p style={{ fontWeight: 'bold', fontSize: 16, margin: 0, letterSpacing: 0.5 }}>
        {value.toUpperCase()}
      </p>
    )
  }

  if (field.id === 'invoiceTitle') {
    return (
      <p style={{
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 13,
        margin: '0 0 10px',
        letterSpacing: 1,
        borderBottom: '1px dashed #000',
        paddingBottom: 8,
      }}>
        {value}
      </p>
    )
  }

  return <p style={{ fontSize: 10, margin: '2px 0 0' }}>{value}</p>
}

function FooterField({ field, restaurant }) {
  if (field.id === 'qrCode') {
    return (
      <div style={{
        margin: '8px auto',
        height: 72,
        width: 72,
        border: '1px solid #000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 8,
      }}>
        QR
      </div>
    )
  }

  if (field.id === 'signature') {
    const value = resolveFooterFieldValue(field, restaurant)
    return (
      <div style={{ margin: '12px 0 4px', textAlign: 'center' }}>
        <div style={{ borderTop: '1px solid #000', width: 140, margin: '0 auto 4px' }} />
        <p style={footerFieldStyle(field)}>{value || 'Authorized Signature'}</p>
      </div>
    )
  }

  const value = resolveFooterFieldValue(field, restaurant)
  if (!value) return null

  const isThankYou = field.id === 'thankYouMessage'
  return (
    <p style={{
      ...footerFieldStyle(field),
      margin: isThankYou ? '10px 0 0' : '0 0 4px',
      borderTop: isThankYou ? '1px dashed #000' : undefined,
      paddingTop: isThankYou ? 8 : undefined,
    }}>
      {value}
    </p>
  )
}

export default function InvoiceDocument({ data }) {
  const layout = useMemo(
    () => mergeInvoiceLayout(data?.invoiceLayout),
    [data?.invoiceLayout]
  )

  const groupedItems = useMemo(
    () => groupInvoiceItemsByCategory(data?.order?.items),
    [data?.order?.items]
  )

  const headerFields = useMemo(
    () => getSortedEnabledFields(layout.header.fields),
    [layout.header.fields]
  )

  const footerFields = useMemo(
    () => getSortedEnabledFields(layout.footer.fields),
    [layout.footer.fields]
  )

  const headerBlockFields = useMemo(
    () => headerFields.filter((field) => field.id !== 'invoiceTitle'),
    [headerFields]
  )

  const invoiceTitleField = useMemo(
    () => headerFields.find((field) => field.id === 'invoiceTitle'),
    [headerFields]
  )

  if (!data) return null
  const { invoiceNumber, issuedAt, restaurant, order, gstNote } = data

  const orderDate = new Date(order.createdAt || issuedAt)
  const dateStr = orderDate.toLocaleDateString('en-IN')
  const timeStr = orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      id="invoice-print-root"
      style={{
        width: '380px',
        margin: '0 auto',
        background: '#fff',
        color: '#000',
        fontFamily: layout.fontStyle || "'Courier New', monospace",
        padding: '24px',
        border: '1px solid #000',
      }}
    >
      {headerBlockFields.length > 0 && (
        <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: 10, marginBottom: 10 }}>
          {headerBlockFields.map((field) => (
            <HeaderField key={field.id} field={field} restaurant={restaurant} />
          ))}
        </div>
      )}

      {invoiceTitleField && <HeaderField field={invoiceTitleField} restaurant={restaurant} />}

      {/* Bill meta — order details (configurable fields coming later) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 4 }}>
        <span>Bill No: {invoiceNumber}</span>
        <span>{order.orderType === 'dine-in' ? 'Dine-in' : 'Takeaway'}</span>
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 10,
        borderBottom: '1px dashed #000', paddingBottom: 8,
      }}>
        <span>Date: {dateStr}</span>
        <span>Time: {timeStr}</span>
      </div>

      {order.customerName && (
        <p style={{ fontSize: 10, margin: '0 0 8px' }}>Customer: {order.customerName}</p>
      )}

      <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #000' }}>
            <th style={{ textAlign: 'left', padding: '4px 0' }}>ITEM</th>
            <th style={{ textAlign: 'center', padding: '4px 0' }}>QTY</th>
            <th style={{ textAlign: 'right', padding: '4px 0' }}>RATE</th>
            <th style={{ textAlign: 'right', padding: '4px 0' }}>AMT</th>
          </tr>
        </thead>
        <tbody>
          {groupedItems.map((group, groupIdx) => (
            <Fragment key={group.name}>
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: groupIdx === 0 ? '6px 0 2px' : '10px 0 2px',
                    fontWeight: 'bold',
                    fontSize: 10,
                    letterSpacing: 0.3,
                    borderTop: groupIdx > 0 ? '1px dotted #999' : undefined,
                  }}
                >
                  {group.name}
                </td>
              </tr>
              {group.items.map((item, idx) => {
                const isLastRow =
                  groupIdx === groupedItems.length - 1 && idx === group.items.length - 1
                return (
                  <tr key={`${group.name}-${item.name}-${idx}`} style={isLastRow ? { borderBottom: '1px solid #000' } : undefined}>
                    <td style={{ padding: '3px 0 3px 8px' }}>{item.name}</td>
                    <td style={{ textAlign: 'center', padding: '3px 0' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', padding: '3px 0' }}>{item.unitPrice.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', padding: '3px 0' }}>
                      {(item.unitPrice * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                )
              })}
            </Fragment>
          ))}
        </tbody>
      </table>

      <p style={{ fontSize: 10, margin: '0 0 8px' }}>Total Items: {order.items.length}</p>

      <div style={{
        display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 14,
        padding: '6px 0', borderTop: '1px dashed #000', borderBottom: '1px solid #000', marginBottom: 10,
      }}>
        <span>GRAND TOTAL</span>
        <span>{formatCurrency(order.total)}</span>
      </div>

      <p style={{ fontSize: 9, textAlign: 'center', margin: '0 0 4px', fontStyle: 'italic' }}>
        ({gstNote || 'Inclusive of GST'})
      </p>
      {order.paymentMethod && (
        <p style={{ fontSize: 9, textAlign: 'center', margin: '0 0 2px' }}>
          Payment Mode: {order.paymentMethod.toUpperCase()}
        </p>
      )}

      {footerFields.map((field) => (
        <FooterField key={field.id} field={field} restaurant={restaurant} />
      ))}
    </div>
  )
}
