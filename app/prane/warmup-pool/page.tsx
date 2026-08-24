'use client'

import { Card, CardContent } from '@/components/ui/card'
import { PraneError, PraneLoading } from '@/components/prane/PraneAsyncStates'
import { useApiResource } from '@/lib/hooks'
import type { PraneWarmupPool } from '@/lib/types'

export default function PraneWarmupPoolPage() {
  const { data, loading, error } = useApiResource<PraneWarmupPool>('/api/prane/warmup-pool')

  if (loading) return <PraneLoading label="Loading warmup pool..." />
  if (error || !data) return <PraneError message={error} />

  const rows = data.organizations
  const totals = {
    shared: data.totals.sharedPoolMailboxes,
    eligible: data.totals.eligibleMailboxes,
    gmail: data.totals.gmailEligible,
    zoho: data.totals.zohoEligible,
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm uppercase tracking-[0.22em] text-[var(--text-muted)]">Warmup pool</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">Shared pool readiness</h1>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ['Shared pool mailboxes', totals.shared],
          ['Eligible mailboxes', totals.eligible],
          ['Eligible Gmail', totals.gmail],
          ['Eligible Zoho', totals.zoho],
        ].map(([label, value]) => (
          <Card key={String(label)} className="rounded-[28px] border-black/8 bg-white/88 shadow-none">
            <CardContent className="p-6">
              <div className="text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">{value}</div>
              <div className="mt-2 text-sm text-[var(--text-secondary)]">{label}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="rounded-[32px] border-black/8 bg-white/88 shadow-none">
        <CardContent className="space-y-4 p-6">
          {rows.map((row) => (
            <div key={row.id} className="rounded-[22px] border border-black/8 bg-[#fcfbf8] px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-base font-semibold text-[var(--text-primary)]">{row.name}</div>
                  <div className="mt-1 text-sm text-[var(--text-secondary)]">
                    {row.status} · {row.warmupPoolMode}
                  </div>
                </div>
                <div className="grid gap-1 text-right text-sm text-[var(--text-secondary)]">
                  <div>{row.totalMailboxes} total mailboxes</div>
                  <div>{row.eligibleMailboxes} eligible</div>
                  <div>{row.pausedMailboxes} paused</div>
                  <div>{row.unhealthyMailboxes} unhealthy</div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
