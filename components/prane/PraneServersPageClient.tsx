'use client'

import { FormEvent, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type WorkloadRole = 'CAMPAIGN' | 'WARMUP' | 'SYNC' | 'BACKGROUND' | 'WHATSAPP'

type ServerRecord = {
  id: string
  label: string
  host: string | null
  sshPort: number
  sshUsername: string | null
  nodeRole: string
  status: string
  installStatus: string
  k3sNodeName: string | null
  serverFingerprint: string | null
  lastVerifiedAt: string | Date | null
  lastSeenAt: string | Date | null
  failureReason: string | null
  credential: {
    id: string
    fingerprint: string | null
    lastClaimedAt: string | Date | null
  } | null
  workloadAssignments: Array<{
    id: string
    workloadRole: WorkloadRole
    enabled: boolean
  }>
  latestRun: {
    id: string
    actionType: string
    status: string
    workflowRunUrl: string | null
    errorMessage: string | null
    createdAt: string | Date
    updatedAt: string | Date
  } | null
  latestMetric: {
    id: string
    cpuUsagePct: number | null
    memoryUsagePct: number | null
    diskUsagePct: number | null
    podCount: number
    restartCount: number
    pendingPodCount: number
    nodeReady: boolean
    capturedAt: string | Date
  } | null
}

const WORKLOADS: WorkloadRole[] = ['CAMPAIGN', 'WARMUP', 'SYNC', 'BACKGROUND', 'WHATSAPP']

function formatDate(value: string | Date | null | undefined) {
  if (!value) return 'Not yet'
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not yet' : date.toLocaleString()
}

function formatPercent(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'n/a'
  return `${value.toFixed(value >= 10 ? 0 : 1)}%`
}

export function PraneServersPageClient({ initialServers }: { initialServers: ServerRecord[] }) {
  const [servers, setServers] = useState(initialServers)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const summary = useMemo(() => {
    const totals = {
      ready: 0,
      degraded: 0,
      provisioning: 0,
      cpuHot: 0,
      memoryHot: 0,
    }
    for (const server of servers) {
      if (server.status === 'READY') totals.ready += 1
      if (server.status === 'DEGRADED' || server.status === 'FAILED') totals.degraded += 1
      if (['VERIFYING', 'INSTALLING'].includes(server.installStatus) || server.latestRun?.status === 'RUNNING') {
        totals.provisioning += 1
      }
      if ((server.latestMetric?.cpuUsagePct ?? 0) >= 75) totals.cpuHot += 1
      if ((server.latestMetric?.memoryUsagePct ?? 0) >= 80) totals.memoryHot += 1
    }
    return totals
  }, [servers])

  async function refreshServers() {
    const response = await fetch('/api/prane/servers')
    if (!response.ok) throw new Error('Failed to refresh servers')
    const body = await response.json()
    setServers(body.servers)
  }

  async function runAction(actionKey: string, url: string, options?: RequestInit) {
    setBusyKey(actionKey)
    setError(null)
    try {
      const response = await fetch(url, {
        method: 'POST',
        ...options,
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(body.error || 'Request failed')
      }
      await refreshServers()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Request failed')
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-5">
        {[
          ['Servers', servers.length],
          ['Ready', summary.ready],
          ['Degraded', summary.degraded],
          ['Provisioning', summary.provisioning],
          ['Hot nodes', summary.cpuHot + summary.memoryHot],
        ].map(([label, value]) => (
          <Card key={label} className="rounded-[28px] border-black/8 bg-white/90 shadow-none">
            <CardContent className="p-5">
              <div className="text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</div>
              <div className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">{value}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="rounded-[32px] border-black/8 bg-white/88 shadow-none">
        <CardContent className="space-y-4 p-6">
          <div>
            <div className="text-xl font-semibold text-[var(--text-primary)]">Register a server</div>
            <div className="text-sm text-[var(--text-secondary)]">The SSH key is encrypted before it lands in the database. New nodes default to campaign, warmup, sync, and background workloads.</div>
          </div>
          <form
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault()
              const formData = new FormData(event.currentTarget)
              const workloads = WORKLOADS.filter((role) => formData.get(`workload:${role}`) === 'on')
              void runAction('create-server', '/api/prane/servers', {
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  label: String(formData.get('label') || ''),
                  host: String(formData.get('host') || ''),
                  sshUsername: String(formData.get('sshUsername') || ''),
                  sshPort: Number(formData.get('sshPort') || 22),
                  passphrase: String(formData.get('passphrase') || ''),
                  privateKey: String(formData.get('privateKey') || ''),
                  workloads,
                }),
              })
            }}
            className="grid gap-4"
          >
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="server-label">Label</Label>
                <Input id="server-label" name="label" placeholder="worker-delhi-01" className="rounded-full" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="server-host">Host / IP</Label>
                <Input id="server-host" name="host" placeholder="203.0.113.14" className="rounded-full" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="server-user">SSH username</Label>
                <Input id="server-user" name="sshUsername" placeholder="ubuntu" className="rounded-full" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="server-port">SSH port</Label>
                <Input id="server-port" name="sshPort" type="number" min="1" defaultValue="22" className="rounded-full" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-[1fr_320px]">
              <div className="space-y-2">
                <Label htmlFor="server-private-key">Private key</Label>
                <textarea
                  id="server-private-key"
                  name="privateKey"
                  rows={8}
                  className="w-full rounded-[24px] border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-black/20"
                  placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="server-passphrase">Passphrase</Label>
                  <Input id="server-passphrase" name="passphrase" type="password" className="rounded-full" />
                </div>
                <div className="space-y-3">
                  <div className="text-sm font-medium text-[var(--text-primary)]">Workloads</div>
                  <div className="grid gap-2">
                    {WORKLOADS.map((role) => (
                      <label key={role} className="flex items-center gap-3 rounded-[18px] border border-black/8 bg-[#fcfbf8] px-3 py-2 text-sm text-[var(--text-secondary)]">
                        <input type="checkbox" name={`workload:${role}`} defaultChecked={role !== 'WHATSAPP'} />
                        <span>{role.toLowerCase()}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full rounded-full" disabled={busyKey === 'create-server'}>
                  {busyKey === 'create-server' ? 'Saving...' : 'Register server'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-5">
        {servers.length === 0 ? (
          <Card className="rounded-[32px] border-dashed border-black/10 bg-white/80 shadow-none">
            <CardContent className="p-8 text-sm text-[var(--text-muted)]">
              No servers registered yet.
            </CardContent>
          </Card>
        ) : (
          servers.map((server) => {
            const enabledWorkloads = server.workloadAssignments.filter((item) => item.enabled).map((item) => item.workloadRole)
            return (
              <Card key={server.id} className="rounded-[32px] border-black/8 bg-white/88 shadow-none">
                <CardContent className="space-y-5 p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-xl font-semibold text-[var(--text-primary)]">{server.label}</div>
                      <div className="mt-1 text-sm text-[var(--text-secondary)]">
                        {server.host || 'No host'} - {server.sshUsername || 'No SSH user'}:{server.sshPort}
                      </div>
                      <div className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        {server.status} - {server.installStatus} - {server.nodeRole}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" className="rounded-full" disabled={busyKey === `verify:${server.id}`} onClick={() => runAction(`verify:${server.id}`, `/api/prane/servers/${server.id}/verify-ssh`)}>
                        {busyKey === `verify:${server.id}` ? 'Verifying...' : 'Verify SSH'}
                      </Button>
                      <Button type="button" className="rounded-full" disabled={busyKey === `install:${server.id}`} onClick={() => runAction(`install:${server.id}`, `/api/prane/servers/${server.id}/install`)}>
                        {busyKey === `install:${server.id}` ? 'Installing...' : 'Install / Join'}
                      </Button>
                      <Button type="button" variant="outline" className="rounded-full" disabled={busyKey === `drain:${server.id}`} onClick={() => runAction(`drain:${server.id}`, `/api/prane/servers/${server.id}/drain`)}>
                        Drain
                      </Button>
                      <Button type="button" variant="outline" className="rounded-full" disabled={busyKey === `enable:${server.id}`} onClick={() => runAction(`enable:${server.id}`, `/api/prane/servers/${server.id}/enable`)}>
                        Enable
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="rounded-[22px] border border-black/8 bg-[#fcfbf8] p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">CPU</div>
                        <div className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{formatPercent(server.latestMetric?.cpuUsagePct)}</div>
                      </div>
                      <div className="rounded-[22px] border border-black/8 bg-[#fcfbf8] p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Memory</div>
                        <div className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{formatPercent(server.latestMetric?.memoryUsagePct)}</div>
                      </div>
                      <div className="rounded-[22px] border border-black/8 bg-[#fcfbf8] p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Disk</div>
                        <div className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{formatPercent(server.latestMetric?.diskUsagePct)}</div>
                      </div>
                      <div className="rounded-[22px] border border-black/8 bg-[#fcfbf8] p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Pods</div>
                        <div className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{server.latestMetric?.podCount ?? 0}</div>
                      </div>
                    </div>
                    <div className="rounded-[24px] border border-black/8 bg-[#fcfbf8] p-4 text-sm text-[var(--text-secondary)]">
                      <div><span className="font-medium text-[var(--text-primary)]">Node name:</span> {server.k3sNodeName || 'Pending join'}</div>
                      <div className="mt-2"><span className="font-medium text-[var(--text-primary)]">Ready:</span> {server.latestMetric?.nodeReady ? 'Yes' : 'No'}</div>
                      <div className="mt-2"><span className="font-medium text-[var(--text-primary)]">Pending pods:</span> {server.latestMetric?.pendingPodCount ?? 0}</div>
                      <div className="mt-2"><span className="font-medium text-[var(--text-primary)]">Restarts:</span> {server.latestMetric?.restartCount ?? 0}</div>
                      <div className="mt-2"><span className="font-medium text-[var(--text-primary)]">Last seen:</span> {formatDate(server.lastSeenAt)}</div>
                      <div className="mt-2"><span className="font-medium text-[var(--text-primary)]">Last verify:</span> {formatDate(server.lastVerifiedAt)}</div>
                    </div>
                  </div>

                  <form
                    onSubmit={(event: FormEvent<HTMLFormElement>) => {
                      event.preventDefault()
                      const formData = new FormData(event.currentTarget)
                      const workloads = WORKLOADS.filter((role) => formData.get(`server:${server.id}:${role}`) === 'on')
                      void runAction(`workloads:${server.id}`, `/api/prane/servers/${server.id}/workloads`, {
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ workloads }),
                      })
                    }}
                    className="rounded-[24px] border border-black/8 bg-[#fcfbf8] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-[var(--text-primary)]">Node workloads</div>
                        <div className="text-xs text-[var(--text-muted)]">
                          {enabledWorkloads.length > 0 ? enabledWorkloads.join(', ').toLowerCase() : 'No workloads enabled'}
                        </div>
                      </div>
                      <Button type="submit" variant="outline" className="rounded-full" disabled={busyKey === `workloads:${server.id}`}>
                        {busyKey === `workloads:${server.id}` ? 'Saving...' : 'Apply labels'}
                      </Button>
                    </div>
                    <div className="mt-4 grid gap-2 md:grid-cols-5">
                      {WORKLOADS.map((role) => (
                        <label key={role} className="flex items-center gap-3 rounded-[18px] border border-black/8 bg-white px-3 py-2 text-sm text-[var(--text-secondary)]">
                          <input
                            type="checkbox"
                            name={`server:${server.id}:${role}`}
                            defaultChecked={enabledWorkloads.includes(role)}
                          />
                          <span>{role.toLowerCase()}</span>
                        </label>
                      ))}
                    </div>
                  </form>

                  <div className="rounded-[24px] border border-black/8 bg-[#fcfbf8] p-4 text-sm text-[var(--text-secondary)]">
                    <div className="font-medium text-[var(--text-primary)]">Latest provisioning run</div>
                    {server.latestRun ? (
                      <div className="mt-2 space-y-2">
                        <div>{server.latestRun.actionType} - {server.latestRun.status}</div>
                        <div>Updated {formatDate(server.latestRun.updatedAt)}</div>
                        {server.latestRun.workflowRunUrl ? (
                          <a href={server.latestRun.workflowRunUrl} target="_blank" rel="noreferrer" className="text-[var(--text-primary)] underline underline-offset-4">
                            Open workflow
                          </a>
                        ) : null}
                        {server.latestRun.errorMessage ? (
                          <div className="rounded-[18px] border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
                            {server.latestRun.errorMessage}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="mt-2">No provisioning activity yet.</div>
                    )}
                    {server.failureReason ? (
                      <div className="mt-3 rounded-[18px] border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
                        {server.failureReason}
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
