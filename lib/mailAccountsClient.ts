import type {
  DomainHealthSnapshot,
  DomainHealthSummary,
  DomainDiagnostics,
  MailAccount,
  MailboxMessage,
  PaginatedResponse,
  WarmupLog,
  WarmupOverview,
  WarmupRecipient,
} from '@/components/mail-accounts/types'

async function readJson<T>(input: RequestInfo | URL, init?: RequestInit, fallback?: T): Promise<T> {
  try {
    const response = await fetch(input, init)
    const data = await response.json()
    return data as T
  } catch {
    return fallback as T
  }
}

export async function fetchMailAccountsDashboardData() {
  const [mailAccounts, warmupRecipients, warmupOverview, warmupLogs, domainHealth] = await Promise.all([
    readJson<PaginatedResponse<MailAccount>>('/api/mail-accounts?page=1&limit=10', undefined, {
      items: [],
      total: 0,
      page: 1,
      pages: 1,
      limit: 10,
    }),
    readJson<PaginatedResponse<WarmupRecipient>>('/api/mail-accounts?resource=warmup-recipients&page=1&limit=10', undefined, {
      items: [],
      total: 0,
      page: 1,
      pages: 1,
      limit: 10,
    }),
    readJson<WarmupOverview | null>('/api/mail-accounts?resource=warmup-overview', undefined, null),
    readJson<PaginatedResponse<WarmupLog>>('/api/mail-accounts?resource=warmup-logs&page=1&limit=10', undefined, {
      items: [],
      total: 0,
      page: 1,
      pages: 1,
      limit: 10,
    }),
    readJson<{ domains: DomainHealthSummary[]; history: DomainHealthSnapshot[] }>(
      '/api/mail-accounts?resource=domain-health',
      undefined,
      { domains: [], history: [] }
    ),
  ])

  return {
    mailAccounts,
    warmupRecipients,
    warmupOverview,
    warmupLogs,
    domainHealth,
  }
}

export async function fetchDomainDiagnostics() {
  return readJson<DomainDiagnostics[]>('/api/mail-accounts?resource=domain-diagnostics', undefined, [])
}

export async function patchMailAccount(body: Record<string, unknown>) {
  return fetch('/api/mail-accounts', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function deleteMailAccount(id: string) {
  return fetch(`/api/mail-accounts?id=${id}`, { method: 'DELETE' })
}

export async function fetchMailboxMessages(mailAccountId: string, folderKind?: string) {
  const sp = new URLSearchParams({ resource: 'mailbox-messages', mailAccountId })
  if (folderKind) sp.set('folderKind', folderKind)
  return readJson<PaginatedResponse<MailboxMessage>>(`/api/mail-accounts?${sp.toString()}`, undefined, {
    items: [],
    total: 0,
    page: 1,
    pages: 1,
    limit: 25,
  })
}

export async function fetchMailAccountDetail(id: string) {
  return readJson<MailAccount | null>(`/api/mail-accounts?resource=account-detail&id=${encodeURIComponent(id)}`, undefined, null)
}

export async function patchMailboxMessage(body: Record<string, unknown>) {
  return fetch('/api/mail-accounts?resource=mailbox-messages', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function patchWarmupRecipient(body: Record<string, unknown>) {
  return fetch('/api/mail-accounts?resource=warmup-recipients', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function createWarmupRecipient(body: Record<string, unknown>) {
  return fetch('/api/mail-accounts?resource=warmup-recipients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function importWarmupRecipients(body: Record<string, unknown>) {
  return fetch('/api/mail-accounts?resource=warmup-recipients-bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function deleteWarmupRecipient(id: string) {
  return fetch(`/api/mail-accounts?resource=warmup-recipients&id=${id}`, { method: 'DELETE' })
}

export async function connectTrulyInbox(body: Record<string, unknown>) {
  return fetch('/api/mail-accounts?resource=trulyinbox-connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function startTrulyInboxWarmup(body: Record<string, unknown>) {
  return fetch('/api/mail-accounts?resource=trulyinbox-start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
