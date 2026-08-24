'use client'

import { Activity, Clock3, Cpu, ServerCrash } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PraneError, PraneLoading } from '@/components/prane/PraneAsyncStates'
import { useApiResource } from '@/lib/hooks'

type QueueMetric = {
  queueName: string | null
  waitingCount: number
  activeCount: number
  delayedCount: number
  failedCount: number
  workerCount: number
  oldestWaitingAgeMs: number | null
  capturedAt: string
}

type WorkerRecord = {
  id: string
  role: string
  hostname: string
  processId: number
  runningQueues: string[]
  lastSeenAt: string
  isStale: boolean
}

type QueuesPayload = {
  workers: WorkerRecord[]
  queues: QueueMetric[]
  summary: {
    waitingCount: number
    activeCount: number
    delayedCount: number
    failedCount: number
    workerCount: number
    staleWorkerCount: number
    capturedAt: string
  } | null
}

function formatAge(ms: number | null) {
  if (!ms || ms <= 0) return 'fresh'
  const minutes = Math.floor(ms / 60000)
  if (minutes < 1) return '<1 min'
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

export default function PraneQueuesPage() {
  const { data, loading, error } = useApiResource<QueuesPayload>('/api/prane/queues')

  if (loading && !data) return <PraneLoading label="Loading queue health..." />
  if (error || !data) return <PraneError message={error} />

  // The backend already flags staleness, dedupes to the latest snapshot per
  // queue, and computes the supervisor summary.
  const workers = data.workers ?? []
  const summary = data.summary
  const liveWorkers = workers.filter((worker) => !worker.isStale)
  const staleWorkers = workers.filter((worker) => worker.isStale)
  const queueCards = [...(data.queues ?? [])].sort((a, b) => {
    const aScore = (a.waitingCount ?? 0) + (a.delayedCount ?? 0)
    const bScore = (b.waitingCount ?? 0) + (b.delayedCount ?? 0)
    return bScore - aScore
  })

  return (
    <div className="animate-fade-in space-y-8">
      <section className="page-shell overflow-hidden rounded-[34px] border border-white/70 px-8 py-8 shadow-[0_28px_80px_rgba(60,45,25,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="bg-white/70">Queue Health</Badge>
            <div>
              <h1 className="text-4xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] md:text-5xl">
                Worker heartbeat and queue pressure.
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
                This view shows the latest supervisor snapshot, per-queue backlog pressure, and whether any worker has gone stale.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="rounded-[24px] border-black/8 bg-white/88 shadow-none"><CardContent className="p-5"><div className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Waiting</div><div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">{summary?.waitingCount ?? 0}</div></CardContent></Card>
            <Card className="rounded-[24px] border-black/8 bg-white/88 shadow-none"><CardContent className="p-5"><div className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Active</div><div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">{summary?.activeCount ?? 0}</div></CardContent></Card>
            <Card className="rounded-[24px] border-black/8 bg-white/88 shadow-none"><CardContent className="p-5"><div className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Delayed</div><div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">{summary?.delayedCount ?? 0}</div></CardContent></Card>
            <Card className="rounded-[24px] border-black/8 bg-white/88 shadow-none"><CardContent className="p-5"><div className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Live Workers</div><div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">{liveWorkers.length}</div></CardContent></Card>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-[32px] border-black/8 bg-white/88 shadow-none">
          <CardContent className="space-y-5 p-8">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-[var(--text-primary)]" />
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Queue backlog</h2>
            </div>
            <div className="space-y-4">
              {queueCards.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-black/10 px-4 py-3 text-sm text-[var(--text-muted)]">
                  No queue snapshots have been captured yet. Let the worker supervisor run for a minute and refresh.
                </div>
              ) : (
                queueCards.map((snapshot) => (
                  <div key={snapshot.queueName} className="rounded-[24px] border border-black/8 bg-[#fcfbf8] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold tracking-[-0.02em] text-[var(--text-primary)]">{snapshot.queueName}</div>
                        <div className="mt-1 text-sm text-[var(--text-secondary)]">
                          Captured {new Date(snapshot.capturedAt).toLocaleString()}
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-white/70">
                        oldest queued {formatAge(snapshot.oldestWaitingAgeMs ?? null)}
                      </Badge>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-4">
                      <div><div className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Waiting</div><div className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{snapshot.waitingCount ?? 0}</div></div>
                      <div><div className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Active</div><div className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{snapshot.activeCount ?? 0}</div></div>
                      <div><div className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Delayed</div><div className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{snapshot.delayedCount ?? 0}</div></div>
                      <div><div className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Failed</div><div className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{snapshot.failedCount ?? 0}</div></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-black/8 bg-white/88 shadow-none">
          <CardContent className="space-y-5 p-8">
            <div className="flex items-center gap-3">
              <Cpu className="h-5 w-5 text-[var(--text-primary)]" />
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Worker heartbeats</h2>
            </div>
            <div className="space-y-3">
              {workers.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-black/10 px-4 py-3 text-sm text-[var(--text-muted)]">
                  No worker heartbeat has been recorded yet.
                </div>
              ) : (
                [...liveWorkers, ...staleWorkers].map((worker) => {
                  const isStale = worker.isStale
                  return (
                    <div key={worker.id} className="rounded-[22px] border border-black/8 bg-[#fcfbf8] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-[var(--text-primary)]">{worker.role}</div>
                          <div className="mt-1 text-xs text-[var(--text-secondary)]">{worker.hostname} - PID {worker.processId}</div>
                          <div className="mt-2 text-xs text-[var(--text-muted)]">
                            Running {worker.runningQueues.join(', ') || 'no queues'}
                          </div>
                        </div>
                        <Badge variant="outline" className={isStale ? 'border-[#d97706]/30 bg-[#fff4dd] text-[#9a6700]' : 'bg-white/80'}>
                          {isStale ? 'stale' : 'healthy'}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                        {isStale ? <ServerCrash className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
                        Last seen {new Date(worker.lastSeenAt).toLocaleString()}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
