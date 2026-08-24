'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PraneError, PraneLoading } from '@/components/prane/PraneAsyncStates'
import { useApiResource } from '@/lib/hooks'
import type { PraneDeployments } from '@/lib/types'

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : 'never'
}

export default function PraneDeploymentsPage() {
  const { data, loading, error } = useApiResource<PraneDeployments>('/api/prane/deployments')

  if (loading) return <PraneLoading label="Loading deployment status..." />
  if (error || !data) return <PraneError message={error} />

  const { deployments, latestMetric } = data
  const recentActions = data.recentActions.slice(0, 12)
  const liveWorkerCount = deployments.reduce((total, deployment) => total + deployment.replicas, 0)

  return (
    <div className="space-y-8">
      <section className="page-shell overflow-hidden rounded-[34px] border border-white/70 px-8 py-8 shadow-[0_28px_80px_rgba(60,45,25,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="bg-white/70">Deployments</Badge>
            <div>
              <h1 className="text-4xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] md:text-5xl">
                Current worker rollout and deployment signals.
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
                This page combines the latest heartbeat versions with recent approved scaling actions so you can confirm what is live. Use `/prane/servers` for actual machine health and node pressure.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="rounded-[24px] border-black/8 bg-white/88 shadow-none"><CardContent className="p-5"><div className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Waiting</div><div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">{latestMetric?.waitingCount ?? 0}</div></CardContent></Card>
            <Card className="rounded-[24px] border-black/8 bg-white/88 shadow-none"><CardContent className="p-5"><div className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Active</div><div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">{latestMetric?.activeCount ?? 0}</div></CardContent></Card>
            <Card className="rounded-[24px] border-black/8 bg-white/88 shadow-none"><CardContent className="p-5"><div className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Delayed</div><div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">{latestMetric?.delayedCount ?? 0}</div></CardContent></Card>
            <Card className="rounded-[24px] border-black/8 bg-white/88 shadow-none"><CardContent className="p-5"><div className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Live Workers</div><div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">{liveWorkerCount}</div></CardContent></Card>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[32px] border-black/8 bg-white/88 shadow-none">
          <CardContent className="space-y-5 p-8">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Worker deployments</h2>
              <Link href="/prane/scaling-actions" className="text-sm text-[var(--text-primary)] underline underline-offset-4">
                Open scaling actions
              </Link>
            </div>
            <div className="space-y-4">
              {deployments.map((deployment) => (
                <div key={deployment.role} className="rounded-[24px] border border-black/8 bg-[#fcfbf8] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-[var(--text-primary)]">{deployment.role}</div>
                      <div className="mt-1 text-sm text-[var(--text-secondary)]">
                        {deployment.replicas} live replica{deployment.replicas === 1 ? '' : 's'} - {deployment.staleReplicas} stale - latest version {deployment.latestVersion || 'unknown'}
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-white/70">
                      last heartbeat {formatDate(deployment.latestSeenAt)}
                    </Badge>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {deployment.instances.map((instance) => (
                      <div key={instance.id} className="rounded-[20px] border border-black/8 bg-white/85 p-4 text-sm text-[var(--text-secondary)]">
                        <div className="font-medium text-[var(--text-primary)]">{instance.hostname}</div>
                        <div className="mt-1 text-xs">Queues: {instance.runningQueues.join(', ') || 'none'}</div>
                        <div className="mt-1 text-xs">Seen: {formatDate(instance.lastSeenAt)}</div>
                        <div className="mt-1 text-xs">{instance.isStale ? 'stale heartbeat' : 'live heartbeat'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-black/8 bg-white/88 shadow-none">
          <CardContent className="space-y-5 p-8">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Recent rollout actions</h2>
            <div className="space-y-3">
              {recentActions.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-black/10 px-4 py-3 text-sm text-[var(--text-muted)]">
                  No deployment actions have been recorded yet.
                </div>
              ) : (
                recentActions.map((action) => (
                  <div key={action.id} className="rounded-[22px] border border-black/8 bg-[#fcfbf8] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-[var(--text-primary)]">{action.title}</div>
                        <div className="mt-1 text-xs text-[var(--text-secondary)]">
                          {action.actionType} - requested {formatDate(action.requestedAt)}
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-white/80">{action.status}</Badge>
                    </div>
                    <div className="mt-2 text-xs text-[var(--text-muted)]">
                      Completed: {action.completedAt ? formatDate(action.completedAt) : 'pending'}
                    </div>
                    {action.workflowRunUrl ? (
                      <div className="mt-2">
                        <a href={action.workflowRunUrl} target="_blank" rel="noreferrer" className="text-xs text-[var(--text-primary)] underline underline-offset-4">
                          Open workflow
                        </a>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
