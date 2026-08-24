'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type CodeRecord = { id: string; codePrefix: string; createdAt: string; usedAt: string | null; usedByEmail: string | null }

export function PraneAccessCodesClient({ initialCodes }: { initialCodes: CodeRecord[] }) {
  const [codes, setCodes] = useState(initialCodes)
  const [generated, setGenerated] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function generate() {
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/prane/access-codes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quantity: 1 }) })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'Failed to generate code')
      setGenerated(body.codes || [])
      const refreshed = await fetch('/api/prane/access-codes').then((result) => result.json())
      setCodes(refreshed.map((code: any) => ({ ...code, createdAt: code.createdAt, usedAt: code.usedAt, usedByEmail: code.usedByUser?.email ?? null })))
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Failed to generate code') } finally { setBusy(false) }
  }
  return <div className="space-y-6"><div><div className="text-sm uppercase tracking-[0.22em] text-[var(--text-muted)]">Access codes</div><h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">Provision customer workspaces</h1></div><Card><CardContent className="space-y-4 p-6"><p className="text-sm text-[var(--text-secondary)]">Each code is single-use. It creates one starter organization with 30 mailboxes, 300 sends per day, and 9,000 sends per month.</p><Button onClick={generate} disabled={busy}>{busy ? 'Generating...' : 'Generate access code'}</Button>{generated.length ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 font-mono text-sm text-emerald-900">{generated.join('\n')}</div> : null}{error ? <p className="text-sm text-rose-700">{error}</p> : null}</CardContent></Card><Card><CardContent className="p-6"><div className="space-y-2">{codes.map((code) => <div key={code.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-black/8 p-3 text-sm"><span className="font-mono">{code.codePrefix}...</span><span className={code.usedAt ? 'text-[var(--text-muted)]' : 'text-emerald-700'}>{code.usedAt ? `Used by ${code.usedByEmail || 'customer'}` : 'Available'}</span></div>)}</div></CardContent></Card></div>
}
