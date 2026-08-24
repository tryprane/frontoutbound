'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { PraneError, PraneLoading } from '@/components/prane/PraneAsyncStates'
import { useApiResource } from '@/lib/hooks'
import { api } from '@/lib/api'
import type { PraneMailProxy } from '@/lib/types'

function StatCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <Card className="rounded-[28px] border-black/8 bg-white/88 shadow-none">
      <CardContent className="p-6">
        <div className="text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">{value}</div>
        <div className="mt-2 text-sm text-[var(--text-secondary)]">{label}</div>
        <div className="mt-1 text-xs text-[var(--text-muted)]">{detail}</div>
      </CardContent>
    </Card>
  )
}

function renderSecret(value: string | null | undefined) {
  return value || 'Unavailable'
}

export default function PraneMailProxyPage() {
  const { data, loading, error, reload } = useApiResource<PraneMailProxy>('/api/prane/mail-proxy')
  const [rotating, setRotating] = useState(false)
  const [rotateError, setRotateError] = useState<string | null>(null)

  async function rotateAll() {
    setRotating(true)
    setRotateError(null)
    try {
      const form = new FormData()
      form.set('action', 'rotate-all')
      await api.post('/api/prane/mail-proxy', form)
      reload()
    } catch (caught) {
      setRotateError(caught instanceof Error ? caught.message : 'Rotation failed')
    } finally {
      setRotating(false)
    }
  }

  if (loading) return <PraneLoading label="Loading mail proxy bundle..." />
  if (error || !data) return <PraneError message={error} />

  const { rows, config } = data
  const smtpReady = data.stats.smtpReady
  const inboxReady = data.stats.inboxReady
  const fullyReady = data.stats.fullyReady
  const sharedPool = data.stats.sharedPool

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-sm uppercase tracking-[0.22em] text-[var(--text-muted)]">Mail proxy</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">Instantly connection bundle</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
            Use this page to bulk-export mailbox connection details for warmup. SMTP terminates on your proxy host.
            IMAP uses the proxy whenever the mail proxy IMAP environment is enabled. Accounts only get proxy passwords
            when they already have direct SMTP and direct IMAP credentials stored in Prane.
          </p>
          {!config.imapProxyHost ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-700">
              IMAP proxy is currently disabled in runtime config, so inbox connections will still show upstream provider
              details until `MAIL_PROXY_IMAP_ENABLED` and related env vars are deployed.
            </p>
          ) : null}
          {rotateError ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#a61b1b]">{rotateError}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <a href="/api/prane/mail-proxy/export" className="btn-primary">
            Download CSV
          </a>
          <button type="button" onClick={rotateAll} disabled={rotating} className="btn-ghost">
            {rotating ? 'Rotating...' : 'Rotate passwords'}
          </button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Mailboxes" value={rows.length} detail={`${sharedPool} shared-pool accounts`} />
        <StatCard label="SMTP ready" value={smtpReady} detail={`${rows.length - smtpReady} still blocked`} />
        <StatCard label="Inbox ready" value={inboxReady} detail={`${rows.length - inboxReady} need IMAP support`} />
        <StatCard label="Fully ready" value={fullyReady} detail="Can be imported into Instantly now" />
      </section>

      <Card className="rounded-[32px] border-black/8 bg-white/88 shadow-none">
        <CardContent className="space-y-3 p-6">
          <div className="grid gap-2 text-sm text-[var(--text-secondary)] md:grid-cols-3">
            <div>
              <div className="font-medium text-[var(--text-primary)]">SMTP host</div>
              <div>{config.smtpHost}:{config.smtpPort}</div>
            </div>
            <div>
              <div className="font-medium text-[var(--text-primary)]">SMTP security</div>
              <div>{config.smtpSecurity}</div>
            </div>
            <div>
              <div className="font-medium text-[var(--text-primary)]">IMAP mode</div>
              <div>{config.imapProxyHost ? `Proxy via ${config.imapProxyHost}:${config.imapProxyPort}` : 'Direct provider passthrough'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[32px] border-black/8 bg-white/88 shadow-none">
        <CardContent className="overflow-x-auto p-0">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f7f2e8] text-[var(--text-secondary)]">
              <tr>
                {['Mailbox', 'Org', 'Provider', 'Status', 'SMTP', 'IMAP', 'Notes'].map((label) => (
                  <th key={label} className="px-4 py-3 font-medium">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-black/8 align-top">
                  <td className="px-4 py-4">
                    <div className="font-medium text-[var(--text-primary)]">{row.email}</div>
                    <div className="text-xs text-[var(--text-muted)]">{row.displayName}</div>
                  </td>
                  <td className="px-4 py-4 text-[var(--text-secondary)]">{row.organizationName}</td>
                  <td className="px-4 py-4 text-[var(--text-secondary)]">{row.provider}</td>
                  <td className="px-4 py-4 text-xs text-[var(--text-secondary)]">
                    <div>Warmup: {row.warmupStatus}</div>
                    <div>Health: {row.mailboxHealthStatus}</div>
                    <div>Sync: {row.mailboxSyncStatus}</div>
                  </td>
                  <td className="px-4 py-4 font-mono text-xs text-[var(--text-primary)]">
                    <div>{row.smtpHost}:{row.smtpPort}</div>
                    <div>{row.proxyUsername}</div>
                    <div>{renderSecret(row.proxyPassword)}</div>
                  </td>
                  <td className="px-4 py-4 text-xs text-[var(--text-secondary)]">
                    <div className="font-medium text-[var(--text-primary)]">{row.imapMode}</div>
                    <div>{row.imapHost ? `${row.imapHost}:${row.imapPort}` : 'Unavailable'}</div>
                    <div className="font-mono text-[var(--text-primary)]">{row.imapUsername || 'No username'}</div>
                    <div className="font-mono text-[var(--text-primary)]">{renderSecret(row.imapPassword)}</div>
                  </td>
                  <td className="px-4 py-4 text-xs text-[var(--text-secondary)]">
                    <div>{row.notes}</div>
                    {row.missingPrerequisites.length ? (
                      <div className="mt-2 text-[var(--text-muted)]">
                        Missing: {row.missingPrerequisites.join(', ')}
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
