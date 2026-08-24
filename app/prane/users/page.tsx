'use client'

import { PraneUsersPageClient } from '@/components/prane/PraneUsersPageClient'
import { PraneError, PraneLoading } from '@/components/prane/PraneAsyncStates'
import { useApiResource } from '@/lib/hooks'

type UserRecord = {
  id: string
  name: string | null
  email: string | null
  platformRole: 'SUPER_ADMIN' | 'USER'
  activeOrganizationId: string | null
  hasPassword: boolean
  orgMemberships: Array<{
    organizationId: string
    role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
    organization: { name: string; status: 'ACTIVE' | 'SUSPENDED' }
  }>
}

type OrganizationRecord = {
  id: string
  name: string
  status: 'ACTIVE' | 'SUSPENDED'
}

export default function PraneUsersPage() {
  const users = useApiResource<UserRecord[]>('/api/prane/users')
  const organizations = useApiResource<OrganizationRecord[]>('/api/prane/organizations')

  const loading = (users.loading && !users.data) || (organizations.loading && !organizations.data)
  const error = users.error || organizations.error

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm uppercase tracking-[0.22em] text-[var(--text-muted)]">Platform users</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">Provision and assign access</h1>
      </div>
      {loading ? (
        <PraneLoading label="Loading users..." />
      ) : error || !users.data || !organizations.data ? (
        <PraneError message={error} />
      ) : (
        <PraneUsersPageClient
          users={users.data.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            platformRole: user.platformRole,
            activeOrganizationId: user.activeOrganizationId,
            hasPassword: user.hasPassword,
            memberships: user.orgMemberships.map((membership) => ({
              organizationId: membership.organizationId,
              organizationName: membership.organization.name,
              role: membership.role,
            })),
          }))}
          organizations={organizations.data.map((organization) => ({
            id: organization.id,
            name: organization.name,
            status: organization.status,
          }))}
        />
      )}
    </div>
  )
}
