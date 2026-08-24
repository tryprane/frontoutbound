'use client'

import { useState } from 'react'

type ImapSmtpAccountFormProps = {
  providerLabel: string
  endpoint: string
  description: string
  passwordLabel: string
  defaults: {
    smtpHost: string
    smtpPort: string
    smtpSecure: boolean
    imapHost: string
    imapPort: string
    imapSecure: boolean
  }
  showUsernames?: boolean
  saveLabel: string
  onAccountAdded?: () => void
}

type FormData = {
  displayName: string
  email: string
  smtpHost: string
  smtpPort: string
  smtpUsername: string
  smtpSecure: boolean
  imapHost: string
  imapPort: string
  imapUsername: string
  imapSecure: boolean
  password: string
  dailyLimit: string
}

export function ImapSmtpAccountForm({
  providerLabel,
  endpoint,
  description,
  passwordLabel,
  defaults,
  showUsernames = false,
  saveLabel,
  onAccountAdded,
}: ImapSmtpAccountFormProps) {
  const defaultForm: FormData = {
    displayName: '',
    email: '',
    smtpHost: defaults.smtpHost,
    smtpPort: defaults.smtpPort,
    smtpUsername: '',
    smtpSecure: defaults.smtpSecure,
    imapHost: defaults.imapHost,
    imapPort: defaults.imapPort,
    imapUsername: '',
    imapSecure: defaults.imapSecure,
    password: '',
    dailyLimit: '40',
  }
  const [form, setForm] = useState<FormData>(defaultForm)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = event.target instanceof HTMLInputElement && event.target.type === 'checkbox'
      ? event.target.checked
      : event.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
    setTestResult(null)
    setError(null)
  }

  const buildPayload = (testOnly = false) => ({
    displayName: form.displayName || form.email,
    email: form.email,
    smtpHost: form.smtpHost,
    smtpPort: Number(form.smtpPort),
    smtpUsername: form.smtpUsername || form.email,
    smtpSecure: form.smtpSecure,
    imapHost: form.imapHost,
    imapPort: Number(form.imapPort),
    imapUsername: form.imapUsername || form.email,
    imapSecure: form.imapSecure,
    password: form.password,
    dailyLimit: Number(form.dailyLimit),
    testOnly,
  })

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    setError(null)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(true)),
      })
      const data = await res.json()
      setTestResult({ ok: res.ok, msg: data.message || data.error })
    } catch {
      setTestResult({ ok: false, msg: 'Could not reach server' })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(false)),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setForm(defaultForm)
      onAccountAdded?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to save ${providerLabel} account`)
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: 'var(--text-primary)',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
  }
  const labelStyle = {
    fontSize: '12px',
    fontWeight: 600 as const,
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '6px',
    display: 'block',
  }

  return (
    <div>
      <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{description}</div>
      <div className="grid gap-4 sm:grid-cols-2" style={{ marginBottom: '16px' }}>
        <div><label style={labelStyle}>Display Name</label><input style={inputStyle} placeholder="e.g. Sales Inbox" value={form.displayName} onChange={set('displayName')} /></div>
        <div><label style={labelStyle}>Email Address *</label><input style={inputStyle} type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} /></div>
        {showUsernames ? <div><label style={labelStyle}>SMTP Username</label><input style={inputStyle} placeholder="Defaults to email" value={form.smtpUsername} onChange={set('smtpUsername')} /></div> : null}
        {showUsernames ? <div><label style={labelStyle}>IMAP Username</label><input style={inputStyle} placeholder="Defaults to email" value={form.imapUsername} onChange={set('imapUsername')} /></div> : null}
        <div><label style={labelStyle}>SMTP Host *</label><input style={inputStyle} value={form.smtpHost} onChange={set('smtpHost')} /></div>
        <div><label style={labelStyle}>SMTP Port *</label><input style={inputStyle} value={form.smtpPort} onChange={set('smtpPort')} /></div>
        <div><label style={labelStyle}>IMAP Host *</label><input style={inputStyle} value={form.imapHost} onChange={set('imapHost')} /></div>
        <div><label style={labelStyle}>IMAP Port *</label><input style={inputStyle} value={form.imapPort} onChange={set('imapPort')} /></div>
        <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}><input type="checkbox" checked={form.smtpSecure} onChange={set('smtpSecure')} /> SMTP uses SSL on connect</label>
        <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}><input type="checkbox" checked={form.imapSecure} onChange={set('imapSecure')} /> IMAP uses SSL on connect</label>
        <div><label style={labelStyle}>{passwordLabel} *</label><input style={inputStyle} type="password" value={form.password} onChange={set('password')} /></div>
        <div><label style={labelStyle}>Daily Send Limit</label><input style={inputStyle} type="number" min="1" max="500" value={form.dailyLimit} onChange={set('dailyLimit')} /></div>
      </div>
      {testResult ? <div style={{ padding: '10px 14px', background: testResult.ok ? 'rgba(34, 211, 165, 0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${testResult.ok ? 'rgba(34,211,165,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '8px', color: testResult.ok ? 'var(--success)' : 'var(--error)', fontSize: '13px', marginBottom: '16px' }}>{testResult.msg}</div> : null}
      {error ? <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: 'var(--error)', fontSize: '13px', marginBottom: '16px' }}>{error}</div> : null}
      <div className="flex flex-col gap-2 sm:flex-row" style={{ gap: '10px' }}>
        <button className="btn-ghost" onClick={handleTest} disabled={testing || !form.email || !form.password} style={{ opacity: testing || !form.email || !form.password ? 0.5 : 1 }}>{testing ? 'Testing...' : 'Test SMTP + IMAP'}</button>
        <button className="btn-primary" onClick={handleSave} disabled={saving || !form.email || !form.password} style={{ opacity: saving || !form.email || !form.password ? 0.5 : 1 }}>{saving ? 'Saving...' : saveLabel}</button>
      </div>
    </div>
  )
}
