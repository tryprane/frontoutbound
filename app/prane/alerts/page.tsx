'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PraneError, PraneLoading } from '@/components/prane/PraneAsyncStates'
import { useApiResource } from '@/lib/hooks'
import type { PraneAlert } from '@/lib/types'

const severityTone: Record<string, string> = {
  INFO: 'bg-white/80',
  WARNING: 'border-[#d97706]/30 bg-[#fff4dd] text-[#9a6700]',
  CRITICAL: 'border-[#dc2626]/25 bg-[#fff1f1] text-[#a61b1b]',
}

export default function PraneAlertsPage() {
  const { data, loading, error } = useApiResource<{ alerts: PraneAlert[] }>('/api/prane/alerts')

  if (loading && !data) return <PraneLoading label="Loading platform alerts..." />
  if (error || !data) return <PraneError message={error} />

  const alerts = data.alerts ?? []

  return (
    <div className="animate-fade-in space-y-8">
      <section className="page-shell overflow-hidden rounded-[34px] border border-white/70 px-8 py-8 shadow-[0_28px_80px_rgba(60,45,25,0.08)]">
        <div className="space-y-4">
          <Badge variant="outline" className="bg-white/70">Platform Alerts</Badge>
          <h1 className="text-4xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] md:text-5xl">
            Bottlenecks and platform warnings.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
            Alerts are raised from queue pressure, stale worker heartbeats, and infrastructure pressure so you can see where scaling attention is needed first.
          </p>
        </div>
      </section>

      <section>
        <Card className="rounded-[32px] border-black/8 bg-white/88 shadow-none">
          <CardContent className="space-y-4 p-8">
            {alerts.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-black/10 px-4 py-3 text-sm text-[var(--text-muted)]">
                No platform alerts have been recorded yet.
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="rounded-[24px] border border-black/8 bg-[#fcfbf8] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="text-lg font-semibold tracking-[-0.02em] text-[var(--text-primary)]">{alert.title}</div>
                      <div className="text-sm text-[var(--text-secondary)]">{alert.message}</div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {alert.source} · opened {new Date(alert.firstOpenedAt).toLocaleString()} · updated {new Date(alert.updatedAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className={severityTone[alert.severity] ?? 'bg-white/80'}>
                        {alert.severity}
                      </Badge>
                      <Badge variant="outline" className="bg-white/80">
                        {alert.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
