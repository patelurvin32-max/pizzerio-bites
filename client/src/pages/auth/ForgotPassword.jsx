import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import Card from '../../components/common/Card.jsx'
import * as auth from '../../services/authService.js'
import { useNotify } from '../../context/NotificationContext.jsx'

export default function ForgotPassword() {
  const notify = useNotify()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await auth.forgotPassword(email)
      notify.info(res.message + (res.devResetUrl ? ` Dev link: ${res.devResetUrl}` : ''))
    } catch (err) {
      notify.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card glow className="p-6 sm:p-8">
          <h1 className="font-heading text-xl font-bold text-nb-white">Reset access</h1>
          <p className="mt-1 text-sm text-nb-gray">We will email instructions when SMTP is configured. In development, the API returns a reset URL in the response body.</p>
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm">
            <Link className="text-nb-neon-orange hover:underline" to="/login">
              Back to login
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  )
}
