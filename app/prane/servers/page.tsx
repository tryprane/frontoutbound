'use client'

import { Badge } from '@/components/ui/badge'
import { PraneServersPageClient } from '@/components/prane/PraneServersPageClient'
import { PraneError, PraneLoading } from '@/components/prane/PraneAsyncStates'
import { useApiResource } from '@/lib/hooks'
import type { PraneServerList } from '@/lib/types'

export default function PraneServersPage() {
  const { data, loading, error } = useApiResource<PraneServerList>('/api/prane/servers')

  return (
    <div className="animate-fade-in space-y-8">
      <section className="page-shell overflow-hidden rounded-[34px] border border-white/70 px-8 py-8 shadow-[0_28px_80px_rgba(60,45,25,0.08)]">
        <div className="space-y-5">
          <Badge variant="outline" className="bg-white/70">
            Server fleet
          </Badge>
          <div className="space-y-4">
            <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] md:text-5xl">
              Register nodes, watch pressure, and expand the cluster from one control plane.
            </h1>
            <p className="max-w-3xl text-base leading-7 text-[var(--text-secondary)]">
              Every server here is tracked with encrypted SSH credentials, provisioning runs, workload labels, and the latest
              cluster metrics collected by the background control-plane worker.
            </p>
          </div>
        </div>
      </section>

      {loading ? (
        <PraneLoading label="Loading server fleet..." />
      ) : error || !data ? (
        <PraneError message={error} />
      ) : (
        <PraneServersPageClient initialServers={data.servers} />
      )}
    </div>
  )
}
