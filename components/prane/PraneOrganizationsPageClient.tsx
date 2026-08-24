'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

type OrganizationSummary = {
  id: string
  name: string
  slug: string
  loginHostname: string | null
  status: 'ACTIVE' | 'SUSPENDED'
  plan: string
  warmupPoolMode: 'PRIVATE' | 'SHARED_OPT_IN'
  maxMailAccounts: number
  maxCampaigns: number
  maxCsvUploads: number
  maxWhatsAppAccounts: number
  dailyCampaignSendCap: number | null
  dailyApiSendCap: number | null
  gdriveDailySendCap: number
  gdriveAccountDailyLimit: number
  campaignPlannerEnabled: boolean
  mailProxyVisibleToOrg: boolean
  trulyInboxVisibleToOrg: boolean
  mailProxyHost: string | null
  membersCount: number
  mailAccountsCount: number
  campaignsCount: number
  csvFilesCount: number
  whatsAppAccountsCount: number
}

export function PraneOrganizationsPageClient({
  organizations,
}: {
  organizations: OrganizationSummary[]
}) {
  const [busyOrganizationId, setBusyOrganizationId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function createOrganization(formData: FormData) {
    setBusyOrganizationId('create')
    setError(null)

    try {
      const payload = {
        name: String(formData.get('name') || ''),
        slug: String(formData.get('slug') || ''),
        plan: String(formData.get('plan') || 'internal'),
        loginHostname: String(formData.get('loginHostname') || ''),
      }
      const response = await fetch('/api/prane/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to create organization')
      }
      window.location.reload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to create organization')
    } finally {
      setBusyOrganizationId(null)
    }
  }

  async function updateOrganization(organizationId: string, payload: Record<string, unknown>) {
    setBusyOrganizationId(organizationId)
    setError(null)

    try {
      const response = await fetch(`/api/prane/organizations/${organizationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to update organization')
      }
      window.location.reload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to update organization')
    } finally {
      setBusyOrganizationId(null)
    }
  }

  async function saveLimits(organizationId: string, formData: FormData) {
    const payload = {
      plan: String(formData.get('plan') || 'internal'),
      loginHostname: String(formData.get('loginHostname') || ''),
      maxMailAccounts: Number(formData.get('maxMailAccounts') || 0),
      maxCampaigns: Number(formData.get('maxCampaigns') || 0),
      maxCsvUploads: Number(formData.get('maxCsvUploads') || 0),
      maxWhatsAppAccounts: Number(formData.get('maxWhatsAppAccounts') || 0),
      dailyCampaignSendCap: formData.get('dailyCampaignSendCap')
        ? Number(formData.get('dailyCampaignSendCap'))
        : null,
      dailyApiSendCap: formData.get('dailyApiSendCap') ? Number(formData.get('dailyApiSendCap')) : null,
      gdriveDailySendCap: Number(formData.get('gdriveDailySendCap') || 500),
      gdriveAccountDailyLimit: Number(formData.get('gdriveAccountDailyLimit') || 50),
      mailProxyVisibleToOrg: formData.get('mailProxyVisibleToOrg') === 'true',
      trulyInboxVisibleToOrg: formData.get('trulyInboxVisibleToOrg') === 'true',
      mailProxyHost: String(formData.get('mailProxyHost') || '').trim() || null,
    }
    await updateOrganization(organizationId, payload)
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <Card className="rounded-[32px] border-black/8 bg-white/88 shadow-none">
        <CardContent className="space-y-4 p-6">
          <div>
            <div className="text-xl font-semibold text-[var(--text-primary)]">Create organization</div>
            <div className="text-sm text-[var(--text-secondary)]">
              Provision a new tenant and optionally assign a client-specific login hostname.
            </div>
          </div>
          <form action={createOrganization} className="grid gap-3 md:grid-cols-[1.1fr_0.9fr_0.9fr_1.2fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="org-name">Name</Label>
              <Input id="org-name" name="name" placeholder="Acme Workspace" className="rounded-full" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-slug">Slug</Label>
              <Input id="org-slug" name="slug" placeholder="acme-workspace" className="rounded-full" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-plan">Plan</Label>
              <Input id="org-plan" name="plan" defaultValue="internal" className="rounded-full" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-login-hostname">Login hostname</Label>
              <Input
                id="org-login-hostname"
                name="loginHostname"
                placeholder="app.client.com"
                className="rounded-full"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full rounded-full" disabled={busyOrganizationId === 'create'}>
                {busyOrganizationId === 'create' ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {organizations.map((organization) => (
        <Card key={organization.id} className="rounded-[28px] border-black/8 bg-white/88 shadow-none">
          <CardContent className="space-y-5 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-[var(--text-primary)]">{organization.name}</div>
                <div className="text-sm text-[var(--text-secondary)]">/{organization.slug} · {organization.plan}</div>
                <div className="mt-1 text-sm text-[var(--text-secondary)]">
                  {organization.loginHostname || 'No client hostname assigned'}
                </div>
                <div className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {organization.status} · {organization.membersCount} members
                </div>
              </div>
              <div className="grid gap-2 text-right text-sm text-[var(--text-secondary)]">
                <div>{organization.mailAccountsCount}/{organization.maxMailAccounts || '∞'} mail accounts</div>
                <div>{organization.campaignsCount}/{organization.maxCampaigns || '∞'} campaigns</div>
                <div>{organization.csvFilesCount}/{organization.maxCsvUploads || '∞'} CSV uploads</div>
                <div>{organization.whatsAppAccountsCount}/{organization.maxWhatsAppAccounts || '∞'} WhatsApp accounts</div>
              </div>
            </div>

            <div className="grid gap-3 rounded-[24px] border border-black/8 bg-[#fcfbf8] p-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  className="h-10 rounded-full border border-black/10 bg-white px-3 text-sm"
                  value={organization.status}
                  disabled={busyOrganizationId === organization.id}
                  onChange={(event) => updateOrganization(organization.id, { status: event.target.value })}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Warmup pool</Label>
                <select
                  className="h-10 rounded-full border border-black/10 bg-white px-3 text-sm"
                  value={organization.warmupPoolMode}
                  disabled={busyOrganizationId === organization.id}
                  onChange={(event) => updateOrganization(organization.id, { warmupPoolMode: event.target.value })}
                >
                  <option value="PRIVATE">PRIVATE</option>
                  <option value="SHARED_OPT_IN">SHARED_OPT_IN</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Daily campaign cap</Label>
                <Input value={organization.dailyCampaignSendCap ?? ''} placeholder="Optional" className="rounded-full" disabled />
              </div>
              <div className="space-y-2">
                <Label>Daily API cap</Label>
                <Input value={organization.dailyApiSendCap ?? ''} placeholder="Optional" className="rounded-full" disabled />
              </div>
              <div className="space-y-2">
                <Label>GDrive daily cap</Label>
                <Input value={organization.gdriveDailySendCap} className="rounded-full" disabled />
              </div>
              <div className="space-y-2">
                <Label>GDrive per-account cap</Label>
                <Input value={organization.gdriveAccountDailyLimit} className="rounded-full" disabled />
              </div>
              <div className="space-y-2">
                <Label>Campaign planner</Label>
                <div className="flex h-10 items-center rounded-full border border-black/10 bg-white px-3">
                  <div className="flex w-full items-center justify-between gap-3">
                    <span className="text-sm text-[var(--text-secondary)]">
                      {organization.campaignPlannerEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <Switch
                      checked={organization.campaignPlannerEnabled}
                      disabled={busyOrganizationId === organization.id}
                      onCheckedChange={(checked) =>
                        updateOrganization(organization.id, { campaignPlannerEnabled: checked })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <form
              action={(formData) => saveLimits(organization.id, formData)}
              className="grid gap-3 rounded-[24px] border border-black/8 bg-white p-4 md:grid-cols-4"
            >
              <div className="space-y-2">
                <Label htmlFor={`plan-${organization.id}`}>Plan</Label>
                <Input id={`plan-${organization.id}`} name="plan" defaultValue={organization.plan} className="rounded-full" />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`hostname-${organization.id}`}>Client hostname</Label>
                <Input
                  id={`hostname-${organization.id}`}
                  name="loginHostname"
                  defaultValue={organization.loginHostname ?? ''}
                  placeholder="Optional"
                  className="rounded-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`mail-limit-${organization.id}`}>Mail account limit</Label>
                <Input
                  id={`mail-limit-${organization.id}`}
                  name="maxMailAccounts"
                  type="number"
                  min="0"
                  defaultValue={organization.maxMailAccounts}
                  className="rounded-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`campaign-limit-${organization.id}`}>Campaign limit</Label>
                <Input
                  id={`campaign-limit-${organization.id}`}
                  name="maxCampaigns"
                  type="number"
                  min="0"
                  defaultValue={organization.maxCampaigns}
                  className="rounded-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`csv-limit-${organization.id}`}>CSV upload limit</Label>
                <Input
                  id={`csv-limit-${organization.id}`}
                  name="maxCsvUploads"
                  type="number"
                  min="0"
                  defaultValue={organization.maxCsvUploads}
                  className="rounded-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`wa-limit-${organization.id}`}>WhatsApp limit</Label>
                <Input
                  id={`wa-limit-${organization.id}`}
                  name="maxWhatsAppAccounts"
                  type="number"
                  min="0"
                  defaultValue={organization.maxWhatsAppAccounts}
                  className="rounded-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`daily-campaign-${organization.id}`}>Daily campaign cap</Label>
                <Input
                  id={`daily-campaign-${organization.id}`}
                  name="dailyCampaignSendCap"
                  type="number"
                  min="0"
                  defaultValue={organization.dailyCampaignSendCap ?? ''}
                  className="rounded-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`daily-api-${organization.id}`}>Daily API cap</Label>
                <Input
                  id={`daily-api-${organization.id}`}
                  name="dailyApiSendCap"
                  type="number"
                  min="0"
                  defaultValue={organization.dailyApiSendCap ?? ''}
                  className="rounded-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`gdrive-daily-${organization.id}`}>GDrive org daily cap</Label>
                <Input
                  id={`gdrive-daily-${organization.id}`}
                  name="gdriveDailySendCap"
                  type="number"
                  min="1"
                  defaultValue={organization.gdriveDailySendCap}
                  className="rounded-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`gdrive-account-${organization.id}`}>GDrive per-account cap</Label>
                <Input
                  id={`gdrive-account-${organization.id}`}
                  name="gdriveAccountDailyLimit"
                  type="number"
                  min="1"
                  max="200"
                  defaultValue={organization.gdriveAccountDailyLimit}
                  className="rounded-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`proxy-visible-${organization.id}`}>Proxy details visibility</Label>
                <select
                  id={`proxy-visible-${organization.id}`}
                  name="mailProxyVisibleToOrg"
                  defaultValue={String(organization.mailProxyVisibleToOrg)}
                  className="h-10 w-full rounded-full border border-black/10 bg-white px-3 text-sm"
                >
                  <option value="false">Hidden</option>
                  <option value="true">Visible</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`trulyinbox-visible-${organization.id}`}>TrulyInbox access</Label>
                <select
                  id={`trulyinbox-visible-${organization.id}`}
                  name="trulyInboxVisibleToOrg"
                  defaultValue={String(organization.trulyInboxVisibleToOrg)}
                  className="h-10 w-full rounded-full border border-black/10 bg-white px-3 text-sm"
                >
                  <option value="false">Disabled</option>
                  <option value="true">Enabled</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`proxy-host-${organization.id}`}>Proxy host override</Label>
                <Input
                  id={`proxy-host-${organization.id}`}
                  name="mailProxyHost"
                  defaultValue={organization.mailProxyHost ?? ''}
                  placeholder="Global fallback"
                  className="rounded-full"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full rounded-full" disabled={busyOrganizationId === organization.id}>
                  {busyOrganizationId === organization.id ? 'Saving...' : 'Save limits'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
