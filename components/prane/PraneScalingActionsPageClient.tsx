'use client'

import { type FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ActionRecord = {
  id: string
  actionType: string
  status: string
  title: string
  description: string | null
  executionMode: string
  workflowName: string | null
  workflowRunId: string | null
  workflowRunUrl: string | null
  executionOutput: string | null
  errorMessage: string | null
  payload: unknown
  requestedAt: string | Date
  approvedAt: string | Date | null
  startedAt: string | Date | null
  completedAt: string | Date | null
  createdAt: string | Date
  updatedAt: string | Date
  organization: { id: string; name: string; slug: string } | null
  requestedByUser: { id: string; name: string | null; email: string | null } | null
  approvedByUser: { id: string; name: string | null; email: string | null } | null
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) return 'Not yet'
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not yet' : date.toLocaleString()
}

export function PraneScalingActionsPageClient({ initialActions }: { initialActions: ActionRecord[] }) {
  const [actions, setActions] = useState(initialActions)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function refreshActions() {
    const response = await fetch('/api/prane/scaling-actions?limit=50')
    if (!response.ok) {
      throw new Error('Failed to refresh scaling actions')
    }
    const body = await response.json()
    setActions(body.actions)
  }

  async function createAction(payload: Record<string, unknown>, key: string) {
    setBusyKey(key)
    setError(null)
    try {
      const response = await fetch('/api/prane/scaling-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(body.error || 'Failed to create action')
      }
      await refreshActions()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to create action')
    } finally {
      setBusyKey(null)
    }
  }

  async function approveAction(id: string) {
    setBusyKey(`approve:${id}`)
    setError(null)
    try {
      const response = await fetch(`/api/prane/scaling-actions/${id}/approve`, {
        method: 'POST',
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(body.error || 'Failed to approve action')
      }
      await refreshActions()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to approve action')
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-[32px] border-black/8 bg-white/88 shadow-none">
          <CardContent className="space-y-4 p-6">
            <div>
              <div className="text-xl font-semibold text-[var(--text-primary)]">Scale worker replicas</div>
              <div className="text-sm text-[var(--text-secondary)]">Queue-aware scale change through the GitHub deploy workflow.</div>
            </div>
            <form
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault()
                const formData = new FormData(event.currentTarget)
                void createAction(
                  {
                    actionType: 'SCALE_WORKERS',
                    deployRef: String(formData.get('deployRef') || 'main'),
                    replicas: {
                      campaign: Number(formData.get('campaign') || 1),
                      warmup: Number(formData.get('warmup') || 1),
                      sync: Number(formData.get('sync') || 1),
                      background: Number(formData.get('background') || 1),
                      whatsapp: Number(formData.get('whatsapp') || 1),
                    },
                  },
                  'scale-workers'
                )
              }}
              className="grid gap-3 md:grid-cols-3"
            >
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="scale-deploy-ref">Deploy ref</Label>
                <Input id="scale-deploy-ref" name="deployRef" defaultValue="main" className="rounded-full" />
              </div>
              {['campaign', 'warmup', 'sync', 'background', 'whatsapp'].map((role) => (
                <div key={role} className="space-y-2">
                  <Label htmlFor={`replica-${role}`}>{role} replicas</Label>
                  <Input id={`replica-${role}`} name={role} type="number" min="0" defaultValue="1" className="rounded-full" />
                </div>
              ))}
              <div className="md:col-span-3">
                <Button type="submit" className="w-full rounded-full" disabled={busyKey === 'scale-workers'}>
                  {busyKey === 'scale-workers' ? 'Creating...' : 'Create scale action'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-black/8 bg-white/88 shadow-none">
          <CardContent className="space-y-4 p-6">
            <div>
              <div className="text-xl font-semibold text-[var(--text-primary)]">Update worker concurrency</div>
              <div className="text-sm text-[var(--text-secondary)]">Send a deploy workflow with explicit concurrency overrides.</div>
            </div>
            <form
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault()
                const formData = new FormData(event.currentTarget)
                void createAction(
                  {
                    actionType: 'UPDATE_WORKER_CONCURRENCY',
                    deployRef: String(formData.get('deployRef') || 'main'),
                    concurrency: {
                      campaign: Number(formData.get('campaignConcurrency') || 0),
                      mail: Number(formData.get('mailConcurrency') || 0),
                      whatsapp: Number(formData.get('whatsappConcurrency') || 0),
                      warmup: Number(formData.get('warmupConcurrency') || 0),
                      whatsappSession: Number(formData.get('whatsappSessionConcurrency') || 0),
                    },
                  },
                  'update-concurrency'
                )
              }}
              className="grid gap-3 md:grid-cols-2"
            >
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="concurrency-deploy-ref">Deploy ref</Label>
                <Input id="concurrency-deploy-ref" name="deployRef" defaultValue="main" className="rounded-full" />
              </div>
              {[
                ['campaignConcurrency', 'campaign'],
                ['mailConcurrency', 'mail'],
                ['whatsappConcurrency', 'whatsapp'],
                ['warmupConcurrency', 'warmup'],
                ['whatsappSessionConcurrency', 'whatsapp session'],
              ].map(([name, label]) => (
                <div key={name} className="space-y-2">
                  <Label htmlFor={name}>{label} concurrency</Label>
                  <Input id={name} name={name} type="number" min="0" defaultValue="0" className="rounded-full" />
                </div>
              ))}
              <div className="md:col-span-2">
                <Button type="submit" className="w-full rounded-full" disabled={busyKey === 'update-concurrency'}>
                  {busyKey === 'update-concurrency' ? 'Creating...' : 'Create concurrency action'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-[32px] border-black/8 bg-white/88 shadow-none">
          <CardContent className="space-y-4 p-6">
            <div className="text-xl font-semibold text-[var(--text-primary)]">Platform toggles</div>
            <div className="text-sm text-[var(--text-secondary)]">Use DB-backed actions for app-level controls that should not require a redeploy.</div>
            <div className="grid gap-3 md:grid-cols-2">
              <Button onClick={() => createAction({ actionType: 'TOGGLE_WARMUP_PLANNER', enabled: true }, 'planner-on')} disabled={busyKey === 'planner-on'} className="rounded-full">
                Enable planner
              </Button>
              <Button onClick={() => createAction({ actionType: 'TOGGLE_WARMUP_PLANNER', enabled: false }, 'planner-off')} disabled={busyKey === 'planner-off'} variant="outline" className="rounded-full">
                Disable planner
              </Button>
              <Button onClick={() => createAction({ actionType: 'TOGGLE_HEALTH_ACTIONS', enabled: true }, 'health-on')} disabled={busyKey === 'health-on'} className="rounded-full">
                Enable health actions
              </Button>
              <Button onClick={() => createAction({ actionType: 'TOGGLE_HEALTH_ACTIONS', enabled: false }, 'health-off')} disabled={busyKey === 'health-off'} variant="outline" className="rounded-full">
                Disable health actions
              </Button>
              <Button onClick={() => createAction({ actionType: 'RUN_RETENTION_CLEANUP' }, 'retention')} disabled={busyKey === 'retention'} className="rounded-full md:col-span-2">
                Run retention cleanup
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-black/8 bg-white/88 shadow-none">
          <CardContent className="space-y-4 p-6">
            <div className="text-xl font-semibold text-[var(--text-primary)]">Restart or expand</div>
            <div className="text-sm text-[var(--text-secondary)]">Restart a worker role with the current rollout flow or generate the next-node runbook.</div>
            <form
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault()
                const formData = new FormData(event.currentTarget)
                void createAction(
                  {
                    actionType: 'RESTART_WORKER_ROLE',
                    role: String(formData.get('restartRole') || 'background'),
                    deployRef: String(formData.get('restartDeployRef') || 'main'),
                  },
                  'restart-worker'
                )
              }}
              className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
            >
              <div className="space-y-2">
                <Label htmlFor="restartRole">Worker role</Label>
                <select id="restartRole" name="restartRole" className="h-10 rounded-full border border-black/10 bg-white px-3 text-sm">
                  <option value="campaign">campaign</option>
                  <option value="warmup">warmup</option>
                  <option value="sync">sync</option>
                  <option value="background">background</option>
                  <option value="whatsapp">whatsapp</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="restartDeployRef">Deploy ref</Label>
                <Input id="restartDeployRef" name="restartDeployRef" defaultValue="main" className="rounded-full" />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full rounded-full" disabled={busyKey === 'restart-worker'}>
                  Restart
                </Button>
              </div>
            </form>
            <form
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault()
                const formData = new FormData(event.currentTarget)
                void createAction(
                  {
                    actionType: 'SHOW_K3S_JOIN_RUNBOOK',
                    nodeName: String(formData.get('nodeName') || ''),
                  },
                  'k3s-runbook'
                )
              }}
              className="grid gap-3 md:grid-cols-[1fr_auto]"
            >
              <div className="space-y-2">
                <Label htmlFor="nodeName">New node name</Label>
                <Input id="nodeName" name="nodeName" placeholder="worker-06" className="rounded-full" />
              </div>
              <div className="flex items-end">
                <Button type="submit" variant="outline" className="w-full rounded-full" disabled={busyKey === 'k3s-runbook'}>
                  Show runbook
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[32px] border-black/8 bg-white/88 shadow-none">
        <CardContent className="space-y-5 p-6">
          <div>
            <div className="text-xl font-semibold text-[var(--text-primary)]">Recent actions</div>
            <div className="text-sm text-[var(--text-secondary)]">Every scaling change stays auditable and must be approved before execution.</div>
          </div>
          <div className="space-y-4">
            {actions.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-black/10 px-4 py-3 text-sm text-[var(--text-muted)]">
                No scaling actions yet.
              </div>
            ) : (
              actions.map((action) => (
                <div key={action.id} className="rounded-[24px] border border-black/8 bg-[#fcfbf8] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-base font-semibold text-[var(--text-primary)]">{action.title}</div>
                      <div className="mt-1 text-sm text-[var(--text-secondary)]">{action.description || action.actionType}</div>
                      <div className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        {action.status} · {action.executionMode} · requested {formatDate(action.requestedAt)}
                      </div>
                    </div>
                    {action.status === 'PROPOSED' ? (
                      <Button
                        type="button"
                        className="rounded-full"
                        disabled={busyKey === `approve:${action.id}`}
                        onClick={() => approveAction(action.id)}
                      >
                        {busyKey === `approve:${action.id}` ? 'Approving...' : 'Approve'}
                      </Button>
                    ) : null}
                  </div>
                  <div className="mt-4 grid gap-3 text-sm text-[var(--text-secondary)] md:grid-cols-2">
                    <div>Requested by: {action.requestedByUser?.name || action.requestedByUser?.email || 'Unknown'}</div>
                    <div>Approved by: {action.approvedByUser?.name || action.approvedByUser?.email || 'Pending'}</div>
                    <div>Started: {formatDate(action.startedAt)}</div>
                    <div>Completed: {formatDate(action.completedAt)}</div>
                  </div>
                  {action.workflowRunUrl ? (
                    <div className="mt-3 text-sm">
                      <a href={action.workflowRunUrl} target="_blank" rel="noreferrer" className="text-[var(--text-primary)] underline underline-offset-4">
                        Open workflow
                      </a>
                    </div>
                  ) : null}
                  {action.executionOutput ? (
                    <pre className="mt-4 overflow-x-auto rounded-[20px] border border-black/8 bg-white/90 p-4 text-xs text-[var(--text-secondary)] whitespace-pre-wrap">
                      {action.executionOutput}
                    </pre>
                  ) : null}
                  {action.errorMessage ? (
                    <div className="mt-4 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {action.errorMessage}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
