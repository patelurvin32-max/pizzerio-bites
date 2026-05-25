import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import Card from '../../components/common/Card.jsx'
import * as auth from '../../services/authService.js'
import { useNotify } from '../../context/NotificationContext.jsx'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = useMemo(() => params.get('token') || '', [params])
  const notify = useNotify()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      await auth.resetPassword({ token, password })
      notify.success('Password updated — you can sign in.')
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
          <h1 className="font-heading text-xl font-bold text-nb-white">Choose a new password</h1>
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <Input label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={10} required />
            <input type="hidden" value={token} readOnly />
            <Button type="submit" className="w-full" disabled={busy || !token}>
              {busy ? 'Saving…' : 'Update password'}
            </Button>
            {!token && <p className="text-xs text-nb-neon-red">Missing token — open the link from your email (or dev console).</p>}
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
