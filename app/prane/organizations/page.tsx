'use client'

import { PraneOrganizationsPageClient } from '@/components/prane/PraneOrganizationsPageClient'
import { PraneError, PraneLoading } from '@/components/prane/PraneAsyncStates'
import { useApiResource } from '@/lib/hooks'

type OrganizationRecord = {
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
  _count: {
    members: number
    mailAccounts: number
    campaigns: number
    csvFiles: number
    whatsAppAccounts: number
  }
}

export default function PraneOrganizationsPage() {
  const { data, loading, error } = useApiResource<OrganizationRecord[]>('/api/prane/organizations')

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm uppercase tracking-[0.22em] text-[var(--text-muted)]">Organizations</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">Manage tenant workspaces</h1>
      </div>
      {loading && !data ? (
        <PraneLoading label="Loading organizations..." />
      ) : error || !data ? (
        <PraneError message={error} />
      ) : (
        <PraneOrganizationsPageClient
          organizations={data.map((organization) => ({
            ...organization,
            membersCount: organization._count.members,
            mailAccountsCount: organization._count.mailAccounts,
            campaignsCount: organization._count.campaigns,
            csvFilesCount: organization._count.csvFiles,
            whatsAppAccountsCount: organization._count.whatsAppAccounts,
          }))}
        />
      )}
    </div>
  )
}
