'use client'

import { Card, CardContent } from '@/components/ui/card'
import { PraneError, PraneLoading } from '@/components/prane/PraneAsyncStates'
import { useApiResource } from '@/lib/hooks'
import type { PraneAuditLogEntry } from '@/lib/types'

export default function PraneAuditLogPage() {
  const { data, loading, error } = useApiResource<PraneAuditLogEntry[]>('/api/prane/audit-log')

  if (loading && !data) return <PraneLoading label="Loading audit trail..." />
  if (error || !data) return <PraneError message={error} />

  const logs = data

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm uppercase tracking-[0.22em] text-[var(--text-muted)]">Audit trail</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">Platform admin history</h1>
      </div>

      <Card className="rounded-[32px] border-black/8 bg-white/88 shadow-none">
        <CardContent className="space-y-4 p-6">
          {logs.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-black/10 px-4 py-3 text-sm text-[var(--text-muted)]">
              No platform events recorded yet.
            </div>
          ) : (
            logs.map((entry) => (
              <div key={entry.id} className="rounded-[20px] border border-black/8 bg-[#fcfbf8] px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[var(--text-primary)]">{entry.action}</div>
                    <div className="mt-1 text-sm text-[var(--text-secondary)]">
                      {entry.actorUser?.email || entry.actorUser?.name || 'System'} · {entry.targetType}
                      {entry.targetId ? ` · ${entry.targetId}` : ''}
                      {entry.organization?.name ? ` · ${entry.organization.name}` : ''}
                    </div>
                  </div>
                  <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    {new Date(entry.createdAt).toLocaleString()}
                  </div>
                </div>
                {entry.metadata ? (
                  <pre className="mt-3 overflow-x-auto rounded-[18px] bg-white px-3 py-3 text-xs text-[var(--text-secondary)]">
                    {JSON.stringify(entry.metadata, null, 2)}
                  </pre>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
