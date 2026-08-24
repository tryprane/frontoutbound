'use client'

import { PraneScalingActionsPageClient } from '@/components/prane/PraneScalingActionsPageClient'
import { PraneError, PraneLoading } from '@/components/prane/PraneAsyncStates'
import { useApiResource } from '@/lib/hooks'
import type { PraneScalingActionList } from '@/lib/types'

export default function PraneScalingActionsPage() {
  const { data, loading, error } = useApiResource<PraneScalingActionList>('/api/prane/scaling-actions')

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm uppercase tracking-[0.22em] text-[var(--text-muted)]">Scaling Actions</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">Guide scaling changes with approval and audit trails</h1>
      </div>
      {loading ? (
        <PraneLoading label="Loading scaling actions..." />
      ) : error || !data ? (
        <PraneError message={error} />
      ) : (
        <PraneScalingActionsPageClient initialActions={data.actions} />
      )}
    </div>
  )
}
