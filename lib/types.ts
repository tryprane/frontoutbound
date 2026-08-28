/** Response shapes returned by the OutreachOS backend endpoints. */

export type OrgRole = 'VIEWER' | 'MEMBER' | 'ADMIN' | 'OWNER'
export type PlatformRole = 'SUPER_ADMIN' | 'USER'
export type OrganizationStatus = 'ACTIVE' | 'SUSPENDED'
export type WarmupPoolMode = 'PRIVATE' | 'SHARED_OPT_IN'

/** GET /api/me */
export interface CurrentUser {
  user: {
    id: string
    email: string | null
    name: string | null
    platformRole: PlatformRole
    isSuperAdmin: boolean
  }
  organization: {
    id: string
    name: string
    slug: string
    status: OrganizationStatus
    loginHostname: string | null
    warmupPoolMode: WarmupPoolMode
  }
  role: OrgRole
  roleRank: number
  memberships: Array<{
    role: OrgRole
    organizationId: string
    organizationName: string
    organizationStatus: OrganizationStatus
  }>
}

/** GET /api/dashboard/stats */
export interface DashboardStats {
  campaigns: number
  mailAccounts: number
  activeMailAccounts?: number
  warmingAccounts: number
  warmedAccounts?: number
  csvFiles: number
  sentToday: number
  warmupSentToday?: number
  totalSentToday?: number
  activeCampaigns: number
  dailyData: Array<{
    dayLabel: string
    dateString: string
    outboundCount: number
    warmupCount: number
  }>
  totalSentWeek: number
  totalWarmupWeek: number
  activities: Array<{
    id: string
    type: 'sent' | 'warmup' | 'campaign' | 'csv'
    title: string
    detail: string
    timeAgo: string
    status?: string
  }>
  mailboxWarmupList?: Array<{
    id: string
    email: string
    displayName: string | null
    type: string
    isActive: boolean
    warmupStatus: 'COLD' | 'WARMING' | 'WARMED' | 'PAUSED' | string
    warmupStage: number
    warmupDailyLimit: number
    warmupSentToday: number
    warmupRepliesToday: number
    sentToday: number
    dailyLimit: number
    mailboxHealthScore: number
    mailboxHealthStatus: string
    lastWarmupSentAt: string | null
  }>
  showOnboarding: boolean
}

/** GET /api/csv/[id]/detail */
export interface CsvDetail {
  csvFile: {
    id: string
    originalName: string
    rowCount: number
    uploadedAt: string
    campaignCount: number
  }
  rows: Array<{
    id: string
    rowIndex: number
    name: string | null
    website: string | null
    email: string | null
    whatsapp: string | null
    rawData: Record<string, string> | null
  }>
  columnMap: Record<string, { type: string; variable?: string; name?: string }>
  mappedColumns: Array<{ column: string; type: string; label: string }>
  stats: {
    totalRows: number
    rowsWithEmail: number
    rowsWithPhone: number
    emailPct: number
    phonePct: number
  }
  pagination: {
    page: number
    limit: number
    totalRows: number
    totalPages: number
    pageStart: number
    pageEnd: number
  }
}

/** GET /api/prane/overview */
export interface PraneOverview {
  users: number
  organizations: number
  activeOrganizations: number
  suspendedOrganizations: number
  unassignedUsers: number
  mailAccounts: number
  campaigns: number
  sharedWarmupOrganizations: number
  sharedWarmupMailboxes: number
  openAlerts: number
  workerHeartbeats: number
  staleWorkers: number
  proposedScalingActions: number
  failedScalingActions: number
  latestMetric: {
    waitingCount: number | null
    activeCount: number | null
    delayedCount: number | null
    failedCount: number | null
    capturedAt: string
  } | null
  recentAuditLogs: Array<{
    id: string
    action: string
    targetType: string
    targetId: string | null
    createdAt: string
    actorUser: { email: string | null; name: string | null } | null
    organization: { name: string } | null
  }>
  serverNodes: number
  degradedServers: number
  hotServerMetrics: number
}

/** GET /api/prane/alerts */
export interface PraneAlert {
  id: string
  title: string
  message: string
  source: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  status: string
  firstOpenedAt: string
  updatedAt: string
}

/** GET /api/prane/audit-log */
export interface PraneAuditLogEntry {
  id: string
  action: string
  targetType: string
  targetId: string | null
  metadata: unknown
  createdAt: string
  actorUser: { email: string | null; name: string | null } | null
  organization: { name: string } | null
}

/** GET /api/prane/queues */
export interface PraneQueueSnapshot {
  id: string
  queueName: string | null
  source: string
  waitingCount: number | null
  activeCount: number | null
  delayedCount: number | null
  failedCount: number | null
  oldestWaitingAgeMs: number | null
  capturedAt: string
}

