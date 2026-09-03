'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CircleAlert,
  CircleCheck,
  Flame,
  Inbox,
  KeyRound,
  Loader2,
  Mail,
  MoreVertical,
  PieChart,
  Plus,
  Power,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldAlert,
  Sliders,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { GmailImapSmtpForm } from '@/components/mail-accounts/GmailImapSmtpForm'
import { ImapSmtpAccountForm } from '@/components/mail-accounts/ImapSmtpAccountForm'
import { MicrosoftOAuthButton } from '@/components/mail-accounts/MicrosoftOAuthButton'
import { ZohoOAuthButton } from '@/components/mail-accounts/ZohoOAuthButton'
import {
  AccountHeader,
  MetricPair,
  panelStyle,
  ProgressBar,
  StatCard,
  surfaceCardStyle,
} from '@/components/mail-accounts/MailAccountsPrimitives'
import { ZohoAccountForm } from '@/components/mail-accounts/ZohoAccountForm'
import { MailboxAvatar, GmailLogo, ZohoLogo, OutlookLogo } from '@/components/mail-accounts/MailboxAvatar'
import { MailboxSettingsDrawer } from '@/components/mail-accounts/MailboxSettingsDrawer'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PaginationControls } from '@/components/ui/pagination-controls'
import type {
  ActiveTab,
  DomainDiagnostics,
  DomainHealthSnapshot,
  DomainHealthSummary,
  MailAccount,
  MailboxMessage,
  PaginatedResponse,
  WarmupLog,
  WarmupOverview,
  WarmupRecipient,
} from '@/components/mail-accounts/types'

// ── Health Badge Component (inline badge matching template) ─────────────────
function HealthBadge({ score }: { score: number }) {
  const safeScore = Math.max(0, Math.min(100, score || 0))
  const isHealthy = safeScore >= 70
  const isWarming = safeScore >= 40 && safeScore < 70

  return (
    <div className="flex justify-center">
      <div
        className={`h-8.5 inline-flex items-center justify-center px-3.5 rounded-lg border ${
          isHealthy
            ? 'bg-green-50 text-green-700 border-green-100'
            : isWarming
            ? 'bg-yellow-50 text-yellow-700 border-yellow-100'
            : 'bg-red-50 text-red-700 border-red-100'
        }`}
      >
        <span className="text-sm font-bold">{safeScore}</span>
        <span
          className={`text-xs font-semibold ml-0.5 ${
            isHealthy ? 'text-green-600/70' : isWarming ? 'text-yellow-600/70' : 'text-red-600/70'
          }`}
        >
          /100
        </span>
      </div>
    </div>
  )
}


// ── Top Bar placeholder ──────────────────────────────────────────────────────
export function MailAccountsHero(props: {
  activeTab: ActiveTab
  setActiveTab: (tab: ActiveTab) => void
  accountCount: number
  warmedCount: number
}) {
  return null
}

