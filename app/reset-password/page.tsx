'use client'

import { Suspense, useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { BrandLogo } from '@/components/shared/BrandLogo'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const [token] = useState(() => searchParams.get('token') || '')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (token) window.history.replaceState(window.history.state, '', '/reset-password')
  }, [token])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password.length < 8) return setError('Use at least 8 characters.')
    if (password !== confirm) return setError('Passwords do not match.')
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) return setError(body.error || 'Unable to reset password. Please request a new link.')
      setDone(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f4ed] flex flex-col items-center px-4 py-8">
      <BrandLogo href="/" size="md" />
      <div className="w-full max-w-md mt-16 rounded-2xl border border-[#121316]/10 bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-[#121316]">Choose a new password</h1>
        {done ? (
          <p role="status" className="mt-6 rounded-xl bg-green-50 p-4 text-sm text-green-800">Your password has been changed. Sign in with your new password.</p>
        ) : !token ? (
          <p role="alert" className="mt-6 text-sm text-red-600">This reset link is missing or invalid. Please request a new one.</p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label htmlFor="password" className="block text-sm font-semibold">New password</label>
            <input id="password" type="password" required minLength={8} maxLength={1024} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-[#121316]/20 px-4 py-3 text-sm" />
            <label htmlFor="confirm" className="block text-sm font-semibold">Confirm new password</label>
            <input id="confirm" type="password" required minLength={8} maxLength={1024} autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} className="w-full rounded-xl border border-[#121316]/20 px-4 py-3 text-sm" />
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={busy} className="w-full rounded-xl bg-[#121316] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{busy ? 'Changing password…' : 'Change password'}</button>
          </form>
        )}
        <Link href={token && !done ? '/forgot-password' : '/login'} className="mt-6 block text-center text-sm font-semibold text-[#52504b] hover:text-[#ee382b]">{token && !done ? 'Request a new link' : 'Back to sign in'}</Link>
      </div>
    </main>
  )
}

export default function ResetPasswordPage() {
  return <Suspense><ResetPasswordForm /></Suspense>
}
