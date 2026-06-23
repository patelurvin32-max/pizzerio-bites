import logo from '../../assets/logo.jpeg'
import { formatCurrency } from '../../utils/helpers.js'

export default function InvoiceDocument({ data }) {
  if (!data) return null
  const { invoiceNumber, issuedAt, restaurant, order, gstNote } = data

  const issuedDate = new Date(issuedAt)
  const dateStr = issuedDate.toLocaleDateString('en-IN')
  const timeStr = issuedDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      id="invoice-print-root"
      style={{
        width: '380px',
        margin: '0 auto',
        background: '#fff',
        color: '#000',
        fontFamily: "'Courier New', monospace",
        padding: '24px',
        border: '1px solid #000',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: 10, marginBottom: 10 }}>
        <img src={logo} alt={restaurant.name} style={{ height: 64, margin: '0 auto 6px', display: 'block' }} />
        <p style={{ fontWeight: 'bold', fontSize: 16, margin: 0, letterSpacing: 0.5 }}>
          {restaurant.name?.toUpperCase()}
        </p>
        {restaurant.address && <p style={{ fontSize: 10, margin: '2px 0 0' }}>{restaurant.address}</p>}
        {restaurant.phone && <p style={{ fontSize: 10, margin: 0 }}>Ph: {restaurant.phone}</p>}
        {restaurant.gstin && (
          <p style={{ fontSize: 10, margin: '4px 0 0', fontWeight: 'bold' }}>GSTIN: {restaurant.gstin}</p>
        )}
      </div>

      <p style={{
        textAlign: 'center', fontWeight: 'bold', fontSize: 13, margin: '0 0 10px',
        letterSpacing: 1, borderBottom: '1px dashed #000', paddingBottom: 8,
      }}>
        TAX INVOICE
      </p>

      {/* Bill meta */}
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

      {/* Items table */}
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
          {order.items.map((item, idx) => (
            <tr key={idx} style={idx === order.items.length - 1 ? { borderBottom: '1px solid #000' } : undefined}>
              <td style={{ padding: '3px 0' }}>{item.name}</td>
              <td style={{ textAlign: 'center', padding: '3px 0' }}>{item.quantity}</td>
              <td style={{ textAlign: 'right', padding: '3px 0' }}>{item.unitPrice.toFixed(2)}</td>
              <td style={{ textAlign: 'right', padding: '3px 0' }}>
                {(item.unitPrice * item.quantity).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ fontSize: 10, margin: '0 0 8px' }}>Total Items: {order.items.length}</p>

      {/* Grand total — exactly order.total, GST already included, nothing added on top */}
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

      <p style={{
        textAlign: 'center', fontSize: 10, margin: '10px 0 0',
        borderTop: '1px dashed #000', paddingTop: 8,
      }}>
        {restaurant.footerNote || 'Thank You! Visit Again 🍕'}
      </p>
    </div>
  )
}