export function DomainPanels(props: {
  domainHealth: DomainHealthSummary[]
  domainHealthHistory: DomainHealthSnapshot[]
  domainDiagnostics: DomainDiagnostics[]
}) {
  return (
    <div style={{ display: 'grid', gap: '18px', marginBottom: '20px' }}>
      {props.domainHealth.length > 0 ? (
        <div style={panelStyle}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>Domain health</div>
          <div style={{ display: 'grid', gap: '10px' }}>
            {props.domainHealth.map((item) => (
              <div key={`${item.domain}-${item.providerHint}`} style={{ ...surfaceCardStyle, padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.domain} ({item.providerHint})
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                      Score {item.averageHealthScore}/100, {item.mailboxCount} mailboxes, {item.activeCampaignCount} active campaigns
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Healthy {item.healthyCount} | Warming {item.warmingCount} | At risk {item.atRiskCount} | Paused {item.pausedCount}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      7d sent {item.sentCount7d} | Bounce {(item.bounceRate7d * 100).toFixed(0)}% | Failure {(item.failureRate7d * 100).toFixed(0)}% | Complaints {item.complaintCount14d}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: item.healthStatus === 'healthy' ? 'var(--success)' : item.healthStatus === 'warming' ? 'var(--warning)' : 'var(--error)' }}>
                    {item.healthStatus.toUpperCase()}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>{item.notes}</div>
              </div>
            ))}
          </div>
          {props.domainHealthHistory.length > 0 ? (
            <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Recent snapshots: {props.domainHealthHistory.slice(0, 4).map((snapshot) => `${snapshot.domain} ${new Date(snapshot.periodEnd).toLocaleDateString()}`).join(' • ')}
            </div>
          ) : null}
        </div>
      ) : null}

      {props.domainDiagnostics.length > 0 ? (
        <div style={panelStyle}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>Domain safety checks</div>
          <div style={{ display: 'grid', gap: '10px' }}>
            {props.domainDiagnostics.map((item) => (
              <div key={`${item.domain}-${item.providerHint}`} style={{ ...surfaceCardStyle, padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.domain} ({item.providerHint})
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                      SPF {item.sharedProviderDomain ? 'N/A' : item.spf.providerAligned ? 'OK' : 'WARN'} | DKIM {item.sharedProviderDomain ? 'N/A' : item.dkim.providerAligned ? 'OK' : 'WARN'} | DMARC {item.sharedProviderDomain ? 'N/A' : item.dmarc.found ? (item.dmarc.policy || 'present') : 'missing'} | Score {item.riskScore}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{item.recommendedAction}</div>
                    {item.warnings.length > 0 ? (
                      <div style={{ fontSize: '12px', color: 'var(--error)', marginTop: '6px' }}>{item.warnings.join(' | ')}</div>
                    ) : (
                      <div style={{ fontSize: '12px', color: 'var(--success)', marginTop: '6px' }}>Provider alignment looks good.</div>
                    )}
                    {item.spf.suggestedRecord ? (
                      <div style={{ marginTop: '8px' }}>
                        {item.spf.record ? (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            Current SPF: <code style={{ wordBreak: 'break-all' }}>{item.spf.record}</code>
                          </div>
                        ) : null}
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                          Correct SPF record for {item.domain} (publish as a TXT record at the domain root):
                        </div>
                        <code
                          style={{
                            display: 'block',
                            fontSize: '12px',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            background: 'var(--surface-muted, rgba(127,127,127,0.12))',
                            color: 'var(--text-primary)',
                            wordBreak: 'break-all',
                          }}
                        >
                          {item.spf.suggestedRecord}
                        </code>
                      </div>
                    ) : null}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: item.severity === 'critical' ? 'var(--error)' : item.severity === 'warning' ? 'var(--warning)' : 'var(--success)' }}>
                    {item.severity.toUpperCase()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

// ── Main Accounts View Matching Modern Layout & Table Design ────────────────
export function AccountsView(props: {
  loading: boolean
  accounts: MailAccount[]
  accountsPagination: PaginatedResponse<MailAccount>
  setAccountsPage: (page: number) => void
  setAccountsLimit: (limit: number) => void
  pendingDailyLimits: Record<string, string>
  setPendingDailyLimits: React.Dispatch<React.SetStateAction<Record<string, string>>>
  pendingWarmupLimits: Record<string, string>
  setPendingWarmupLimits: React.Dispatch<React.SetStateAction<Record<string, string>>>
  pendingWarmupReplyLimits: Record<string, string>
  setPendingWarmupReplyLimits: React.Dispatch<React.SetStateAction<Record<string, string>>>
  pendingTrackingDomains: Record<string, string>
  setPendingTrackingDomains: React.Dispatch<React.SetStateAction<Record<string, string>>>
  pendingWarmupTimezones: Record<string, string>
  setPendingWarmupTimezones: React.Dispatch<React.SetStateAction<Record<string, string>>>
  pendingWarmupBusinessHoursStart: Record<string, string>
  setPendingWarmupBusinessHoursStart: React.Dispatch<React.SetStateAction<Record<string, string>>>
  pendingWarmupBusinessHoursEnd: Record<string, string>
  setPendingWarmupBusinessHoursEnd: React.Dispatch<React.SetStateAction<Record<string, string>>>
  pendingTrulyInboxApiKeys: Record<string, string>
  setPendingTrulyInboxApiKeys: React.Dispatch<React.SetStateAction<Record<string, string>>>
  showTrulyInboxApiKeys: Record<string, boolean>
  setShowTrulyInboxApiKeys: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  trulyInboxConnecting: Record<string, boolean>
  trulyInboxStarting: Record<string, boolean>
  handleWarmupStatusChange: (id: string, status: MailAccount['warmupStatus']) => void
  handleWarmupAutoToggle: (id: string, current: boolean) => void
  handleUpdateMailDailyLimit: (id: string) => void
  handleUpdateMailWarmupLimit: (id: string) => void
  handleUpdateMailWarmupReplyLimit: (id: string) => void
  handleWarmupProviderPreferenceChange: (id: string, preference: MailAccount['warmupProviderPreference']) => void
  handleUpdateTrackingDomain: (id: string) => void
  handleUpdateMailWarmupSchedule: (id: string) => void
  handleReconnectGmail: () => void
  handleReconnectZohoApi: () => void
  handleConnectTrulyInbox: (id: string) => void
  handleStartTrulyInboxWarmup: (id: string) => void
  handleUseZohoApi: (id: string) => void
  handleZohoImapToggle: (id: string, current: boolean) => void
  handleOpenMailboxFolder: (mailAccountId: string, folderKind: 'INBOX' | 'SPAM' | 'SENT') => void
  handleMailboxAction: (
    mailAccountId: string,
    mailboxMessageId: string,
    action: 'mark-read' | 'rescue-to-inbox' | 'reply'
  ) => void
  activeMailboxAccountId: string | null
  activeMailboxFolder: 'INBOX' | 'SPAM' | 'SENT'
  mailboxMessages: MailboxMessage[]
  mailboxPagination: PaginatedResponse<MailboxMessage>
  mailboxLoading: boolean
  accountDetailsLoading: Record<string, boolean>
  loadMailAccountDetail: (id: string) => void
  handleMailboxPageChange: (page: number) => void
  handleMailboxLimitChange: (limit: number) => void
  handleRunWarmupNow: (id: string) => void
  handleRunMailboxSyncNow: (id: string) => void
  handleToggleMailActive: (id: string, current: boolean, warmupStatus: MailAccount['warmupStatus']) => void
  handleDeleteMail: (id: string, email: string) => void
  activeTab?: ActiveTab
  setActiveTab?: (tab: ActiveTab) => void
}) {
  const [drawerAccountId, setDrawerAccountId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showTrulyInboxModal, setShowTrulyInboxModal] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [providerFilter, setProviderFilter] = useState<'all' | 'zoho' | 'gmail' | 'outlook' | 'smtp'>('all')

  // Escape key and click-outside listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (drawerAccountId) setDrawerAccountId(null)
        if (showTrulyInboxModal) setShowTrulyInboxModal(false)
        if (showAddMenu) setShowAddMenu(false)
      }
    }
    const handleClickOutside = () => {
      setShowAddMenu(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('click', handleClickOutside)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('click', handleClickOutside)
    }
  }, [drawerAccountId, showTrulyInboxModal, showAddMenu])

  type StatusFilter = 'all' | 'connected' | 'disconnected' | 'error'
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const erroredCount = props.accounts.filter(
    (a) => a.mailboxSyncStatus === 'error' || a.connectionReady === false
  ).length
  const disconnectedCount = props.accounts.filter(
    (a) => a.isActive === false || a.connectionReady === false
  ).length
  const connectedCount = props.accounts.filter(
    (a) => a.isActive !== false && a.connectionReady !== false && a.mailboxSyncStatus !== 'error'
  ).length

  const filteredAccounts = useMemo(() => {
    return props.accounts.filter((a) => {
      // Status Filter
      if (statusFilter === 'connected') {
        const isConnected =
          a.isActive !== false && a.connectionReady !== false && a.mailboxSyncStatus !== 'error'
        if (!isConnected) return false
      } else if (statusFilter === 'disconnected') {
        const isDisconnected = a.isActive === false || a.connectionReady === false
        if (!isDisconnected) return false
      } else if (statusFilter === 'error') {
        const isError = a.mailboxSyncStatus === 'error' || a.connectionReady === false
        if (!isError) return false
      }

      if (providerFilter !== 'all' && a.type !== providerFilter) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        a.email.toLowerCase().includes(q) ||
        (a.displayName || '').toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q)
      )
    })
  }, [props.accounts, searchQuery, providerFilter, statusFilter])

  const totalConnected = props.accounts.filter((a) => a.connectionReady !== false).length
  const totalWarmed = props.accounts.filter((a) => a.warmupStatus === 'WARMED').length
  const trulyInboxConnectedCount = props.accounts.filter((a) => a.trulyInboxConnected).length

  const currentPage = props.accountsPagination?.page || 1
  const totalPages = props.accountsPagination?.pages || 1
  const currentLimit = props.accountsPagination?.limit || 10
  const totalCount = props.accountsPagination?.total || props.accounts.length

  return (
    <div className="space-y-6">
      {/* Top Header: Stats & Search/Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Header Left: Global Stats / Clickable Quick Filters */}
        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'connected' ? 'all' : 'connected')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border shadow-2xs transition-all cursor-pointer ${
              statusFilter === 'connected'
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-gray-50 hover:bg-emerald-50/50 border-gray-100 text-gray-700'
            }`}
            title="Click to filter connected accounts"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                statusFilter === 'connected' ? 'bg-white' : 'bg-[#10B981]'
              }`}
            />
            <span className="text-sm font-semibold">{connectedCount} Connected</span>
          </button>
          <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-full border border-orange-100 text-orange-700 shadow-2xs">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-semibold">{totalWarmed} Warmed</span>
          </div>
          {erroredCount > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'error' ? 'all' : 'error')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-semibold shadow-2xs transition-all cursor-pointer ${
                statusFilter === 'error'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
              }`}
              title="Click to filter errored accounts"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>{erroredCount} Errored</span>
            </button>
          )}
        </div>

        {/* Header Right: Status Filter Dropdown, Search & TrulyInbox Action */}
        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          {/* Status Filter Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-4 py-2 text-sm font-semibold rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-[#10B981] focus:outline-hidden shadow-2xs cursor-pointer appearance-none pr-9 transition-colors"
            >
              <option value="all">Show: All Mails ({totalCount})</option>
              <option value="connected">Show: Connected ({connectedCount})</option>
              <option value="disconnected">Show: Disconnected ({disconnectedCount})</option>
              <option value="error">Show: Errored ({erroredCount})</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              name="mail_accounts_search_query"
              id="mail_accounts_search_query"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-lpignore="true"
              data-1p-ignore="true"
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] transition-colors shadow-2xs placeholder-gray-400 text-gray-900 focus:outline-hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-0.5 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowTrulyInboxModal(true)}
            className="flex items-center gap-2 bg-green-50 text-[#10B981] border border-green-100 px-4 py-2 rounded-full text-sm font-semibold hover:bg-green-100 transition-colors shadow-2xs shrink-0 cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-[#10B981]" />
            <span>TrulyInbox AI ({trulyInboxConnectedCount})</span>
          </button>
        </div>
      </div>

      {/* Account Filters & Status Pills */}
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Status Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-sm font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
              statusFilter === 'all'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>All Mails</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                statusFilter === 'all' ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {totalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('connected')}
            className={`px-3.5 py-1.5 rounded-full text-sm font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
              statusFilter === 'connected'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-emerald-50/50 hover:border-emerald-200'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Connected</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                statusFilter === 'connected'
                  ? 'bg-emerald-800 text-emerald-100'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              }`}
            >
              {connectedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('disconnected')}
            className={`px-3.5 py-1.5 rounded-full text-sm font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
              statusFilter === 'disconnected'
                ? 'bg-gray-700 text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
            <span>Disconnected</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                statusFilter === 'disconnected'
                  ? 'bg-gray-800 text-gray-200'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {disconnectedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('error')}
            className={`px-3.5 py-1.5 rounded-full text-sm font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
              statusFilter === 'error'
                ? 'bg-red-600 text-white shadow-xs'
                : erroredCount > 0
                ? 'bg-red-50/70 border border-red-200 text-red-700 hover:bg-red-100'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-red-50 hover:text-red-700'
            }`}
          >
            <AlertTriangle
              className={`h-4 w-4 ${statusFilter === 'error' ? 'text-white' : 'text-red-500'}`}
            />
            <span>Errored</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                statusFilter === 'error'
                  ? 'bg-red-800 text-red-100'
                  : erroredCount > 0
                  ? 'bg-red-100 text-red-800 border border-red-200'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {erroredCount}
            </span>
          </button>
        </div>

        {/* Right: Add Mailbox Dropdown Button */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setShowAddMenu((prev) => !prev)
            }}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-xs cursor-pointer active:scale-95"
            aria-label="Add Mail Account"
          >
            <Plus
              className={`h-4 w-4 transition-transform duration-200 ${
                showAddMenu ? 'rotate-45' : ''
              }`}
            />
            <span>Add Mailbox</span>
          </button>

          {showAddMenu && (
            <div
              className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 flex flex-col gap-1 min-w-[220px] z-30 animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  setShowAddMenu(false)
                  props.setActiveTab?.('add-zoho')
                }}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors text-left cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                  <ZohoLogo className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="block font-bold text-gray-900 group-hover:text-orange-700 text-sm">Zoho Mail</span>
                  <span className="text-xs text-gray-400 font-normal">OAuth or IMAP/SMTP</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAddMenu(false)
                  props.setActiveTab?.('add-gmail')
                }}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors text-left cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                  <GmailLogo className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-bold text-gray-900 group-hover:text-red-700 text-sm">Google / Gmail</span>
                  <span className="text-xs text-gray-400 font-normal">App password setup</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAddMenu(false)
                  props.setActiveTab?.('add-outlook')
                }}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <OutlookLogo className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-bold text-gray-900 group-hover:text-blue-700 text-sm">Microsoft Outlook</span>
                  <span className="text-xs text-gray-400 font-normal">Office 365 / Exchange</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAddMenu(false)
                  props.setActiveTab?.('add-smtp-imap')
                }}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors text-left cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-gray-600">SMTP</span>
                </div>
                <div>
                  <span className="block font-bold text-gray-900 group-hover:text-gray-900 text-sm">Custom SMTP / IMAP</span>
                  <span className="text-xs text-gray-400 font-normal">Any mail server</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="max-w-[1400px] mx-auto bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[2.5fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3.5 bg-white border-b border-gray-100 text-[13px] font-semibold text-gray-500 uppercase tracking-wider sticky top-0 z-10">
          <div>Account</div>
          <div>Status</div>
          <div className="text-center">Sent</div>
          <div className="text-center">Warmup</div>
          <div className="text-center">Health</div>
          <div className="w-8" />
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-100">
          {props.loading ? (
            <div className="px-6 py-12 text-center text-sm text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-[#10B981]" />
              Loading email accounts...
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-500 italic">
              {searchQuery
                ? 'No accounts match your search query.'
                : statusFilter === 'error'
                ? 'No errored mail accounts found.'
                : statusFilter === 'disconnected'
                ? 'No disconnected mail accounts found.'
                : statusFilter === 'connected'
                ? 'No connected mail accounts found.'
                : 'No email accounts connected.'}
            </div>
          ) : (
            filteredAccounts.map((account) => {
              const provider =
                account.type === 'gmail'
                  ? { label: 'Gmail', color: '#ee382b', bg: 'bg-red-100 text-red-600' }
                  : account.type === 'zoho'
                  ? { label: 'Zoho Mail', color: '#d97706', bg: 'bg-orange-100 text-orange-600' }
                  : account.type === 'outlook'
                  ? { label: 'Outlook', color: '#004ac6', bg: 'bg-blue-100 text-blue-600' }
                  : { label: 'Custom SMTP', color: '#475569', bg: 'bg-gray-100 text-gray-700' }

              const isSelected = drawerAccountId === account.id

              return (
                <div
                  key={account.id}
                  className={`flex flex-col transition-colors border-b border-gray-100 last:border-b-0 ${
                    isSelected ? 'bg-emerald-50/20' : 'bg-white'
                  }`}
                >
                  {/* Row Summary Header */}
                  <div
                    onClick={() => {
                      setDrawerAccountId(account.id)
                      if (!account.detailsLoaded) {
                        props.loadMailAccountDetail(account.id)
                      }
                    }}
                    className="grid grid-cols-[2.5fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4.5 items-center hover:bg-gray-50 cursor-pointer transition-colors group"
                  >
                    {/* Account Info */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <MailboxAvatar account={account} />
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[15px] font-semibold text-gray-900 truncate group-hover:text-emerald-700 transition-colors">
                            {account.email}
                          </span>
                          {account.trulyInboxConnected && (
                            <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100 text-xs font-medium flex items-center gap-1 shrink-0">
                              <Sparkles className="h-3 w-3 text-[#10B981]" />
                              TrulyInbox
                            </span>
                          )}
                        </div>
                        <span className="text-[13px] text-gray-500 truncate mt-0.5">
                          {provider.label} · {account.displayName || account.email}
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-green-50 text-green-700 border border-green-100">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Connected
                      </span>
                      {account.mailboxSyncStatus === 'error' ? (
                        <span className="text-xs font-medium text-red-500 flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5" /> Sync error
                        </span>
                      ) : account.mailboxSyncStatus === 'syncing' ? (
                        <span className="text-xs font-medium text-blue-600 flex items-center gap-1.5">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Syncing
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-green-500" /> Synced
                        </span>
                      )}
                    </div>

                    {/* Sent */}
                    <div className="text-center text-sm font-medium text-gray-700">
                      <span className="text-gray-900 font-bold text-[15px]">{account.sentToday}</span>{' '}
                      <span className="text-gray-500 font-normal text-[13px]">/{account.dailyLimit}</span>
                    </div>

                    {/* Warmup */}
                    <div className="text-center text-sm font-medium text-gray-700">
                      <span className="text-gray-900 font-bold text-[15px]">{account.warmupSentToday}</span>{' '}
                      <span className="text-gray-500 font-normal text-[13px]">/{account.warmupDailyLimit}</span>
                    </div>

                    {/* Health Badge */}
                    <HealthBadge score={account.mailboxHealthScore} />

                    {/* Actions / Settings Button */}
                    <div className="w-8 flex justify-end">
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-900 p-1.5 rounded-lg hover:bg-gray-100 transition-colors focus:outline-hidden cursor-pointer"
                        title="Manage mailbox settings"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDrawerAccountId(account.id)
                          if (!account.detailsLoaded) props.loadMailAccountDetail(account.id)
                        }}
                      >
                        <Settings2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-3.5 flex flex-wrap items-center justify-between border-t border-gray-100 bg-white text-sm gap-3">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium">Rows:</span>
            <select
              value={currentLimit}
              onChange={(e) => props.setAccountsLimit(Number(e.target.value))}
              className="bg-transparent text-gray-900 font-semibold border-none focus:ring-0 cursor-pointer p-0 text-sm focus:outline-hidden"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-gray-500 ml-4 border-l border-gray-200 pl-4 font-medium">
              {totalCount > 0
                ? `${(currentPage - 1) * currentLimit + 1}–${Math.min(currentPage * currentLimit, totalCount)} of ${totalCount}`
                : '0 of 0'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => props.setAccountsPage(1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => props.setAccountsPage(currentPage - 1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1.5 mx-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, idx, arr) => {
                  const showGap = idx > 0 && p - arr[idx - 1] > 1
                  return (
                    <span key={p} className="flex items-center gap-1.5">
                      {showGap && <span className="text-gray-400 px-0.5">...</span>}
                      <button
                        type="button"
                        onClick={() => props.setAccountsPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                          p === currentPage
                            ? 'bg-gray-900 text-white shadow-2xs'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  )
                })}
            </div>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => props.setAccountsPage(currentPage + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => props.setAccountsPage(totalPages)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mailbox Settings Slide-Over Drawer */}
      <MailboxSettingsDrawer
        account={props.accounts.find((a) => a.id === drawerAccountId) || null}
        isOpen={Boolean(drawerAccountId)}
        onClose={() => setDrawerAccountId(null)}
        isLoadingDetail={drawerAccountId ? Boolean(props.accountDetailsLoading[drawerAccountId]) : false}
        loadMailAccountDetail={props.loadMailAccountDetail}
        pendingDailyLimits={props.pendingDailyLimits}
        setPendingDailyLimits={props.setPendingDailyLimits}
        pendingWarmupLimits={props.pendingWarmupLimits}
        setPendingWarmupLimits={props.setPendingWarmupLimits}
        pendingWarmupReplyLimits={props.pendingWarmupReplyLimits}
        setPendingWarmupReplyLimits={props.setPendingWarmupReplyLimits}
        pendingTrackingDomains={props.pendingTrackingDomains}
        setPendingTrackingDomains={props.setPendingTrackingDomains}
        handleUpdateTrackingDomain={props.handleUpdateTrackingDomain}
        pendingWarmupTimezones={props.pendingWarmupTimezones}
        setPendingWarmupTimezones={props.setPendingWarmupTimezones}
        pendingWarmupBusinessHoursStart={props.pendingWarmupBusinessHoursStart}
        setPendingWarmupBusinessHoursStart={props.setPendingWarmupBusinessHoursStart}
        pendingWarmupBusinessHoursEnd={props.pendingWarmupBusinessHoursEnd}
        setPendingWarmupBusinessHoursEnd={props.setPendingWarmupBusinessHoursEnd}
        handleUpdateMailWarmupSchedule={props.handleUpdateMailWarmupSchedule}
        pendingTrulyInboxApiKeys={props.pendingTrulyInboxApiKeys}
        setPendingTrulyInboxApiKeys={props.setPendingTrulyInboxApiKeys}
        showTrulyInboxApiKeys={props.showTrulyInboxApiKeys}
        setShowTrulyInboxApiKeys={props.setShowTrulyInboxApiKeys}
        trulyInboxConnecting={props.trulyInboxConnecting}
        trulyInboxStarting={props.trulyInboxStarting}
        handleUpdateMailDailyLimit={props.handleUpdateMailDailyLimit}
        handleUpdateMailWarmupLimit={props.handleUpdateMailWarmupLimit}
        handleUpdateMailWarmupReplyLimit={props.handleUpdateMailWarmupReplyLimit}
        handleWarmupStatusChange={props.handleWarmupStatusChange}
        handleWarmupProviderPreferenceChange={props.handleWarmupProviderPreferenceChange}
        handleWarmupAutoToggle={props.handleWarmupAutoToggle}
        handleRunWarmupNow={props.handleRunWarmupNow}
        handleToggleMailActive={props.handleToggleMailActive}
        handleConnectTrulyInbox={props.handleConnectTrulyInbox}
        handleStartTrulyInboxWarmup={props.handleStartTrulyInboxWarmup}
        handleOpenMailboxFolder={props.handleOpenMailboxFolder}
        handleRunMailboxSyncNow={props.handleRunMailboxSyncNow}
        handleDeleteMail={props.handleDeleteMail}
        handleMailboxAction={props.handleMailboxAction}
        handleUseZohoApi={props.handleUseZohoApi}
        handleZohoImapToggle={props.handleZohoImapToggle}
        handleReconnectGmail={props.handleReconnectGmail}
        handleReconnectZohoApi={props.handleReconnectZohoApi}
        activeMailboxAccountId={props.activeMailboxAccountId}
        activeMailboxFolder={props.activeMailboxFolder}
        mailboxMessages={props.mailboxMessages}
        mailboxLoading={props.mailboxLoading}
      />

      {/* TrulyInbox Deliverability Partner Overview Modal */}
      {showTrulyInboxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#121316]/40 backdrop-blur-xs animate-fade-in">
          <div
            className="w-full max-w-2xl bg-white rounded-[24px] border border-[#121316]/12 shadow-2xl p-6 sm:p-8 space-y-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#10B981] text-white flex items-center justify-center font-bold shadow-sm">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold tracking-widest text-[#10B981] uppercase block">
                    DELIVERABILITY ACCELERATOR
                  </span>
                  <h3 className="text-xl font-bold text-gray-900">
                    TrulyInbox AI Warmup & Deliverability
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowTrulyInboxModal(false)}
                className="p-2 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                <span className="text-xs font-bold text-gray-900 block">AI Warmup Pool</span>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Simulates human conversations across real business domains.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                <span className="text-xs font-bold text-gray-900 block">Spam Folder Rescue</span>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Automatically rescues warm messages and marks them important.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                <span className="text-xs font-bold text-gray-900 block">Domain Reputation</span>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Maintains a 95%+ sender reputation for maximum deliverability.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-green-50 border border-green-100 space-y-2">
              <span className="text-xs font-bold text-gray-900 block">How to enable on your accounts:</span>
              <ol className="list-decimal list-inside text-xs text-gray-600 space-y-1">
                <li>Expand any mailbox row in the table below.</li>
                <li>Paste your TrulyInbox API Key into the deliverability section.</li>
                <li>Click <strong>Connect API Key</strong> and then <strong>Start Truly Warmup</strong>.</li>
              </ol>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <a
                href="https://trulyinbox.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-[#10B981] hover:underline inline-flex items-center gap-1"
              >
                <span>Get TrulyInbox API Key</span>
                <span>↗</span>
              </a>

              <button
                type="button"
                onClick={() => setShowTrulyInboxModal(false)}
                className="px-6 py-2.5 rounded-full bg-gray-900 text-white text-xs font-bold hover:bg-black transition-all cursor-pointer shadow-sm"
              >
                Got it, Thanks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function WarmupView(props: {
  warmupOverview: WarmupOverview | null
  loading: boolean
  warmupRecipients: WarmupRecipient[]
  warmupRecipientsPagination: PaginatedResponse<WarmupRecipient>
  setRecipientPage: (page: number) => void
  setRecipientLimit: (limit: number) => void
  recipientForm: { email: string; name: string; isActive: boolean }
  setRecipientForm: React.Dispatch<React.SetStateAction<{ email: string; name: string; isActive: boolean }>>
  recipientSaving: boolean
  bulkRecipients: string
  setBulkRecipients: React.Dispatch<React.SetStateAction<string>>
  handleCreateWarmupRecipient: () => void
  handleBulkWarmupRecipients: () => void
  handleToggleWarmupRecipient: (id: string, current: boolean) => void
  handleDeleteWarmupRecipient: (id: string, email: string) => void
  warmupLogs: WarmupLog[]
  warmupLogsPagination: PaginatedResponse<WarmupLog>
  setWarmupLogPage: (page: number) => void
  setWarmupLogLimit: (limit: number) => void
  recipientPoolHealthy: boolean
  activeMailboxPool: number
  activeCustomRecipients: number
}) {
  return (
    <div style={{ display: 'grid', gap: '18px' }}>
      <div style={panelStyle}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>Warmup control panel</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '12px' }}>
          <StatCard value={props.warmupOverview?.warming ?? 0} label="Warming senders" color="var(--accent)" />
          <StatCard value={props.warmupOverview?.warmed ?? 0} label="Warmed senders" color="var(--success)" />
          <StatCard value={props.activeMailboxPool} label="Active mailbox pool" color="var(--text-primary)" />
          <StatCard value={props.activeCustomRecipients} label="Active custom recipients" color="var(--warning)" />
        </div>
        <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          Recipient pool is currently {props.recipientPoolHealthy ? 'healthy' : 'thin'}.
        </div>
      </div>

      <div style={panelStyle}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>Warmup recipients</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '10px', marginBottom: '12px' }}>
          <input className="input-base" type="email" placeholder="recipient@example.com" value={props.recipientForm.email} onChange={(e) => props.setRecipientForm((prev) => ({ ...prev, email: e.target.value }))} />
          <input className="input-base" type="text" placeholder="Display name" value={props.recipientForm.name} onChange={(e) => props.setRecipientForm((prev) => ({ ...prev, name: e.target.value }))} />
          <button className="btn-primary" disabled={props.recipientSaving} onClick={props.handleCreateWarmupRecipient}>{props.recipientSaving ? 'Saving...' : 'Add recipient'}</button>
        </div>
        <textarea className="input-base" placeholder="Paste emails separated by commas, spaces, or new lines" value={props.bulkRecipients} onChange={(e) => props.setBulkRecipients(e.target.value)} style={{ minHeight: '110px', resize: 'vertical' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
          <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={props.recipientForm.isActive} onChange={(e) => props.setRecipientForm((prev) => ({ ...prev, isActive: e.target.checked }))} />
            Start active
          </label>
          <button className="btn-ghost" disabled={props.recipientSaving} onClick={props.handleBulkWarmupRecipients}>{props.recipientSaving ? 'Importing...' : 'Import bulk recipients'}</button>
        </div>

        <div style={{ display: 'grid', gap: '10px', marginTop: '16px' }}>
          {props.loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading recipients...</div>
          ) : props.warmupRecipients.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No warmup recipients yet.</div>
          ) : (
            props.warmupRecipients.map((recipient) => (
              <div key={recipient.id} style={{ ...surfaceCardStyle, padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{recipient.name || recipient.email}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{recipient.email}</div>
                    <div style={{ fontSize: '12px', color: recipient.isActive ? 'var(--success)' : 'var(--warning)', marginTop: '4px' }}>
                      {recipient.isSystem ? 'System recipient' : 'Custom recipient'} • {recipient.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="btn-ghost" disabled={recipient.isSystem} onClick={() => props.handleToggleWarmupRecipient(recipient.id, recipient.isActive)}>
                      {recipient.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button className="btn-ghost" style={{ color: 'var(--error)' }} disabled={recipient.isSystem} onClick={() => props.handleDeleteWarmupRecipient(recipient.id, recipient.email)}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {props.warmupRecipientsPagination.total > 0 ? (
          <div style={{ marginTop: '14px' }}>
            <PaginationControls
              page={props.warmupRecipientsPagination.page}
              pages={props.warmupRecipientsPagination.pages}
              total={props.warmupRecipientsPagination.total}
              limit={props.warmupRecipientsPagination.limit}
              onPageChange={props.setRecipientPage}
              onLimitChange={props.setRecipientLimit}
              label="recipients"
            />
          </div>
        ) : null}
      </div>

      <div style={panelStyle}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>Recent warmup mail</div>
        {props.warmupLogs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No warmup mail logged yet.</div>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {props.warmupLogs.map((log) => (
              <div key={log.id} style={{ ...surfaceCardStyle, padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {log.direction === 'reply' ? 'Reply' : 'Outbound'} • {log.status.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      From {log.senderDisplayName || log.senderEmail} ({log.senderEmail})
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      To {log.recipientDisplayName || log.recipientDisplayEmail} ({log.recipientDisplayEmail})
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Stage {log.stage} • {new Date(log.sentAt).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '6px' }}>{log.subject}</div>
                    {log.errorMessage ? <div style={{ fontSize: '12px', color: 'var(--error)', marginTop: '6px' }}>{log.errorMessage}</div> : null}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: log.status === 'sent' ? 'var(--success)' : 'var(--warning)' }}>
                    {log.recipientType === 'system' ? 'System' : 'External'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {props.warmupLogsPagination.total > 0 ? (
          <div style={{ marginTop: '14px' }}>
            <PaginationControls
              page={props.warmupLogsPagination.page}
              pages={props.warmupLogsPagination.pages}
              total={props.warmupLogsPagination.total}
              limit={props.warmupLogsPagination.limit}
              onPageChange={props.setWarmupLogPage}
              onLimitChange={props.setWarmupLogLimit}
              label="warmup logs"
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

// ── Add Zoho View (2-Step Unified Setup: Step 1 SMTP + Step 2 OAuth) ────────
export function AddZohoView({
  onAdded,
  onClose,
}: {
  onAdded: () => void
  onClose?: () => void
}) {
  const [connectingOAuth, setConnectingOAuth] = useState(false)
  const [region, setRegion] = useState('in')

  const handleConnectOAuth = () => {
    setConnectingOAuth(true)
    window.location.href = `/api/mail-accounts/zoho/connect?region=${encodeURIComponent(region)}`
  }

  return (
    <div className="uneevo-card p-6 sm:p-8 rounded-[24px] border border-[#121316]/12 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-7 max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-widest text-[#d97706] uppercase block mb-1">
            ZOHO MAIL INTEGRATION
          </span>
          <h2 className="zoho-puvi-headline text-2xl font-bold tracking-tight text-[#121316]">
            Connect Zoho Mail Account
          </h2>
          <p className="text-xs sm:text-sm text-[#62605c] mt-1">
            Follow the two steps below to connect your Zoho mailbox for reliable campaign sending and full inbox synchronization.
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-[#8a8780] hover:text-[#121316] hover:bg-[#121316]/05 transition-colors cursor-pointer shrink-0"
            title="Close (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Step 1: App Password / SMTP */}
      <div className="space-y-4 rounded-2xl border border-[#121316]/08 bg-[#faf8f4]/60 p-5 sm:p-6">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-[#d97706]/15 text-[#d97706]">
            Step 1
          </span>
          <h3 className="text-sm sm:text-base font-bold text-[#121316]">
            Zoho App Password / SMTP (Outbound Sending)
          </h3>
        </div>
        <p className="text-xs text-[#62605c]">
          Enter your Zoho account details and app password for campaign dispatch.
        </p>

        <div className="pt-2">
          <ZohoAccountForm onAccountAdded={onAdded} />
        </div>
      </div>

      {/* Step 2: Zoho OAuth (Inbox Sync & Mailbox Tools) */}
      <div className="space-y-4 rounded-2xl border border-[#121316]/08 bg-[#faf8f4]/60 p-5 sm:p-6">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-[#2563eb]/15 text-[#2563eb]">
            Step 2
          </span>
          <h3 className="text-sm sm:text-base font-bold text-[#121316]">
            Zoho OAuth Authorization (Inbox Sync &amp; Reply Tools)
          </h3>
        </div>
        <p className="text-xs text-[#62605c]">
          Link Zoho OAuth to unlock inbox sync, spam rescue, and automatic reply detection for the same mailbox.
        </p>

        {/* Region Selector */}
        <div className="p-4 rounded-xl border border-[#2563eb]/15 bg-white space-y-3 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="text-xs font-bold text-[#121316] block">
                Zoho Data Center / Account Region
              </label>
              <span className="text-[11px] text-[#62605c]">
                Select the region where your Zoho account was registered.
              </span>
            </div>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-[#2563eb] focus:outline-hidden"
            >
              <option value="in">India (accounts.zoho.in)</option>
              <option value="com">US / Global (accounts.zoho.com)</option>
              <option value="eu">Europe (accounts.zoho.eu)</option>
              <option value="com.au">Australia (accounts.zoho.com.au)</option>
              <option value="jp">Japan (accounts.zoho.jp)</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-4 pt-2 border-t border-gray-100 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-xs">
                Z
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-[#121316]">Authorize via Zoho OAuth</div>
                <div className="text-[11px] text-[#62605c] mt-0.5">
                  Redirects to Zoho ({`accounts.zoho.${region}`}) to authorize mailbox permissions.
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={connectingOAuth}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#121316] text-xs font-bold text-white shadow-sm hover:bg-black disabled:opacity-50 transition-all cursor-pointer"
              onClick={handleConnectOAuth}
            >
              {connectingOAuth ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Redirecting...</span>
                </>
              ) : (
                <span>Connect via OAuth</span>
              )}
            </button>
          </div>
        </div>

        {/* Zoho Cookies / Privacy Alert */}
        <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-950">
            <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span>If Zoho says "Cookies are disabled for your browser":</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 pl-1 text-amber-800">
            <li>Ensure <strong>third-party cookies</strong> are allowed for Zoho in your browser settings (or disable Brave Shields / tracking blockers for Zoho).</li>
            <li>Make sure the <strong>Account Region</strong> selected above matches your Zoho domain (e.g. <code>.in</code> for India vs <code>.com</code> for Global).</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// ── Add Gmail View (Clean Uneevo Card) ───────────────────────────────────────
export function AddGmailView({ onAdded, onClose }: { onAdded?: () => void; onClose?: () => void }) {
  return (
    <div className="uneevo-card p-6 sm:p-8 rounded-[24px] border border-[#121316]/12 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-6 max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-widest text-[#ee382b] uppercase block mb-1">
            GMAIL INTEGRATION
          </span>
          <h2 className="zoho-puvi-headline text-2xl font-bold tracking-tight text-[#121316]">
            Connect Gmail with App Password
          </h2>
          <p className="text-xs sm:text-sm text-[#62605c] mt-1">
            Connect using IMAP + SMTP with a Google App Password for uninterrupted sending without periodic OAuth expirations.
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-[#8a8780] hover:text-[#121316] hover:bg-[#121316]/05 transition-colors cursor-pointer shrink-0"
            title="Close (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <GmailImapSmtpForm onAccountAdded={onAdded} />
    </div>
  )
}

// ── Add Outlook View (Clean Uneevo Card) ─────────────────────────────────────
export function AddOutlookView({ onAdded, onClose }: { onAdded?: () => void; onClose?: () => void }) {
  return (
    <div className="uneevo-card p-6 sm:p-8 rounded-[24px] border border-[#121316]/12 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-6 max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-widest text-[#004ac6] uppercase block mb-1">
            MICROSOFT OUTLOOK INTEGRATION
          </span>
          <h2 className="zoho-puvi-headline text-2xl font-bold tracking-tight text-[#121316]">
            Connect Microsoft Mailbox
          </h2>
          <p className="text-xs sm:text-sm text-[#62605c] mt-1">
            Microsoft OAuth securely links your Outlook or Microsoft 365 mailbox for automated dispatch and inbox synchronisation.
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-[#8a8780] hover:text-[#121316] hover:bg-[#121316]/05 transition-colors cursor-pointer shrink-0"
            title="Close (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="pt-2">
        <MicrosoftOAuthButton />
      </div>
    </div>
  )
}

// ── Add Custom SMTP / IMAP View (Clean Uneevo Card) ───────────────────────────
export function AddSmtpImapView({ onAdded, onClose }: { onAdded?: () => void; onClose?: () => void }) {
  return (
    <div className="uneevo-card p-6 sm:p-8 rounded-[24px] border border-[#121316]/12 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-6 max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-widest text-[#475569] uppercase block mb-1">
            CUSTOM PROTOCOL INTEGRATION
          </span>
          <h2 className="zoho-puvi-headline text-2xl font-bold tracking-tight text-[#121316]">
            Connect Custom SMTP + IMAP Mailbox
          </h2>
          <p className="text-xs sm:text-sm text-[#62605c] mt-1">
            Connect any mail server by entering its host, port, and security credentials.
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-[#8a8780] hover:text-[#121316] hover:bg-[#121316]/05 transition-colors cursor-pointer shrink-0"
            title="Close (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <ImapSmtpAccountForm
        providerLabel="SMTP/IMAP"
        endpoint="/api/mail-accounts/smtp-imap"
        description="Add any mailbox by entering its SMTP and IMAP settings manually. The connection test verifies both sending and inbox access before saving."
        passwordLabel="Mailbox password or app password"
        defaults={{ smtpHost: '', smtpPort: '587', smtpSecure: false, imapHost: '', imapPort: '993', imapSecure: true }}
        showUsernames
        saveLabel="Save SMTP/IMAP Mailbox"
        onAccountAdded={onAdded}
      />
    </div>
  )
}
