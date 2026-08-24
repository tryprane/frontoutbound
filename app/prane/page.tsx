'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PraneError, PraneLoading } from '@/components/prane/PraneAsyncStates'
import { useApiResource } from '@/lib/hooks'
import type { PraneOverview } from '@/lib/types'

export default function PraneOverviewPage() {
  const { data, loading, error } = useApiResource<PraneOverview>('/api/prane/overview')

  if (loading && !data) return <PraneLoading label="Loading platform overview..." />
  if (error || !data) return <PraneError message={error} />

  const {
    users,
    organizations,
    suspendedOrganizations,
    unassignedUsers,
    mailAccounts,
    campaigns,
    sharedWarmupOrganizations,
    sharedWarmupMailboxes,
    openAlerts,
    workerHeartbeats,
    staleWorkers,
    proposedScalingActions,
    failedScalingActions,
    latestMetric,
    recentAuditLogs,
    serverNodes,
    degradedServers,
    hotServerMetrics,
  } = data

  const statCards = [
    { label: 'Organizations', value: organizations, detail: `${suspendedOrganizations} suspended`, href: '/prane/organizations' },
    { label: 'Users', value: users, detail: `${unassignedUsers} unassigned`, href: '/prane/users' },
    { label: 'Mail Accounts', value: mailAccounts, detail: 'Across all organizations', href: '/' },
    { label: 'Campaigns', value: campaigns, detail: `${sharedWarmupOrganizations} shared warmup orgs`, href: '/' },
    { label: 'Open Alerts', value: openAlerts, detail: `${staleWorkers} stale workers`, href: '/prane/alerts' },
    { label: 'Servers', value: serverNodes, detail: `${degradedServers} degraded · ${hotServerMetrics} hot snapshots`, href: '/prane/servers' },
    { label: 'Workers', value: workerHeartbeats, detail: `${sharedWarmupMailboxes} shared warmup mailboxes`, href: '/prane/queues' },
    { label: 'Scaling Queue', value: proposedScalingActions, detail: `${failedScalingActions} failed actions`, href: '/prane/scaling-actions' },
    { label: 'Backlog', value: latestMetric?.waitingCount ?? 0, detail: `${latestMetric?.delayedCount ?? 0} delayed`, href: '/prane/deployments' },
  ]

  return (
    <div className="animate-fade-in space-y-8">
      <section className="page-shell overflow-hidden rounded-[34px] border border-white/70 px-8 py-8 shadow-[0_28px_80px_rgba(60,45,25,0.08)]">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <Badge variant="outline" className="bg-white/70">
              /prane
            </Badge>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] md:text-5xl">
                Platform control for tenants, access, and safety.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
                This first admin phase gives you a clean super-admin surface to provision organizations, assign users,
                and verify that production data has been brought under tenant ownership.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <Link key={card.label} href={card.href}>
                <Card className="h-full rounded-[28px] border-black/8 bg-white/85 shadow-none transition hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(60,45,25,0.08)]">
                  <CardContent className="p-6">
                    <div className="text-4xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">{card.value}</div>
                    <div className="mt-2 text-sm font-medium text-[var(--text-primary)]">{card.label}</div>
                    <div className="mt-1 text-sm text-[var(--text-secondary)]">{card.detail}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card className="rounded-[32px] border-black/8 bg-white/88 shadow-none">
          <CardContent className="space-y-5 p-8">
            <div>
              <div className="text-sm uppercase tracking-[0.22em] text-[var(--text-muted)]">Tenant readiness</div>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                Phase 1 checkpoints
              </h2>
            </div>
            <div className="space-y-3 text-sm text-[var(--text-secondary)]">
              <div className="rounded-[20px] border border-black/8 bg-[#fcfbf8] px-4 py-3">
                All new business data now carries an `organizationId`.
              </div>
              <div className="rounded-[20px] border border-black/8 bg-[#fcfbf8] px-4 py-3">
                `/prane` is reserved for `SUPER_ADMIN` users only.
              </div>
              <div className="rounded-[20px] border border-black/8 bg-[#fcfbf8] px-4 py-3">
                Unassigned users are blocked from workspace access until provisioned.
              </div>
              <div className="rounded-[20px] border border-black/8 bg-[#fcfbf8] px-4 py-3">
                Shared warmup pool currently has {sharedWarmupMailboxes} opt-in mailboxes available.
              </div>
              <div className="rounded-[20px] border border-black/8 bg-[#fcfbf8] px-4 py-3">
                Platform alerts currently open: {openAlerts}. Worker heartbeats seen: {workerHeartbeats}. Registered servers: {serverNodes}.
              </div>
              <div className="rounded-[20px] border border-black/8 bg-[#fcfbf8] px-4 py-3">
                Scaling actions waiting approval: {proposedScalingActions}. Latest queue snapshot captured {latestMetric?.capturedAt ? new Date(latestMetric.capturedAt).toLocaleString() : 'not yet'}.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-black/8 bg-white/88 shadow-none">
          <CardContent className="space-y-5 p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm uppercase tracking-[0.22em] text-[var(--text-muted)]">Recent admin activity</div>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Audit trail</h2>
              </div>
              <Link href="/prane/audit-log" className="text-sm font-medium text-[var(--text-primary)] hover:underline">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {recentAuditLogs.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-black/10 px-4 py-3 text-sm text-[var(--text-muted)]">
                  No platform audit events have been recorded yet.
                </div>
              ) : (
                recentAuditLogs.map((entry) => (
                  <div key={entry.id} className="rounded-[20px] border border-black/8 bg-[#fcfbf8] px-4 py-3">
                    <div className="text-sm font-medium text-[var(--text-primary)]">{entry.action}</div>
                    <div className="mt-1 text-sm text-[var(--text-secondary)]">
                      {entry.actorUser?.email || entry.actorUser?.name || 'System'} · {entry.targetType}
                      {entry.organization?.name ? ` · ${entry.organization.name}` : ''}
                    </div>
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
