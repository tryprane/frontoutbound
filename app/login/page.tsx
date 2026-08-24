'use client'

import { signIn } from 'next-auth/react'
import { useState, useTransition } from 'react'
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

export default function LoginPage() {
  // const [googleLoading, setGoogleLoading] = useState(false) // deprecated — Google sign-in temporarily disabled
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  })
  const [isPending, startTransition] = useTransition()

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {}

    if (!credentials.email.trim()) {
      errors.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email.trim())) {
      errors.email = 'Please enter a valid email address.'
    }

    if (!credentials.password) {
      errors.password = 'Password is required.'
    } else if (credentials.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const getCallbackUrl = () => {
    if (typeof window === 'undefined') return '/dashboard'
    const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl')

    if (callbackUrl?.startsWith('/') && !callbackUrl.startsWith('/login')) {
      return `${window.location.origin}${callbackUrl}`
    }

    try {
      if (callbackUrl) {
        const target = new URL(callbackUrl)
        if (target.origin === window.location.origin && target.pathname !== '/login') {
          return target.toString()
        }
      }
    } catch {
      // Fall through to the workspace default.
    }

    return `${window.location.origin}/dashboard`
  }

  // const handleGoogleSignIn = async () => {
  //   setError('')
  //   setGoogleLoading(true)
  //   await signIn('google', { callbackUrl: getCallbackUrl() })
  // }
  // NOTE: Google sign-in is deprecated for now — will be re-enabled in a future release.

  const handleCredentialsSignIn = () => {
    setError('')
    setFieldErrors({})

    if (!validate()) return

    startTransition(async () => {
      const result = await signIn('credentials', {
        email: credentials.email.trim(),
        password: credentials.password,
        redirect: false,
        callbackUrl: getCallbackUrl(),
      })

      if (result?.error) {
        setError('Those credentials did not match any active user account.')
        return
      }

      window.location.href = result?.url || getCallbackUrl()
    })
  }


  return (
    <div
      className="relative h-screen overflow-hidden flex flex-col"
      style={{
        background:
          'radial-gradient(circle at top left, rgba(215,179,120,0.18), transparent 24%), radial-gradient(circle at 85% 12%, rgba(33,44,63,0.08), transparent 20%), linear-gradient(180deg, #f8f4ed 0%, #f5f1e8 100%)',
      }}
    >
      {/* Nav bar — matches landing page */}
      <nav className="relative z-10 grid grid-cols-3 items-center px-6 py-5 w-full">
        {/* Left — back link */}
        <a
          href="/"
          className="text-xs font-semibold text-[#52504b] hover:text-[#121316] transition-colors justify-self-start"
        >
          ← Back to home
        </a>

        {/* Center — brand logo */}
        <a href="/" className="flex items-center gap-2.5 justify-self-center">
          <div className="w-8 h-8 rounded-lg bg-[#121316] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-extrabold text-xs tracking-tight">OS</span>
          </div>
          <span
            className="font-extrabold text-[#121316] text-lg tracking-tight"
            style={{ fontFamily: "'Zoho Puvi','ZohoPuvi',-apple-system,sans-serif" }}
          >
            Outreach OS
          </span>
        </a>

        {/* Right — empty spacer */}
        <div />
      </nav>

      {/* Main content */}
      <div className="relative z-10 flex-1 overflow-y-auto flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

          {/* Left — brand copy (desktop only) */}
          <div className="hidden lg:flex lg:flex-col lg:gap-7">
            <div className="space-y-3">
              <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase">
                WELCOME BACK
              </span>
              <h1
                className="text-4xl text-[#121316] leading-tight"
                style={{ fontFamily: "'Zoho Puvi','ZohoPuvi',-apple-system,sans-serif", fontWeight: 700 }}
              >
                Your cold email command center awaits.
              </h1>
              <p className="text-[#52504b] text-sm leading-relaxed max-w-sm">
                One login. Full access to mailbox health, lead queues, warmup sequences, and your unified reply inbox.
              </p>
            </div>

            {/* Price chips */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#62605c] uppercase tracking-widest">
                Replacing your old stack
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Smartlead', price: '$94/mo' },
                  { label: 'Warmup', price: '$50/mo' },
                  { label: 'Domain Health', price: '$49/mo' },
                  { label: 'CSV Scrubber', price: '$35/mo' },
                ].map((chip) => (
                  <span
                    key={chip.label}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#121316]/10 bg-white/60 text-xs font-semibold text-[#52504b]"
                  >
                    <span className="font-extrabold text-[#121316]">{chip.price}</span>
                    <span>{chip.label}</span>
                  </span>
                ))}
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ee382b] text-white text-xs font-extrabold">
                  → All in one
                </span>
              </div>
            </div>
          </div>

          {/* Right — sign-in card */}
          <div
            className="w-full rounded-2xl border border-[#121316]/10 bg-white/80 shadow-[0_20px_60px_rgba(18,19,22,0.08)] p-8 space-y-6 backdrop-blur-sm"
            style={{ maxWidth: '440px', margin: '0 auto' }}
          >
            {/* Card header */}
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#121316] text-white flex items-center justify-center shadow-md">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2
                  className="text-2xl text-[#121316] leading-tight"
                  style={{ fontFamily: "'Zoho Puvi','ZohoPuvi',-apple-system,sans-serif", fontWeight: 700 }}
                >
                  Sign in to Outreach OS
                </h2>
                <p className="text-sm text-[#52504b] mt-1 leading-relaxed">
                  Enter your workspace credentials to continue.
                </p>
              </div>
            </div>

            {/* Form fields */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold text-[#121316] uppercase tracking-wider">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d877d]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    className={`h-11 rounded-xl border bg-[#faf8f4] pl-10 text-sm placeholder:text-[#a09e97] ${
                      fieldErrors.email
                        ? 'border-[#ee382b]/60 focus-visible:ring-[#ee382b]/30'
                        : 'border-[#121316]/10'
                    }`}
                    value={credentials.email}
                    onChange={(event) => {
                      setCredentials((current) => ({ ...current, email: event.target.value }))
                      if (fieldErrors.email) setFieldErrors((e) => ({ ...e, email: undefined }))
                    }}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-xs text-[#ee382b] font-medium mt-1">{fieldErrors.email}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-bold text-[#121316] uppercase tracking-wider">
                  Password
                </Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d877d]" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className={`h-11 rounded-xl border bg-[#faf8f4] pl-10 text-sm placeholder:text-[#a09e97] ${
                      fieldErrors.password
                        ? 'border-[#ee382b]/60 focus-visible:ring-[#ee382b]/30'
                        : 'border-[#121316]/10'
                    }`}
                    value={credentials.password}
                    onChange={(event) => {
                      setCredentials((current) => ({ ...current, password: event.target.value }))
                      if (fieldErrors.password) setFieldErrors((e) => ({ ...e, password: undefined }))
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        handleCredentialsSignIn()
                      }
                    }}
                  />
                </div>
                {fieldErrors.password && (
                  <p className="text-xs text-[#ee382b] font-medium mt-1">{fieldErrors.password}</p>
                )}
              </div>
            </div>

            {/* Error */}
            {error ? (
              <div className="rounded-xl border border-[#ee382b]/20 bg-[#ee382b]/5 px-4 py-3 text-sm text-[#ee382b] font-medium">
                {error}
              </div>
            ) : null}

            {/* Primary CTA */}
            <button
              onClick={handleCredentialsSignIn}
              disabled={isPending}
              className="w-full h-11 rounded-xl bg-[#121316] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#2a2d33] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? 'Signing in…' : 'Continue to workspace'}
              {!isPending && <ArrowRight className="w-4 h-4" />}
            </button>

            {/* Divider — hidden while Google sign-in is deprecated */}
            {/* <div className="flex items-center gap-3">
              <Separator className="flex-1 bg-[#121316]/08" />
              <span className="text-xs uppercase tracking-widest text-[#a09e97] font-semibold">or</span>
              <Separator className="flex-1 bg-[#121316]/08" />
            </div> */}

            {/* Google sign-in — deprecated for now, will be re-enabled in a future release */}
            {/* <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full h-11 rounded-xl border border-[#121316]/10 bg-[#faf8f4] text-sm font-semibold text-[#121316] flex items-center justify-center gap-2.5 hover:bg-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {googleLoading ? 'Redirecting…' : 'Continue with Google'}
            </button> */}

            {/* Footer note */}
            <p className="text-xs text-[#a09e97] text-center leading-relaxed">
              Client and internal users can sign in once an account has been created in Prane.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
