'use client'

import { signIn } from 'next-auth/react'
import { useState, useTransition, useEffect, Suspense, FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight,
  Building2,
  Check,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type AuthMode = 'signin' | 'invite'

function LoginFormContent() {
  const searchParams = useSearchParams()
  const initialCode = searchParams.get('code') || searchParams.get('invite') || ''
  const initialTab = searchParams.get('tab') === 'invite' || !!initialCode ? 'invite' : 'signin'

  const [mode, setMode] = useState<AuthMode>(initialTab)

  // Sign in state
  const [signInCredentials, setSignInCredentials] = useState({
    email: '',
    password: '',
  })
  const [signInErrors, setSignInErrors] = useState<{ email?: string; password?: string }>({})
  const [signInError, setSignInError] = useState('')
  const [isSigningIn, startSignInTransition] = useTransition()

  // Invite code state
  const [inviteCode, setInviteCode] = useState(initialCode)
  const [verifiedCode, setVerifiedCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [inviteMessage, setInviteMessage] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [registration, setRegistration] = useState({
    organizationName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [registrationErrors, setRegistrationErrors] = useState<{
    organizationName?: string
    email?: string
    password?: string
    confirmPassword?: string
  }>({})

  useEffect(() => {
    if (initialCode) {
      setInviteCode(initialCode)
      setMode('invite')
    }
  }, [initialCode])

  const getCallbackUrl = () => {
    if (typeof window === 'undefined') return '/dashboard'
    const callbackUrl = searchParams.get('callbackUrl')

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

  // Handle Credentials Sign In
  const validateSignIn = (): boolean => {
    const errors: { email?: string; password?: string } = {}

    if (!signInCredentials.email.trim()) {
      errors.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signInCredentials.email.trim())) {
      errors.email = 'Please enter a valid email address.'
    }

    if (!signInCredentials.password) {
      errors.password = 'Password is required.'
    } else if (signInCredentials.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.'
    }

    setSignInErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCredentialsSignIn = () => {
    setSignInError('')
    setSignInErrors({})

    if (!validateSignIn()) return

    startSignInTransition(async () => {
      const result = await signIn('credentials', {
        email: signInCredentials.email.trim(),
        password: signInCredentials.password,
        redirect: false,
        callbackUrl: getCallbackUrl(),
      })

      if (result?.error) {
        setSignInError('Those credentials did not match any active user account.')
        return
      }

      window.location.href = result?.url || getCallbackUrl()
    })
  }

  // Handle Invite Code Verification
  const handleVerifyCode = async (event?: FormEvent) => {
    if (event) event.preventDefault()
    setInviteError('')
    setInviteMessage('')

    const codeToVerify = inviteCode.trim()
    if (!codeToVerify) {
      setInviteError('Please enter an invite code.')
      return
    }

    setIsVerifying(true)
    try {
      const response = await fetch('/api/signup/access-code/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToVerify }),
      })
      const body = await response.json().catch(() => ({}))

      if (!response.ok) {
        setInviteError(body.error || 'Unable to verify the invite code. Please check and try again.')
        return
      }

      setVerifiedCode(codeToVerify)
      setInviteMessage('Invite code verified! Complete your workspace setup below.')
    } catch {
      setInviteError('Network error while verifying invite code. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  // Handle Workspace Creation & Redemption
  const validateRegistration = (): boolean => {
    const errors: {
      organizationName?: string
      email?: string
      password?: string
      confirmPassword?: string
    } = {}

    if (!registration.organizationName.trim()) {
      errors.organizationName = 'Organization name is required.'
    }

    if (!registration.email.trim()) {
      errors.email = 'Work email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registration.email.trim())) {
      errors.email = 'Please enter a valid email address.'
    }

    if (!registration.password) {
      errors.password = 'Password is required.'
    } else if (registration.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.'
    }

    if (!registration.confirmPassword) {
      errors.confirmPassword = 'Confirm your password.'
    } else if (registration.password !== registration.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.'
    }

    setRegistrationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateAccount = async (event: FormEvent) => {
    event.preventDefault()
    setInviteError('')
    setInviteMessage('')

    if (!validateRegistration()) return

    setIsRedeeming(true)
    try {
      const response = await fetch('/api/signup/access-code/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: verifiedCode,
          organizationName: registration.organizationName.trim(),
          email: registration.email.trim(),
          password: registration.password,
          confirmPassword: registration.confirmPassword,
        }),
      })
      const body = await response.json().catch(() => ({}))

      if (!response.ok) {
        setInviteError(body.error || 'Unable to create the workspace. Please try again.')
        setIsRedeeming(false)
        return
      }

      // Automatically sign in with created credentials
      const result = await signIn('credentials', {
        email: registration.email.trim(),
        password: registration.password,
        redirect: false,
        callbackUrl: getCallbackUrl(),
      })

      if (result?.error) {
        setInviteMessage('Your workspace was created! Please sign in with your email and password.')
        setMode('signin')
        setSignInCredentials({
          email: registration.email.trim(),
          password: registration.password,
        })
        setIsRedeeming(false)
        return
      }

      window.location.href = result?.url || getCallbackUrl()
    } catch {
      setInviteError('Failed to create account. Please check your connection and try again.')
      setIsRedeeming(false)
    }
  }

  return (
    <div
      className="relative min-h-screen overflow-y-auto flex flex-col"
      style={{
        background:
          'radial-gradient(circle at top left, rgba(215,179,120,0.18), transparent 24%), radial-gradient(circle at 85% 12%, rgba(33,44,63,0.08), transparent 20%), linear-gradient(180deg, #f8f4ed 0%, #f5f1e8 100%)',
      }}
    >
      {/* Nav bar — matches landing page */}
      <nav className="relative z-10 grid grid-cols-3 items-center px-6 py-5 w-full">
        {/* Left — back link */}
        <Link
          href="/"
          className="text-xs font-semibold text-[#52504b] hover:text-[#121316] transition-colors justify-self-start"
        >
          ← Back to home
        </Link>

        {/* Center — brand logo */}
        <Link href="/" className="flex items-center gap-2.5 justify-self-center">
          <div className="w-8 h-8 rounded-lg bg-[#121316] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-extrabold text-xs tracking-tight">OS</span>
          </div>
          <span
            className="font-extrabold text-[#121316] text-lg tracking-tight"
            style={{ fontFamily: "'Zoho Puvi','ZohoPuvi',-apple-system,sans-serif" }}
          >
            Outreach OS
          </span>
        </Link>

        {/* Right — empty spacer */}
        <div />
      </nav>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left — brand copy (desktop only) */}
          <div className="hidden lg:flex lg:flex-col lg:gap-7">
            <div className="space-y-3">
              <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase">
                {mode === 'signin' ? 'WELCOME BACK' : 'INVITE-ONLY ACCESS'}
              </span>
              <h1
                className="text-4xl text-[#121316] leading-tight"
                style={{ fontFamily: "'Zoho Puvi','ZohoPuvi',-apple-system,sans-serif", fontWeight: 700 }}
              >
                {mode === 'signin'
                  ? 'Your cold email command center awaits.'
                  : 'Activate your exclusive workspace with your invite code.'}
              </h1>
              <p className="text-[#52504b] text-sm leading-relaxed max-w-sm">
                {mode === 'signin'
                  ? 'One login. Full access to mailbox health, lead queues, warmup sequences, and your unified reply inbox.'
                  : 'Join leading outbound sales teams with dedicated IP pools, inbox warmup, and automated deliverability diagnostics.'}
              </p>
            </div>

            {/* Price chips */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#62605c] uppercase tracking-widest">
                Replacing your old stack
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Smartlead', price: '₹94/mo' },
                  { label: 'Warmup', price: '₹50/mo' },
                  { label: 'Domain Health', price: '₹49/mo' },
                  { label: 'CSV Scrubber', price: '₹35/mo' },
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

          {/* Right — card container */}
          <div
            className="w-full rounded-2xl border border-[#121316]/10 bg-white/85 shadow-[0_20px_60px_rgba(18,19,22,0.08)] p-6 sm:p-8 space-y-5 backdrop-blur-sm"
            style={{ maxWidth: '440px', margin: '0 auto' }}
          >
            {/* Tab switch buttons */}
            <div className="grid grid-cols-2 p-1 bg-[#ede9e1]/70 rounded-xl border border-[#121316]/08">
              <button
                type="button"
                onClick={() => {
                  setMode('signin')
                  setSignInError('')
                  setInviteError('')
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  mode === 'signin'
                    ? 'bg-white text-[#121316] shadow-sm'
                    : 'text-[#62605c] hover:text-[#121316]'
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('invite')
                  setSignInError('')
                  setInviteError('')
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'invite'
                    ? 'bg-white text-[#121316] shadow-sm'
                    : 'text-[#62605c] hover:text-[#121316]'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Invite code</span>
              </button>
            </div>

            {/* Mode 1: Sign in */}
            {mode === 'signin' ? (
              <div className="space-y-5">
                {/* Card header */}
                <div className="space-y-3">
                  <div className="w-11 h-11 rounded-xl bg-[#121316] text-white flex items-center justify-center shadow-md">
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
                <div className="space-y-3.5">
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
                          signInErrors.email
                            ? 'border-[#ee382b]/60 focus-visible:ring-[#ee382b]/30'
                            : 'border-[#121316]/10'
                        }`}
                        value={signInCredentials.email}
                        onChange={(event) => {
                          setSignInCredentials((current) => ({ ...current, email: event.target.value }))
                          if (signInErrors.email) setSignInErrors((e) => ({ ...e, email: undefined }))
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') handleCredentialsSignIn()
                        }}
                      />
                    </div>
                    {signInErrors.email && (
                      <p className="text-xs text-[#ee382b] font-medium mt-1">{signInErrors.email}</p>
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
                          signInErrors.password
                            ? 'border-[#ee382b]/60 focus-visible:ring-[#ee382b]/30'
                            : 'border-[#121316]/10'
                        }`}
                        value={signInCredentials.password}
                        onChange={(event) => {
                          setSignInCredentials((current) => ({ ...current, password: event.target.value }))
                          if (signInErrors.password) setSignInErrors((e) => ({ ...e, password: undefined }))
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') handleCredentialsSignIn()
                        }}
                      />
                    </div>
                    {signInErrors.password && (
                      <p className="text-xs text-[#ee382b] font-medium mt-1">{signInErrors.password}</p>
                    )}
                  </div>
                </div>

                {/* Error */}
                {signInError ? (
                  <div className="rounded-xl border border-[#ee382b]/20 bg-[#ee382b]/5 px-4 py-3 text-sm text-[#ee382b] font-medium">
                    {signInError}
                  </div>
                ) : null}

                {/* Primary CTA */}
                <button
                  type="button"
                  onClick={handleCredentialsSignIn}
                  disabled={isSigningIn}
                  className="w-full h-11 rounded-xl bg-[#121316] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#2a2d33] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                >
                  {isSigningIn ? 'Signing in…' : 'Continue to workspace'}
                  {!isSigningIn && <ArrowRight className="w-4 h-4" />}
                </button>

                {/* Invite code prompt */}
                <div className="pt-2 border-t border-[#121316]/08 flex flex-col items-center gap-1.5 text-center">
                  <p className="text-xs text-[#62605c]">
                    Have an invite or access code?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('invite')
                        setSignInError('')
                      }}
                      className="font-bold text-[#121316] hover:text-[#ee382b] underline underline-offset-2 transition-colors"
                    >
                      Redeem invite code →
                    </button>
                  </p>
                  <p className="text-[11px] text-[#a09e97] leading-relaxed">
                    Client and internal users can sign in once an account has been created in Prane.
                  </p>
                </div>
              </div>
            ) : (
              /* Mode 2: Invite code redemption */
              <div className="space-y-5">
                {/* Card header */}
                <div className="space-y-3">
                  <div className="w-11 h-11 rounded-xl bg-[#ee382b] text-white flex items-center justify-center shadow-md">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h2
                      className="text-2xl text-[#121316] leading-tight"
                      style={{ fontFamily: "'Zoho Puvi','ZohoPuvi',-apple-system,sans-serif", fontWeight: 700 }}
                    >
                      {verifiedCode ? 'Create Your Workspace' : 'Redeem Invite Code'}
                    </h2>
                    <p className="text-sm text-[#52504b] mt-1 leading-relaxed">
                      {verifiedCode
                        ? 'Set up your organization and admin credentials.'
                        : 'Enter your exclusive invite code to activate access.'}
                    </p>
                  </div>
                </div>

                {/* Step 1: Enter & verify code */}
                {!verifiedCode ? (
                  <form onSubmit={handleVerifyCode} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="inviteCode" className="text-xs font-bold text-[#121316] uppercase tracking-wider">
                        Invite Code
                      </Label>
                      <div className="relative">
                        <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d877d]" />
                        <Input
                          id="inviteCode"
                          type="text"
                          placeholder="e.g. PRANE-XXXX-XXXX"
                          className="h-11 rounded-xl border border-[#121316]/10 bg-[#faf8f4] pl-10 text-sm font-mono uppercase tracking-wider placeholder:normal-case placeholder:font-sans placeholder:tracking-normal placeholder:text-[#a09e97]"
                          value={inviteCode}
                          onChange={(event) => {
                            setInviteCode(event.target.value)
                            if (inviteError) setInviteError('')
                          }}
                          autoComplete="off"
                          autoFocus
                        />
                      </div>
                    </div>

                    {inviteError ? (
                      <div className="rounded-xl border border-[#ee382b]/20 bg-[#ee382b]/5 px-4 py-3 text-sm text-[#ee382b] font-medium">
                        {inviteError}
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={isVerifying || !inviteCode.trim()}
                      className="w-full h-11 rounded-xl bg-[#121316] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#2a2d33] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                    >
                      {isVerifying ? 'Verifying code…' : 'Continue with code'}
                      {!isVerifying && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </form>
                ) : (
                  /* Step 2: Code verified -> Fill registration details */
                  <form onSubmit={handleCreateAccount} className="space-y-3.5">
                    {/* Verified code pill */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#0f8a5f]/08 border border-[#0f8a5f]/20">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#0f8a5f]" />
                        <span className="text-xs font-semibold text-[#0f8a5f]">
                          Code applied:{' '}
                          <span className="font-mono font-bold tracking-wide">{verifiedCode}</span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setVerifiedCode('')
                          setInviteMessage('')
                        }}
                        className="text-xs text-[#52504b] hover:text-[#121316] underline font-medium"
                      >
                        Change
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="orgName" className="text-xs font-bold text-[#121316] uppercase tracking-wider">
                        Organization Name
                      </Label>
                      <div className="relative">
                        <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d877d]" />
                        <Input
                          id="orgName"
                          placeholder="Acme Growth Inc."
                          className={`h-11 rounded-xl border bg-[#faf8f4] pl-10 text-sm placeholder:text-[#a09e97] ${
                            registrationErrors.organizationName
                              ? 'border-[#ee382b]/60 focus-visible:ring-[#ee382b]/30'
                              : 'border-[#121316]/10'
                          }`}
                          value={registration.organizationName}
                          onChange={(e) => {
                            setRegistration((r) => ({ ...r, organizationName: e.target.value }))
                            if (registrationErrors.organizationName) {
                              setRegistrationErrors((err) => ({ ...err, organizationName: undefined }))
                            }
                          }}
                          required
                        />
                      </div>
                      {registrationErrors.organizationName && (
                        <p className="text-xs text-[#ee382b] font-medium">{registrationErrors.organizationName}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="workEmail" className="text-xs font-bold text-[#121316] uppercase tracking-wider">
                        Work Email
                      </Label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d877d]" />
                        <Input
                          id="workEmail"
                          type="email"
                          placeholder="founder@company.com"
                          className={`h-11 rounded-xl border bg-[#faf8f4] pl-10 text-sm placeholder:text-[#a09e97] ${
                            registrationErrors.email
                              ? 'border-[#ee382b]/60 focus-visible:ring-[#ee382b]/30'
                              : 'border-[#121316]/10'
                          }`}
                          value={registration.email}
                          onChange={(e) => {
                            setRegistration((r) => ({ ...r, email: e.target.value }))
                            if (registrationErrors.email) {
                              setRegistrationErrors((err) => ({ ...err, email: undefined }))
                            }
                          }}
                          required
                        />
                      </div>
                      {registrationErrors.email && (
                        <p className="text-xs text-[#ee382b] font-medium">{registrationErrors.email}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="regPassword" className="text-xs font-bold text-[#121316] uppercase tracking-wider">
                        Password
                      </Label>
                      <div className="relative">
                        <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d877d]" />
                        <Input
                          id="regPassword"
                          type="password"
                          placeholder="At least 8 characters"
                          className={`h-11 rounded-xl border bg-[#faf8f4] pl-10 text-sm placeholder:text-[#a09e97] ${
                            registrationErrors.password
                              ? 'border-[#ee382b]/60 focus-visible:ring-[#ee382b]/30'
                              : 'border-[#121316]/10'
                          }`}
                          value={registration.password}
                          onChange={(e) => {
                            setRegistration((r) => ({ ...r, password: e.target.value }))
                            if (registrationErrors.password) {
                              setRegistrationErrors((err) => ({ ...err, password: undefined }))
                            }
                          }}
                          required
                        />
                      </div>
                      {registrationErrors.password && (
                        <p className="text-xs text-[#ee382b] font-medium">{registrationErrors.password}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword" className="text-xs font-bold text-[#121316] uppercase tracking-wider">
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d877d]" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Re-enter password"
                          className={`h-11 rounded-xl border bg-[#faf8f4] pl-10 text-sm placeholder:text-[#a09e97] ${
                            registrationErrors.confirmPassword
                              ? 'border-[#ee382b]/60 focus-visible:ring-[#ee382b]/30'
                              : 'border-[#121316]/10'
                          }`}
                          value={registration.confirmPassword}
                          onChange={(e) => {
                            setRegistration((r) => ({ ...r, confirmPassword: e.target.value }))
                            if (registrationErrors.confirmPassword) {
                              setRegistrationErrors((err) => ({ ...err, confirmPassword: undefined }))
                            }
                          }}
                          required
                        />
                      </div>
                      {registrationErrors.confirmPassword && (
                        <p className="text-xs text-[#ee382b] font-medium">{registrationErrors.confirmPassword}</p>
                      )}
                    </div>

                    {inviteError ? (
                      <div className="rounded-xl border border-[#ee382b]/20 bg-[#ee382b]/5 px-4 py-3 text-sm text-[#ee382b] font-medium">
                        {inviteError}
                      </div>
                    ) : null}

                    {inviteMessage ? (
                      <div className="rounded-xl border border-[#0f8a5f]/20 bg-[#0f8a5f]/5 px-4 py-3 text-sm text-[#0f8a5f] font-medium flex items-center gap-2">
                        <Sparkles className="w-4 h-4 flex-shrink-0" />
                        <span>{inviteMessage}</span>
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={isRedeeming}
                      className="w-full h-11 rounded-xl bg-[#121316] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#2a2d33] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                    >
                      {isRedeeming ? 'Creating workspace…' : 'Create organization and account'}
                      {!isRedeeming && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </form>
                )}

                {/* Footer switch back */}
                <div className="pt-2 border-t border-[#121316]/08 text-center">
                  <p className="text-xs text-[#62605c]">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin')
                        setInviteError('')
                      }}
                      className="font-bold text-[#121316] hover:text-[#ee382b] underline underline-offset-2 transition-colors"
                    >
                      Sign in to workspace →
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-[#f8f4ed]">
          <div className="text-sm font-semibold text-[#62605c]">Loading Outreach OS…</div>
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  )
}
