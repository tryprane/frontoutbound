'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { BrandLogo } from '@/components/shared/BrandLogo'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (!response.ok) throw new Error('Request failed')
      setSent(true)
    } catch {
      setError('We could not process your request right now. Please try again shortly.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f4ed] flex flex-col items-center px-4 py-8">
      <BrandLogo href="/" size="md" />
      <div className="w-full max-w-md mt-16 rounded-2xl border border-[#121316]/10 bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-[#121316]">Reset your password</h1>
        <p className="mt-2 text-sm text-[#62605c]">Enter your Outreach OS login email. If an account exists, we’ll send a reset link valid for 30 minutes.</p>
        {sent ? (
          <p role="status" className="mt-6 rounded-xl bg-green-50 p-4 text-sm text-green-800">If an account exists for that email, we’ll send a password reset link. Check your inbox and spam folder.</p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label htmlFor="email" className="block text-sm font-semibold text-[#121316]">Email address</label>
            <input id="email" type="email" required autoComplete="email" maxLength={320} value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-[#121316]/20 px-4 py-3 text-sm" placeholder="you@company.com" />
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={busy} className="w-full rounded-xl bg-[#121316] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{busy ? 'Sending…' : 'Send reset link'}</button>
          </form>
        )}
        <Link href="/login" className="mt-6 block text-center text-sm font-semibold text-[#52504b] hover:text-[#ee382b]">Back to sign in</Link>
      </div>
    </main>
  )
}
