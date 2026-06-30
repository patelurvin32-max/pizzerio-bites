import { useCallback, useEffect, useState } from 'react'
import Card from '../../components/common/Card.jsx'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import Select from '../../components/common/Select.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import api from '../../services/api.js'
import { useNotify } from '../../context/NotificationContext.jsx'
import { ROLES } from '../../utils/constants.js'
import Loader from '../../components/common/Loader.jsx'
import InvoiceLayoutSettings from '../../components/settings/InvoiceLayoutSettings.jsx'

const SETTINGS_MODULES = [
  { id: 'brand', label: 'Brand' },
  { id: 'invoice', label: 'Invoice Setting' },
  { id: 'payments', label: 'Payments' },
  { id: 'system', label: 'System' },
]

export default function Settings() {
  const notify = useNotify()
  const { user } = useAuth()
  const [app, setApp] = useState([])
  const [payment, setPayment] = useState(null)
  const [activeModule, setActiveModule] = useState('invoice')
  const [loading, setLoading] = useState(true)
  const [general, setGeneral] = useState({
    siteName: 'Pizzerio Bites',
    supportEmail: 'hello@pizzerio.bites',
    whatsapp: '',
    instagram: '',
    logoUrl: '',
  })
  const [smtp, setSmtp] = useState({ host: '', port: 587, user: '', pass: '', secure: true })
  const [restaurantInfo, setRestaurantInfo] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/settings/app')
      const items = Array.isArray(data?.items) ? data.items : []
      setApp(items)
      const generalRow = items.find((x) => x.key === 'general')
      const smtpRow = items.find((x) => x.key === 'smtp')
      const restaurantRow = items.find((x) => x.key === 'restaurantInfo')
      if (generalRow?.value) setGeneral((g) => ({ ...g, ...generalRow.value }))
      if (smtpRow?.value) setSmtp((s) => ({ ...s, ...smtpRow.value }))
      if (restaurantRow?.value) setRestaurantInfo(restaurantRow.value)
      if (user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.ADMIN) {
        try {
          const { data: p } = await api.get('/api/settings/payment')
          setPayment(p)
        } catch {
          setPayment(null)
        }
      } else {
        setPayment(null)
      }
    } catch (e) {
      notify.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [notify, user?.role])

  useEffect(() => {
    load()
  }, [load])

  async function saveGeneral() {
    try {
      await api.post('/api/settings/app', { key: 'general', value: general })
      notify.success('General settings saved')
      load()
    } catch (e) {
      notify.error(e.message)
    }
  }

  async function saveSmtp() {
    try {
      await api.post('/api/settings/app', { key: 'smtp', value: smtp })
      notify.success('SMTP draft saved (wire to mailer in production)')
      load()
    } catch (e) {
      notify.error(e.message)
    }
  }

  async function savePayment() {
    try {
      const payload = { ...payment }
      const mask = 'â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢'
      if (payment.hasSecretKey && payload.secretKey === mask) delete payload.secretKey
      if (payment.hasWebhookSecret && payload.webhookSecret === mask) delete payload.webhookSecret
      await api.patch('/api/settings/payment', payload)
      notify.success('Payment settings saved')
      load()
    } catch (e) {
      notify.error(e.message)
    }
  }

  if (loading) return <Loader />

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-nb-white">Settings</h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {SETTINGS_MODULES.map((module) => (
          <button
            key={module.id}
            type="button"
            onClick={() => setActiveModule(module.id)}
            className={`rounded-2xl border p-4 text-left transition ${
              activeModule === module.id
                ? 'border-nb-neon-orange bg-nb-neon-orange/10 shadow-[0_0_0_1px_rgba(255,122,0,0.35)]'
                : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-black/30'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-heading text-base font-bold text-nb-white">{module.label}</p>
              </div>
              <span
                className={`mt-1 h-2.5 w-2.5 rounded-full ${
                  activeModule === module.id ? 'bg-nb-neon-orange' : 'bg-white/20'
                }`}
              />
            </div>
          </button>
        ))}
      </div>

      {activeModule === 'brand' && (
        <Card glow>
          <h2 className="font-heading text-lg font-bold text-nb-white">Brand settings</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Input label="Site name" value={general.siteName} onChange={(e) => setGeneral({ ...general, siteName: e.target.value })} />
            <Input label="Support email" value={general.supportEmail} onChange={(e) => setGeneral({ ...general, supportEmail: e.target.value })} />
            <Input label="WhatsApp link" value={general.whatsapp} onChange={(e) => setGeneral({ ...general, whatsapp: e.target.value })} />
            <Input label="Instagram" value={general.instagram} onChange={(e) => setGeneral({ ...general, instagram: e.target.value })} />
            <Input label="Logo URL" value={general.logoUrl} onChange={(e) => setGeneral({ ...general, logoUrl: e.target.value })} className="sm:col-span-2" />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={saveGeneral}>Save brand</Button>
          </div>
        </Card>
      )}

      {activeModule === 'invoice' && <InvoiceLayoutSettings restaurantInfo={restaurantInfo} />}

      {activeModule === 'payments' && payment && (
        <Card glow>
          <h2 className="font-heading text-lg font-bold text-nb-white">Payment settings</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Input label="Publishable key" value={payment.publishableKey} onChange={(e) => setPayment({ ...payment, publishableKey: e.target.value })} />
            <Input
              label="Secret key"
              type="password"
              placeholder={payment.hasSecretKey ? 'Leave blank to keep current' : ''}
              value={payment.secretKey}
              onChange={(e) => setPayment({ ...payment, secretKey: e.target.value })}
            />
            <Input
              label="Webhook secret"
              type="password"
              placeholder={payment.hasWebhookSecret ? 'Leave blank to keep current' : ''}
              value={payment.webhookSecret}
              onChange={(e) => setPayment({ ...payment, webhookSecret: e.target.value })}
            />
            <Select label="Currency" value={payment.currency} onChange={(e) => setPayment({ ...payment, currency: e.target.value })}>
              <option>INR</option>
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
            </Select>
            <Input label="Tax rate %" type="number" value={payment.taxRatePercent} onChange={(e) => setPayment({ ...payment, taxRatePercent: Number(e.target.value) })} />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={savePayment}>Save payments</Button>
          </div>
        </Card>
      )}

      {activeModule === 'payments' && !payment && (
        <Card>
          <h2 className="font-heading text-lg font-bold text-nb-white">Payment settings</h2>
          <p className="mt-2 text-sm text-nb-gray">
            Payment controls are available to admin and super admin roles only.
          </p>
        </Card>
      )}

      {activeModule === 'system' && (
        <div className="space-y-4">
          <Card>
            <h2 className="font-heading text-lg font-bold text-nb-white">SMTP draft</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Input label="Host" value={smtp.host} onChange={(e) => setSmtp({ ...smtp, host: e.target.value })} />
              <Input label="Port" type="number" value={smtp.port} onChange={(e) => setSmtp({ ...smtp, port: Number(e.target.value) })} />
              <Input label="Username" value={smtp.user} onChange={(e) => setSmtp({ ...smtp, user: e.target.value })} />
              <Input label="Password" type="password" value={smtp.pass} onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })} />
              <label className="flex items-center gap-2 text-sm text-nb-gray sm:col-span-2">
                <input type="checkbox" checked={smtp.secure} onChange={(e) => setSmtp({ ...smtp, secure: e.target.checked })} />
                TLS / secure
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={saveSmtp}>Save SMTP</Button>
            </div>
          </Card>

          <Card>
            <h2 className="font-heading text-lg font-bold text-nb-white">Raw app settings ({app.length})</h2>
            <p className="text-sm text-nb-gray">Audit trail of persisted configuration blobs.</p>
            <ul className="mt-3 space-y-2 text-xs text-nb-gray">
              {(Array.isArray(app) ? app : []).map((row) => (
                <li key={row._id} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono">
                  {row.key}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  )
}
