import { useState } from 'react'
import { FiX, FiPrinter, FiDownload, FiLoader } from 'react-icons/fi'
import InvoiceDocument from './InvoiceDocument.jsx'

export default function InvoiceModal({ open, onClose, data }) {
  const [downloading, setDownloading] = useState(false)

  if (!open) return null

  const handlePrint = () => window.print()

  const handleDownloadPdf = async () => {
    setDownloading(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      const { jsPDF } = await import('jspdf')

      const node = document.getElementById('invoice-print-root')
      const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')

      const pdf = new jsPDF({ unit: 'pt', format: [canvas.width / 2, canvas.height / 2] })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
      pdf.save(`invoice-${data?.invoiceNumber || 'order'}.pdf`)
    } catch (err) {
      console.error('PDF generation failed:', err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 print:bg-white print:p-0">
      <div className="glass-panel max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl p-4 print:max-h-none print:overflow-visible print:rounded-none print:p-0 print:shadow-none">
        {/* Modal header — hidden when printing */}
        <div className="mb-4 flex items-center justify-between print:hidden">
          <h2 className="font-heading text-lg font-bold text-nb-white">Invoice</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-nb-maroon/15 text-nb-gray hover:text-nb-white"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        {/* Action buttons — hidden when printing */}
        <div className="mb-4 flex gap-2 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-nb-gold/30 bg-nb-gold/10 py-2 text-sm text-nb-gold hover:bg-nb-gold/20"
          >
            <FiPrinter className="h-4 w-4" /> Print
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-nb-neon-orange/30 bg-nb-neon-orange/10 py-2 text-sm text-nb-neon-orange hover:bg-nb-neon-orange/20 disabled:opacity-50"
          >
            {downloading ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiDownload className="h-4 w-4" />}
            {downloading ? 'Generating…' : 'Download PDF'}
          </button>
        </div>

        {/* The actual invoice document (white paper style) */}
        <InvoiceDocument data={data} />
      </div>
    </div>
  )
}
