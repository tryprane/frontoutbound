'use client'

import { useState } from 'react'
import { CheckCircle2, AlertCircle, Loader2, KeyRound, Save, Sparkles } from 'lucide-react'

interface ZohoAccountFormProps {
  onAccountAdded: () => void
}

interface FormData {
  displayName: string
  email: string
  smtpHost: string
  smtpPort: string
  password: string
  dailyLimit: string
}

const DEFAULT_FORM: FormData = {
  displayName: '',
  email: '',
  smtpHost: 'smtp.zoho.in',
  smtpPort: '465',
  password: '',
  dailyLimit: '40',
}

export function ZohoAccountForm({ onAccountAdded }: ZohoAccountFormProps) {
  const [form, setForm] = useState<FormData>(DEFAULT_FORM)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
    setTestResult(null)
    setError(null)
  }

  const handleTest = async () => {
    if (!form.email || !form.password) {
      setError('Please provide your Zoho email and app password first.')
      return
    }
    setTesting(true)
    setTestResult(null)
    setError(null)
    try {
      const res = await fetch('/api/mail-accounts/zoho', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          smtpHost: form.smtpHost,
          smtpPort: Number(form.smtpPort),
          password: form.password,
          testOnly: true,
        }),
      })
      const data = await res.json()
      setTestResult({ ok: res.ok, msg: data.message || data.error || (res.ok ? 'Connection verified successfully!' : 'Connection test failed') })
    } catch {
      setTestResult({ ok: false, msg: 'Could not reach server. Please check your network connection.' })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    if (!form.email || !form.password) {
      setError('Please provide your Zoho email and app password.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/mail-accounts/zoho', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: form.displayName || form.email,
          email: form.email,
          smtpHost: form.smtpHost,
          smtpPort: Number(form.smtpPort),
          password: form.password,
          dailyLimit: Number(form.dailyLimit) || 40,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save Zoho account')
      setForm(DEFAULT_FORM)
      onAccountAdded()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save Zoho account')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Display Name */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#62605c] mb-1.5">
            Display Name
          </label>
          <input
            type="text"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#121316]/12 bg-white text-xs text-[#121316] placeholder-[#8a8780] focus:outline-none focus:ring-2 focus:ring-[#d97706]/30 focus:border-[#d97706] transition-all shadow-2xs"
            placeholder="e.g. Sales Team #1"
            value={form.displayName}
            onChange={set('displayName')}
          />
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#62605c] mb-1.5">
            Zoho Email Address <span className="text-[#ee382b]">*</span>
          </label>
          <input
            type="email"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#121316]/12 bg-white text-xs text-[#121316] placeholder-[#8a8780] focus:outline-none focus:ring-2 focus:ring-[#d97706]/30 focus:border-[#d97706] transition-all shadow-2xs"
            placeholder="outreach@yourdomain.com"
            value={form.email}
            onChange={set('email')}
          />
        </div>

        {/* SMTP Host */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#62605c] mb-1.5">
            SMTP Host <span className="text-[#ee382b]">*</span>
          </label>
          <select
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#121316]/12 bg-white text-xs font-medium text-[#121316] focus:outline-none focus:ring-2 focus:ring-[#d97706]/30 focus:border-[#d97706] transition-all shadow-2xs cursor-pointer"
            value={form.smtpHost}
            onChange={set('smtpHost')}
          >
            <option value="smtp.zoho.in">smtp.zoho.in (India / .in)</option>
            <option value="smtp.zoho.com">smtp.zoho.com (International / .com)</option>
            <option value="smtp.zoho.eu">smtp.zoho.eu (Europe / .eu)</option>
            <option value="smtp.zoho.com.au">smtp.zoho.com.au (Australia / .au)</option>
          </select>
        </div>

        {/* SMTP Port */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#62605c] mb-1.5">
            SMTP Port <span className="text-[#ee382b]">*</span>
          </label>
          <select
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#121316]/12 bg-white text-xs font-medium text-[#121316] focus:outline-none focus:ring-2 focus:ring-[#d97706]/30 focus:border-[#d97706] transition-all shadow-2xs cursor-pointer"
            value={form.smtpPort}
            onChange={set('smtpPort')}
          >
            <option value="465">465 (SSL - Recommended)</option>
            <option value="587">587 (TLS / STARTTLS)</option>
          </select>
        </div>

        {/* App Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#62605c]">
              App Password <span className="text-[#ee382b]">*</span>
            </label>
            <a
              href="https://accounts.zoho.com/home#security/app_password"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-semibold text-[#d97706] hover:underline"
            >
              Generate app password ↗
            </a>
          </div>
          <input
            type="password"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#121316]/12 bg-white text-xs font-mono text-[#121316] placeholder-[#8a8780] focus:outline-none focus:ring-2 focus:ring-[#d97706]/30 focus:border-[#d97706] transition-all shadow-2xs"
            placeholder="xxxx xxxx xxxx xxxx"
            value={form.password}
            onChange={set('password')}
          />
        </div>

        {/* Daily Send Limit */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#62605c] mb-1.5">
            Daily Send Limit
          </label>
          <input
            type="number"
            min="1"
            max="500"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#121316]/12 bg-white text-xs font-mono text-[#121316] focus:outline-none focus:ring-2 focus:ring-[#d97706]/30 focus:border-[#d97706] transition-all shadow-2xs"
            value={form.dailyLimit}
            onChange={set('dailyLimit')}
          />
        </div>
      </div>

      {/* Test feedback */}
      {testResult && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 border ${
            testResult.ok
              ? 'bg-[#0f8a5f]/08 border-[#0f8a5f]/25 text-[#0f8a5f]'
              : 'bg-[#c2414c]/08 border-[#c2414c]/25 text-[#c2414c]'
          }`}
        >
          {testResult.ok ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span className="font-medium">{testResult.msg}</span>
        </div>
      )}

      {/* Error feedback */}
      {error && (
        <div className="p-3.5 rounded-xl text-xs bg-[#c2414c]/08 border border-[#c2414c]/25 text-[#c2414c] flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleTest}
          disabled={testing || saving || !form.email || !form.password}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-[#121316]/12 bg-white text-xs font-semibold text-[#121316] hover:bg-[#faf8f4] hover:shadow-xs disabled:opacity-40 transition-all cursor-pointer shadow-2xs"
        >
          {testing ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#d97706]" />
          ) : (
            <Sparkles className="h-4 w-4 text-[#d97706]" />
          )}
          <span>{testing ? 'Testing Connection...' : 'Test Connection'}</span>
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || testing || !form.email || !form.password}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#121316] text-xs font-bold text-white shadow-sm hover:bg-black disabled:opacity-40 transition-all cursor-pointer"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{saving ? 'Saving Account...' : 'Save & Connect Account'}</span>
        </button>
      </div>
    </div>
  )
}
