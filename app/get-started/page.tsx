'use client'

import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { ArrowLeft, Check, KeyRound, ShieldCheck } from 'lucide-react'
import { FormEvent, MouseEvent, useState } from 'react'

type Currency = 'INR' | 'USD'

export default function GetStartedPage() {
  const [currency, setCurrency] = useState<Currency>('INR')
  const [inviteCode, setInviteCode] = useState('')
  const [verifiedCode, setVerifiedCode] = useState('')
  const [registration, setRegistration] = useState({ organizationName: '', email: '', password: '', confirmPassword: '' })
  const [message, setMessage] = useState('')
  const isInr = currency === 'INR'
  const price = '₹999'

  const showInviteOnly = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    setMessage('New access is currently invite-only. Existing users can log in to their workspace.')
  }

  const verifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    const response = await fetch('/api/signup/access-code/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: inviteCode }) })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) return setMessage(body.error || 'Unable to verify the access code.')
    setVerifiedCode(inviteCode)
  }

  const createAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    const response = await fetch('/api/signup/access-code/redeem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: verifiedCode, ...registration }) })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) return setMessage(body.error || 'Unable to create the workspace.')
    const result = await signIn('credentials', {
      email: registration.email,
      password: registration.password,
      redirect: false,
      callbackUrl: `${window.location.origin}/dashboard`,
    })
    if (result?.error) {
      setMessage('Your workspace was created. Sign in with the email and password you just entered.')
      return
    }
    window.location.href = result?.url || '/dashboard'
  }

  return (
    <main className="access-page">
      <nav className="landing-nav">
        <Link href="/" className="landing-brand" aria-label="OutreachOS home"><span className="landing-brand-mark">OS</span><span>OutreachOS</span></Link>
        <Link href="/" className="access-back"><ArrowLeft size={16} /> Back to home</Link>
      </nav>
      <section className="access-shell" aria-labelledby="access-title">
        <div className="access-intro">
          <span className="landing-kicker">OutreachOS access</span>
          <h1 id="access-title">Give your outbound work one reliable home.</h1>
          <p>Choose your preferred currency, then request access to campaigns, mailbox control, warmup, and response handling.</p>
          <div className="access-assurance"><ShieldCheck size={18} /> No payment is collected on this page yet.</div>
        </div>
        <div className="access-panel">
          <div className="access-currency" role="group" aria-label="Billing currency">
            <button type="button" className={isInr ? 'is-active' : ''} onClick={() => { setCurrency('INR'); setMessage('') }}>INR</button>
            <button type="button" className={!isInr ? 'is-active' : ''} onClick={() => { setCurrency('USD'); setMessage('') }}>USD</button>
          </div>
          <div className="access-plan">
            <div><span>OutreachOS</span><h2>{price}<small>/ month</small></h2></div>
            <span className="access-plan-label">Monthly access</span>
          </div>
          <ul className="access-includes">
            <li><Check size={16} />Campaign and sender-pool controls</li>
            <li><Check size={16} />Gmail, Zoho, and Outlook support</li>
            <li><Check size={16} />Warmup, health, and reply workspace</li>
          </ul>
          <button type="button" className="landing-button landing-button-primary access-buy" onClick={showInviteOnly}>Pay {price} and create account</button>
          <div className="access-divider"><span>or</span></div>
          {!verifiedCode ? <form className="access-code" onSubmit={verifyCode}>
            <label htmlFor="invite-code"><KeyRound size={16} /> Have an invite code?</label>
            <div><input id="invite-code" value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} placeholder="Enter your access code" autoComplete="off" /><button type="submit">Continue with code</button></div>
          </form>
          : <form className="access-code space-y-3" onSubmit={createAccount}>
            <label><KeyRound size={16} /> Create your workspace</label>
            <input value={registration.organizationName} onChange={(event) => setRegistration({ ...registration, organizationName: event.target.value })} placeholder="Organization name" required />
            <input value={registration.email} onChange={(event) => setRegistration({ ...registration, email: event.target.value })} placeholder="Work email" type="email" required />
            <input value={registration.password} onChange={(event) => setRegistration({ ...registration, password: event.target.value })} placeholder="Password (8 characters minimum)" type="password" required />
            <input value={registration.confirmPassword} onChange={(event) => setRegistration({ ...registration, confirmPassword: event.target.value })} placeholder="Confirm password" type="password" required />
            <button type="submit">Create organization and account</button>
          </form>}
          {message ? <p className="access-message" role="status">{message}</p> : null}
          <p className="access-login">Already have an account? <Link href="/login">Log in</Link></p>
        </div>
      </section>
    </main>
  )
}
