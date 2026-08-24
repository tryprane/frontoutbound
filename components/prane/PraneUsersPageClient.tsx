'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type OrgSummary = {
  id: string
  name: string
  status: 'ACTIVE' | 'SUSPENDED'
}

type UserSummary = {
  id: string
  name: string | null
  email: string | null
  platformRole: 'SUPER_ADMIN' | 'USER'
  activeOrganizationId: string | null
  hasPassword: boolean
  memberships: Array<{
    organizationId: string
    organizationName: string
    role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
  }>
}

export function PraneUsersPageClient({
  users,
  organizations,
}: {
  users: UserSummary[]
  organizations: OrgSummary[]
}) {
  const [busyUserId, setBusyUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [createBusy, setCreateBusy] = useState(false)

  async function createUser(formData: FormData) {
    const payload = {
      name: String(formData.get('name') || ''),
      email: String(formData.get('email') || ''),
      password: String(formData.get('password') || ''),
      organizationId: String(formData.get('organizationId') || ''),
      role: String(formData.get('role') || 'MEMBER'),
      platformRole: String(formData.get('platformRole') || 'USER'),
    }

    setCreateBusy(true)
    setError(null)

    try {
      const response = await fetch('/api/prane/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to create user')
      }
      window.location.reload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to create user')
    } finally {
      setCreateBusy(false)
    }
  }

  async function assignUser(formData: FormData) {
    const userId = String(formData.get('userId') || '')
    const organizationId = String(formData.get('organizationId') || '')
    const role = String(formData.get('role') || 'MEMBER')
    if (!userId || !organizationId) return

    setBusyUserId(userId)
    setError(null)

    try {
      const response = await fetch(`/api/prane/organizations/${organizationId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Failed to assign user')
      }
      window.location.reload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to assign user')
    } finally {
      setBusyUserId(null)
    }
  }

  async function updateMembership(userId: string, organizationId: string, role: string) {
    setBusyUserId(userId)
    setError(null)

    try {
      const response = await fetch(`/api/prane/organizations/${organizationId}/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Failed to update role')
      }
      window.location.reload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to update role')
    } finally {
      setBusyUserId(null)
    }
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <Card className="rounded-[28px] border-black/8 bg-white/88 shadow-none">
        <CardContent className="space-y-5 p-6">
          <div>
            <div className="text-lg font-semibold text-[var(--text-primary)]">Create a client login</div>
            <div className="text-sm text-[var(--text-secondary)]">
              Use this when a new client contact sends you their email and needs direct access to their organization.
            </div>
          </div>

          <form action={createUser} className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="create-name">Display name</Label>
              <Input id="create-name" name="name" className="rounded-full" placeholder="Client name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input id="create-email" name="email" type="email" className="rounded-full" placeholder="client@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Temporary password</Label>
              <Input id="create-password" name="password" type="password" className="rounded-full" placeholder="Minimum 8 characters" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-platform-role">Platform role</Label>
              <select
                id="create-platform-role"
                name="platformRole"
                className="h-10 rounded-full border border-black/10 bg-white px-3 text-sm"
                defaultValue="USER"
                disabled={createBusy}
              >
                <option value="USER">USER</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-organization">Organization</Label>
              <select
                id="create-organization"
                name="organizationId"
                className="h-10 rounded-full border border-black/10 bg-white px-3 text-sm"
                defaultValue=""
                disabled={createBusy}
              >
                <option value="">No organization yet</option>
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name} ({organization.status})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-role">Organization role</Label>
              <select
                id="create-role"
                name="role"
                className="h-10 rounded-full border border-black/10 bg-white px-3 text-sm"
                defaultValue="MEMBER"
                disabled={createBusy}
              >
                <option value="OWNER">OWNER</option>
                <option value="ADMIN">ADMIN</option>
                <option value="MEMBER">MEMBER</option>
                <option value="VIEWER">VIEWER</option>
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" className="rounded-full px-6" disabled={createBusy}>
                {createBusy ? 'Creating...' : 'Create user'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {users.map((user) => (
        <Card key={user.id} className="rounded-[28px] border-black/8 bg-white/88 shadow-none">
          <CardContent className="space-y-5 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-[var(--text-primary)]">{user.name || 'Unnamed user'}</div>
                <div className="text-sm text-[var(--text-secondary)]">{user.email || 'No email on file'}</div>
                <div className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {user.platformRole} {user.activeOrganizationId ? '· Provisioned' : '· Not provisioned'}
                </div>
                <div className="mt-2 text-xs text-[var(--text-muted)]">
                  Password {user.hasPassword ? 'set' : 'not set'}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium text-[var(--text-primary)]">Memberships</div>
              {user.memberships.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-black/10 px-4 py-3 text-sm text-[var(--text-muted)]">
                  This user is not assigned to any organization yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {user.memberships.map((membership) => (
                    <div
                      key={`${user.id}-${membership.organizationId}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-black/8 bg-[#fcfbf8] px-4 py-3"
                    >
                      <div>
                        <div className="text-sm font-medium text-[var(--text-primary)]">{membership.organizationName}</div>
                        <div className="text-xs text-[var(--text-muted)]">Organization member</div>
                      </div>
                      <select
                        className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm"
                        defaultValue={membership.role}
                        disabled={busyUserId === user.id}
                        onChange={(event) => updateMembership(user.id, membership.organizationId, event.target.value)}
                      >
                        <option value="OWNER">OWNER</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="MEMBER">MEMBER</option>
                        <option value="VIEWER">VIEWER</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form action={assignUser} className="grid gap-3 rounded-[24px] border border-black/8 bg-[#fcfbf8] p-4 md:grid-cols-[1.4fr_1fr_1fr_auto]">
              <input type="hidden" name="userId" value={user.id} />
              <div className="space-y-2">
                <Label htmlFor={`organization-${user.id}`}>Assign to organization</Label>
                <select
                  id={`organization-${user.id}`}
                  name="organizationId"
                  className="h-10 rounded-full border border-black/10 bg-white px-3 text-sm"
                  defaultValue=""
                  disabled={busyUserId === user.id}
                >
                  <option value="" disabled>
                    Select organization
                  </option>
                  {organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name} ({organization.status})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`role-${user.id}`}>Role</Label>
                <select
                  id={`role-${user.id}`}
                  name="role"
                  className="h-10 rounded-full border border-black/10 bg-white px-3 text-sm"
                  defaultValue="MEMBER"
                  disabled={busyUserId === user.id}
                >
                  <option value="OWNER">OWNER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="MEMBER">MEMBER</option>
                  <option value="VIEWER">VIEWER</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`active-org-${user.id}`}>Current active org</Label>
                <Input
                  id={`active-org-${user.id}`}
                  value={user.activeOrganizationId || 'None'}
                  disabled
                  className="rounded-full"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full rounded-full" disabled={busyUserId === user.id}>
                  {busyUserId === user.id ? 'Saving...' : 'Assign'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
