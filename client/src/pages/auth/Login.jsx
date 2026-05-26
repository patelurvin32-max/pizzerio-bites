import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import PasswordInput from '../../components/common/PasswordInput.jsx'
import Card from '../../components/common/Card.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useNotify } from '../../context/NotificationContext.jsx'

export default function Login() {
  const { login, isAuthenticated, loading } = useAuth()
  const nav = useNavigate()
  const notify = useNotify()
  const heroRef = useRef(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!loading && isAuthenticated) nav('/dashboard', { replace: true })
  }, [loading, isAuthenticated, nav])

  useEffect(() => {
    if (!heroRef.current) return undefined
    const ctx = gsap.context(() => {
      gsap.from('.nb-login-hero', { y: 18, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08 })
    }, heroRef)
    return () => ctx.revert()
  }, [])

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      await login(email, password)
      notify.success('Welcome back — Pizzerio Bites command online.')
      nav('/dashboard', { replace: true })
    } catch (err) {
      notify.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgb(255_122_0/0.18),transparent_45%),radial-gradient(circle_at_80%_0%,rgb(255_59_48/0.12),transparent_40%)]" />
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45 }} className="relative w-full max-w-md">
        <div ref={heroRef} className="mb-6 text-center">
          <p className="nb-login-hero font-heading text-3xl font-extrabold tracking-tight text-nb-white sm:text-4xl">Pizzerio Bites</p>
          {/* <p className="nb-login-hero mt-1 text-sm text-nb-gray">Premium admin access · role-secured</p> */}
        </div>
        <Card glow className="p-6 sm:p-8">
          <h1 className="font-heading text-xl font-bold text-nb-white">Sign in</h1>
          <p className="mt-1 text-sm text-nb-gray">Use your Pizzerio Bites operator credentials.</p>
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <Input label="Email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <PasswordInput label="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'Signing in…' : 'Login'}
            </Button>
          </form>
        </Card>
        {/* <p className="mt-6 text-center text-xs text-nb-gray">Secured with JWT · encrypted sessions · rate limited</p> */}
      </motion.div>
    </div>
  )
}