export interface PraneWorkerHeartbeat {
  id: string
  role: string
  hostname: string
  processId: number
  runningQueues: string[]
  lastSeenAt: string
  isStale?: boolean
  metadata?: unknown
}

/** GET /api/prane/deployments */
export interface PraneDeployments {
  deployments: Array<{
    role: string
    replicas: number
    staleReplicas: number
    latestVersion: string | null
    latestSeenAt: string | null
    instances: Array<{
      id: string
      workerInstanceId: string
      hostname: string
      role: string
      version: string | null
      queues: string[]
      runningQueues: string[]
      lastSeenAt: string
      metadata: unknown
      isStale: boolean
    }>
  }>
  recentActions: Array<{
    id: string
    actionType: string
    status: string
    title: string
    workflowName: string | null
    workflowRunUrl: string | null
    requestedAt: string
    completedAt: string | null
    requestedByUser: { name: string | null; email: string | null } | null
    approvedByUser: { name: string | null; email: string | null } | null
  }>
  latestMetric: {
    waitingCount: number | null
    activeCount: number | null
    delayedCount: number | null
    failedCount: number | null
    workerCount: number | null
    capturedAt: string
    metadata: unknown
  } | null
}

/** GET /api/prane/scaling-actions */
export interface PraneScalingActionList {
  actions: Array<{
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
    requestedAt: string
    approvedAt: string | null
    startedAt: string | null
    completedAt: string | null
    createdAt: string
    updatedAt: string
    organization: { id: string; name: string; slug: string } | null
    requestedByUser: { id: string; name: string | null; email: string | null } | null
    approvedByUser: { id: string; name: string | null; email: string | null } | null
  }>
}

/** GET /api/prane/access-codes */
export interface PraneAccessCode {
  id: string
  codePrefix: string
  createdAt: string
  usedAt: string | null
  usedByUser: { email: string | null } | null
}

/** GET /api/prane/warmup-pool */
export interface PraneWarmupPool {
  totals: {
    totalMailboxes: number
    sharedPoolMailboxes: number
    privatePoolMailboxes: number
    eligibleMailboxes: number
    sharedEligibleMailboxes: number
    gmailEligible: number
    zohoEligible: number
    pausedMailboxes: number
    unhealthyMailboxes: number
  }
  organizations: Array<{
    id: string
    name: string
    status: OrganizationStatus
    warmupPoolMode: WarmupPoolMode
    totalMailboxes: number
    eligibleMailboxes: number
    gmailEligible: number
    zohoEligible: number
    pausedMailboxes: number
    unhealthyMailboxes: number
  }>
}

/** GET /api/prane/servers */
export interface PraneServerList {
  servers: Array<{
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
    lastVerifiedAt: string | null
    lastSeenAt: string | null
    failureReason: string | null
    credential: { id: string; fingerprint: string | null; lastClaimedAt: string | null } | null
    workloadAssignments: Array<{
      id: string
      workloadRole: 'CAMPAIGN' | 'WARMUP' | 'SYNC' | 'BACKGROUND' | 'WHATSAPP'
      enabled: boolean
    }>
    latestRun: {
      id: string
      actionType: string
      status: string
      workflowRunUrl: string | null
      errorMessage: string | null
      createdAt: string
      updatedAt: string
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
      capturedAt: string
    } | null
  }>
}

/** GET /api/prane/mail-proxy */
export interface PraneMailProxy {
  rows: Array<{
    id: string
    organizationId: string
    organizationName: string
    warmupPoolMode: WarmupPoolMode
    email: string
    displayName: string | null
    provider: string
    isActive: boolean
    warmupStatus: string
    warmupAutoEnabled: boolean
    mailboxHealthStatus: string
    mailboxSyncStatus: string
    smtpReady: boolean
    inboxReady: boolean
    proxyEnabled: boolean
    missingPrerequisites: string[]
    proxyUsername: string
    proxyPassword: string | null
    proxyLastRotatedAt: string | null
    smtpHost: string
    smtpPort: number
    smtpSecurity: string
    imapMode: string
    imapHost: string | null
    imapPort: number | null
    imapSecurity: string
    imapUsername: string | null
    imapPassword: string | null
    notes: string
  }>
  config: {
    smtpHost: string
    smtpPort: number
    smtpSecurity: string
    imapProxyHost: string | null
    imapProxyPort: number | null
    imapProxySecurity: string
  }
  stats: {
    total: number
    smtpReady: number
    inboxReady: number
    fullyReady: number
    sharedPool: number
  }
}
