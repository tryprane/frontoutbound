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

// ── Health Badge Component (32px inline badge matching template) ─────────────
function HealthBadge({ score }: { score: number }) {
  const safeScore = Math.max(0, Math.min(100, score || 0))
  const isHealthy = safeScore >= 70
  const isWarming = safeScore >= 40 && safeScore < 70

  return (
    <div className="flex justify-center">
      <div
        className={`h-8 inline-flex items-center justify-center px-3 rounded border ${
          isHealthy
            ? 'bg-green-50 text-green-700 border-green-100'
            : isWarming
            ? 'bg-yellow-50 text-yellow-700 border-yellow-100'
            : 'bg-red-50 text-red-700 border-red-100'
        }`}
      >
        <span className="text-xs font-bold">{safeScore}</span>
        <span
          className={`text-[10px] font-medium ml-0.5 ${
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
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showTrulyInboxModal, setShowTrulyInboxModal] = useState(false)
  const [showFabMenu, setShowFabMenu] = useState(false)
  const [providerFilter, setProviderFilter] = useState<'all' | 'zoho' | 'gmail' | 'outlook' | 'smtp'>('all')

  // Escape key listener for TrulyInbox modal & FAB menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showTrulyInboxModal) setShowTrulyInboxModal(false)
        if (showFabMenu) setShowFabMenu(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showTrulyInboxModal, showFabMenu])

  const filteredAccounts = useMemo(() => {
    return props.accounts.filter((a) => {
      if (providerFilter !== 'all' && a.type !== providerFilter) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        a.email.toLowerCase().includes(q) ||
        (a.displayName || '').toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q)
      )
    })
  }, [props.accounts, searchQuery, providerFilter])

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
        {/* Header Left: Global Stats */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-gray-50 px-3.5 py-1.5 rounded-full border border-gray-100 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span className="text-sm font-medium text-gray-700">{totalConnected} Connected</span>
          </div>
          <div className="flex items-center gap-2 bg-orange-50 px-3.5 py-1.5 rounded-full border border-orange-100 text-orange-700 shadow-2xs">
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-sm font-medium">{totalWarmed} Warmed</span>
          </div>
        </div>

        {/* Header Right: Search & TrulyInbox Action */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] transition-colors shadow-2xs placeholder-gray-400 text-gray-900 focus:outline-hidden"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowTrulyInboxModal(true)}
            className="flex items-center gap-2 bg-green-50 text-[#10B981] border border-green-100 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-green-100 transition-colors shadow-2xs shrink-0 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#10B981]" />
            <span>TrulyInbox AI ({trulyInboxConnectedCount})</span>
          </button>
        </div>
      </div>

      {/* Account Filters / Connect Pills */}
      <div className="max-w-[1400px] mx-auto flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          type="button"
          onClick={() => {
            setProviderFilter('all')
            props.setActiveTab?.('accounts')
          }}
          className={`px-4 py-1.5 rounded-full text-sm font-medium shadow-2xs shrink-0 transition-colors cursor-pointer ${
            providerFilter === 'all' && (!props.activeTab || props.activeTab === 'accounts')
              ? 'bg-gray-900 text-white hover:bg-gray-800'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          All Accounts
        </button>

        <button
          type="button"
          onClick={() => props.setActiveTab?.('add-zoho')}
          className="px-4 py-1.5 rounded-full text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-2xs shrink-0 flex items-center gap-2 transition-colors cursor-pointer"
        >
          <span className="text-orange-500 font-bold text-xs">+</span>
          <span>Zoho</span>
        </button>

        <button
          type="button"
          onClick={() => props.setActiveTab?.('add-gmail')}
          className="px-4 py-1.5 rounded-full text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-2xs shrink-0 flex items-center gap-2 transition-colors cursor-pointer"
        >
          <span className="text-red-500 font-bold text-xs">+</span>
          <span>Gmail</span>
        </button>

        <button
          type="button"
          onClick={() => props.setActiveTab?.('add-outlook')}
          className="px-4 py-1.5 rounded-full text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-2xs shrink-0 flex items-center gap-2 transition-colors cursor-pointer"
        >
          <span className="text-blue-500 font-bold text-xs">+</span>
          <span>Outlook</span>
        </button>

        <button
          type="button"
          onClick={() => props.setActiveTab?.('add-smtp-imap')}
          className="px-4 py-1.5 rounded-full text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-2xs shrink-0 flex items-center gap-2 transition-colors cursor-pointer"
        >
          <span className="text-gray-500 font-bold text-xs">+</span>
          <span>Custom SMTP</span>
        </button>
      </div>

      {/* Main Table Container */}
      <div className="max-w-[1400px] mx-auto bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[2.5fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 bg-white border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0 z-10">
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
            <div className="px-6 py-12 text-center text-xs text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-[#10B981]" />
              Loading email accounts...
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="px-6 py-12 text-center text-xs text-gray-400 italic">
              {searchQuery ? 'No accounts match your search filter.' : 'No email accounts connected.'}
            </div>
          ) : (
            filteredAccounts.map((account) => {
              const isExpanded = expandedAccountId === account.id
              const isDetailLoading = props.accountDetailsLoading[account.id] === true
              const provider =
                account.type === 'gmail'
                  ? { label: 'Gmail', color: '#ee382b', bg: 'bg-red-100 text-red-600' }
                  : account.type === 'zoho'
                  ? { label: 'Zoho Mail', color: '#d97706', bg: 'bg-orange-100 text-orange-600' }
                  : account.type === 'outlook'
                  ? { label: 'Outlook', color: '#004ac6', bg: 'bg-blue-100 text-blue-600' }
                  : { label: 'Custom SMTP', color: '#475569', bg: 'bg-gray-100 text-gray-700' }

              const connectionReady = account.connectionReady !== false
              const initialLetter = (account.displayName || account.email || 'M').charAt(0).toUpperCase()

              return (
                <div
                  key={account.id}
                  className={`flex flex-col transition-colors ${
                    isExpanded ? 'bg-gray-50/50 relative' : 'bg-white'
                  }`}
                >
                  {/* Active Row Highlight Bar */}
                  {isExpanded && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#10B981] rounded-r z-10" />
                  )}

                  {/* Row Summary Header */}
                  <div
                    onClick={() => {
                      if (isExpanded) {
                        setExpandedAccountId(null)
                        return
                      }
                      setExpandedAccountId(account.id)
                      if (!account.detailsLoaded) {
                        props.loadMailAccountDetail(account.id)
                      }
                    }}
                    className="grid grid-cols-[2.5fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center hover:bg-gray-50 cursor-pointer transition-colors group"
                  >
                    {/* Account Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${provider.bg}`}
                      >
                        {initialLetter}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-semibold text-gray-900 truncate">
                            {account.email}
                          </span>
                          {account.trulyInboxConnected && (
                            <span className="px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-100 text-[10px] font-medium flex items-center gap-1 shrink-0">
                              <Sparkles className="h-2.5 w-2.5 text-[#10B981]" />
                              TrulyInbox
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 truncate mt-0.5">
                          {provider.label} · {account.displayName || account.email}
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-green-50 text-green-700 border border-green-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Connected
                      </span>
                      {account.mailboxSyncStatus === 'error' ? (
                        <span className="text-[11px] text-red-500 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Sync error
                        </span>
                      ) : account.mailboxSyncStatus === 'syncing' ? (
                        <span className="text-[11px] text-blue-600 flex items-center gap-1">
                          <RefreshCw className="h-3 w-3 animate-spin" /> Syncing
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-500 flex items-center gap-1">
                          <Check className="h-3 w-3 text-green-500" /> Synced
                        </span>
                      )}
                    </div>

                    {/* Sent */}
                    <div className="text-center text-sm font-medium text-gray-700">
                      <span className="text-gray-900 font-semibold">{account.sentToday}</span>{' '}
                      <span className="text-gray-400 font-normal">/{account.dailyLimit}</span>
                    </div>

                    {/* Warmup */}
                    <div className="text-center text-sm font-medium text-gray-700">
                      <span className="text-gray-900 font-semibold">{account.warmupSentToday}</span>{' '}
                      <span className="text-gray-400 font-normal">/{account.warmupDailyLimit}</span>
                    </div>

                    {/* Health Badge */}
                    <HealthBadge score={account.mailboxHealthScore} />

                    {/* Actions */}
                    <div className="w-8 flex justify-end">
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors focus:outline-hidden"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (isExpanded) {
                            setExpandedAccountId(null)
                          } else {
                            setExpandedAccountId(account.id)
                            if (!account.detailsLoaded) props.loadMailAccountDetail(account.id)
                          }
                        }}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Detail Panel */}
                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 border-t border-gray-100 animate-fade-in">
                      {!account.detailsLoaded ? (
                        <div className="py-8 text-center text-xs text-gray-400">
                          {isDetailLoading ? (
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin text-[#10B981]" />
                              <span>Loading diagnostics and mailbox controls...</span>
                            </div>
                          ) : (
                            'Click to load full controls...'
                          )}
                        </div>
                      ) : (
                        <>
                          {/* TrulyInbox Integration Banner */}
                          <div className="mb-8 p-4 rounded-xl border border-gray-100 bg-white shadow-xs flex items-start gap-4">
                            <div className="w-8 h-8 rounded-lg bg-[#10B981] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                              <Sparkles className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-semibold text-gray-900 tracking-wide uppercase">
                                    TRULYINBOX DELIVERABILITY ENGINE
                                  </h4>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700 border border-green-100">
                                    AI Warmup & Spam Rescue
                                  </span>
                                </div>
                                <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded font-medium border border-gray-100">
                                  {account.trulyInboxConnected
                                    ? `Connected ${account.trulyInboxEmailAccountId ? `(#${account.trulyInboxEmailAccountId})` : ''}`
                                    : 'Not Connected'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mb-3">
                                Autonomous inbox rotation, spam folder rescue, and email reputation warming.
                              </p>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <div className="relative flex-1">
                                  <input
                                    className="w-full pl-3 pr-16 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-gray-900 font-mono focus:outline-hidden"
                                    placeholder={
                                      account.trulyInboxHasApiKey
                                        ? '•••••••••••••••• (Key Saved)'
                                        : 'Enter TrulyInbox API Key (e.g. ti_...)'
                                    }
                                    type={props.showTrulyInboxApiKeys[account.id] ? 'text' : 'password'}
                                    value={props.pendingTrulyInboxApiKeys[account.id] ?? ''}
                                    onChange={(e) =>
                                      props.setPendingTrulyInboxApiKeys((prev) => ({
                                        ...prev,
                                        [account.id]: e.target.value,
                                      }))
                                    }
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      props.setShowTrulyInboxApiKeys((prev) => ({
                                        ...prev,
                                        [account.id]: !prev[account.id],
                                      }))
                                    }
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#10B981] hover:text-emerald-700 cursor-pointer"
                                  >
                                    {props.showTrulyInboxApiKeys[account.id] ? 'HIDE' : 'SHOW'}
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  disabled={!!props.trulyInboxConnecting[account.id]}
                                  onClick={() => props.handleConnectTrulyInbox(account.id)}
                                  className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  {props.trulyInboxConnecting[account.id] ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      <span>Connecting...</span>
                                    </>
                                  ) : (
                                    <span>{account.trulyInboxConnected ? 'Update API Key' : 'Connect API Key'}</span>
                                  )}
                                </button>
                                {account.trulyInboxConnected && (
                                  <button
                                    type="button"
                                    disabled={!!props.trulyInboxStarting[account.id]}
                                    onClick={() => props.handleStartTrulyInboxWarmup(account.id)}
                                    className="px-4 py-2 bg-[#10B981] text-white text-sm font-medium rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors shrink-0 cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                                  >
                                    {props.trulyInboxStarting[account.id] ? (
                                      <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Starting...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Flame className="h-4 w-4" />
                                        <span>Start Truly Warmup</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Main Diagnostic Area */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            {/* Left/Center: Performance Stats */}
                            <div className="lg:col-span-2">
                              <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                                <Activity className="h-3.5 w-3.5" /> Performance & Health Diagnostics
                              </h5>
                              {/* Clean 3-column grid without boxes */}
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-8 gap-x-6">
                                <div className="flex flex-col gap-1">
                                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                    Warmup 7D
                                  </p>
                                  <p className="text-xl font-bold text-gray-900">
                                    {account.warmupStats7d?.successRate ?? 0}%{' '}
                                    <span className="text-sm font-medium text-gray-400">
                                      ({account.warmupStats7d?.sent ?? 0}/{account.warmupStats7d?.total ?? 0})
                                    </span>
                                  </p>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                    Campaign Sending
                                  </p>
                                  <p className="text-xl font-bold text-gray-900">
                                    {account.sentToday}/{account.dailyLimit}
                                  </p>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                    Warmup Sending
                                  </p>
                                  <p className="text-xl font-bold text-gray-900">
                                    {account.warmupSentToday}/{account.warmupDailyLimit}
                                  </p>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                    Warmup Replies
                                  </p>
                                  <p className="text-xl font-bold text-gray-900">
                                    {account.warmupRepliesToday}/{account.warmupReplyDailyLimit}
                                  </p>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <p
                                    className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 ${
                                      account.mailboxSyncStatus === 'error' ? 'text-red-500' : 'text-gray-400'
                                    }`}
                                  >
                                    {account.mailboxSyncStatus === 'error' && (
                                      <AlertTriangle className="h-3 w-3 text-red-500" />
                                    )}
                                    Mailbox Sync
                                  </p>
                                  <p
                                    className={`text-xl font-bold capitalize ${
                                      account.mailboxSyncStatus === 'error' ? 'text-red-600' : 'text-gray-900'
                                    }`}
                                  >
                                    {account.mailboxSyncStatus}
                                  </p>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <p className="text-[10px] font-semibold text-[#10B981] uppercase tracking-wider">
                                    Health Score
                                  </p>
                                  <p className="text-xl font-bold text-[#10B981]">
                                    {account.mailboxHealthScore}/100{' '}
                                    <span className="text-xs font-medium text-emerald-600/80">
                                      ({account.mailboxHealthStatus})
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Right: Limits & Operations */}
                            <div>
                              <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                                <Settings2 className="h-3.5 w-3.5" /> Limits & Operations
                              </h5>
                              <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                  <input
                                    className="w-16 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#10B981] text-center text-gray-900 font-mono focus:outline-hidden"
                                    type="number"
                                    min={1}
                                    max={500}
                                    value={props.pendingDailyLimits[account.id] ?? String(account.dailyLimit)}
                                    onChange={(e) =>
                                      props.setPendingDailyLimits((prev) => ({ ...prev, [account.id]: e.target.value }))
                                    }
                                  />
                                  <div
                                    onClick={() => props.handleUpdateMailDailyLimit(account.id)}
                                    className="flex-1 text-sm text-gray-500 hover:text-gray-800 cursor-pointer transition-colors select-none"
                                  >
                                    Save Daily Send Limit
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <input
                                    className="w-16 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#10B981] text-center text-gray-900 font-mono focus:outline-hidden"
                                    type="number"
                                    min={1}
                                    max={500}
                                    value={props.pendingWarmupLimits[account.id] ?? String(account.warmupDailyLimit)}
                                    onChange={(e) =>
                                      props.setPendingWarmupLimits((prev) => ({ ...prev, [account.id]: e.target.value }))
                                    }
                                  />
                                  <div
                                    onClick={() => props.handleUpdateMailWarmupLimit(account.id)}
                                    className="flex-1 text-sm text-gray-500 hover:text-gray-800 cursor-pointer transition-colors select-none"
                                  >
                                    Save Warmup Limit
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <input
                                    className="w-16 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#10B981] text-center text-gray-900 font-mono focus:outline-hidden"
                                    type="number"
                                    min={1}
                                    max={500}
                                    value={
                                      props.pendingWarmupReplyLimits[account.id] ??
                                      String(account.warmupReplyDailyLimit)
                                    }
                                    onChange={(e) =>
                                      props.setPendingWarmupReplyLimits((prev) => ({
                                        ...prev,
                                        [account.id]: e.target.value,
                                      }))
                                    }
                                  />
                                  <div
                                    onClick={() => props.handleUpdateMailWarmupReplyLimit(account.id)}
                                    className="flex-1 text-sm text-gray-500 hover:text-gray-800 cursor-pointer transition-colors select-none"
                                  >
                                    Save Reply Limit
                                  </div>
                                </div>

                                <hr className="border-gray-100 my-4" />

                                <select
                                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#10B981] text-gray-700 bg-white focus:outline-hidden"
                                  value={account.warmupStatus}
                                  onChange={(e) =>
                                    props.handleWarmupStatusChange(
                                      account.id,
                                      e.target.value as MailAccount['warmupStatus']
                                    )
                                  }
                                >
                                  <option value="COLD">Status: COLD</option>
                                  <option value="WARMING">Status: WARMING</option>
                                  <option value="PAUSED">Status: PAUSED</option>
                                  <option value="WARMED">Status: WARMED</option>
                                </select>

                                <select
                                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#10B981] text-gray-700 bg-white mt-3 focus:outline-hidden"
                                  value={account.warmupProviderPreference}
                                  onChange={(e) =>
                                    props.handleWarmupProviderPreferenceChange(
                                      account.id,
                                      e.target.value as MailAccount['warmupProviderPreference']
                                    )
                                  }
                                >
                                  <option value="random">Warmup partner: Random</option>
                                  <option value="gmail">Warmup partner: Gmail</option>
                                  <option value="zoho">Warmup partner: Zoho</option>
                                  <option value="outlook">Warmup partner: Outlook</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons Grouping */}
                          <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                            {/* Left: Primary Actions */}
                            <div className="flex items-center gap-3 justify-start flex-wrap">
                              <label
                                onClick={() =>
                                  props.handleWarmupAutoToggle(account.id, account.warmupAutoEnabled)
                                }
                                className="flex items-center cursor-pointer gap-2 bg-white border border-gray-200 pl-2 pr-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors shadow-2xs select-none"
                              >
                                <div className="relative">
                                  <div
                                    className={`w-8 h-4 rounded-full transition-colors ${
                                      account.warmupAutoEnabled ? 'bg-[#10B981]' : 'bg-gray-300'
                                    }`}
                                  />
                                  <div
                                    className={`dot absolute top-0.5 bg-white w-3 h-3 rounded-full transition-all ${
                                      account.warmupAutoEnabled ? 'left-4.5' : 'left-0.5'
                                    }`}
                                  />
                                </div>
                                <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                  <Flame
                                    className={`h-3.5 w-3.5 ${
                                      account.warmupAutoEnabled ? 'text-orange-500' : 'text-gray-400'
                                    }`}
                                  />
                                  <span>Warmup {account.warmupAutoEnabled ? 'ON' : 'OFF'}</span>
                                </span>
                              </label>

                              <button
                                type="button"
                                onClick={() =>
                                  props.handleToggleMailActive(account.id, account.isActive, account.warmupStatus)
                                }
                                className="px-4 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
                              >
                                <Power className="h-3.5 w-3.5" />
                                <span>{account.isActive ? 'Disable' : 'Enable'}</span>
                              </button>
                            </div>

                            {/* Center: Segmented Tabs */}
                            <div className="flex items-center justify-center">
                              <div className="flex items-center bg-gray-50 p-1 rounded-lg border border-gray-200 shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => props.handleOpenMailboxFolder(account.id, 'INBOX')}
                                  disabled={!account.mailboxSyncAvailable}
                                  className={`px-4 py-1.5 text-sm font-medium rounded flex items-center gap-2 transition-all cursor-pointer ${
                                    props.activeMailboxAccountId === account.id &&
                                    props.activeMailboxFolder === 'INBOX'
                                      ? 'text-gray-900 bg-white shadow-sm border border-gray-100 font-semibold'
                                      : 'text-gray-500 hover:text-gray-900'
                                  }`}
                                >
                                  <Inbox
                                    className={`h-3.5 w-3.5 ${
                                      props.activeMailboxAccountId === account.id &&
                                      props.activeMailboxFolder === 'INBOX'
                                        ? 'text-[#10B981]'
                                        : 'text-gray-400'
                                    }`}
                                  />
                                  <span>Inbox</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => props.handleOpenMailboxFolder(account.id, 'SPAM')}
                                  disabled={!account.mailboxSyncAvailable}
                                  className={`px-4 py-1.5 text-sm font-medium rounded flex items-center gap-2 transition-all cursor-pointer ${
                                    props.activeMailboxAccountId === account.id &&
                                    props.activeMailboxFolder === 'SPAM'
                                      ? 'text-gray-900 bg-white shadow-sm border border-gray-100 font-semibold'
                                      : 'text-gray-500 hover:text-gray-900'
                                  }`}
                                >
                                  <ShieldAlert
                                    className={`h-3.5 w-3.5 ${
                                      props.activeMailboxAccountId === account.id &&
                                      props.activeMailboxFolder === 'SPAM'
                                        ? 'text-amber-500'
                                        : 'text-gray-400'
                                    }`}
                                  />
                                  <span>Spam</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => props.handleOpenMailboxFolder(account.id, 'SENT')}
                                  disabled={!account.mailboxSyncAvailable}
                                  className={`px-4 py-1.5 text-sm font-medium rounded flex items-center gap-2 transition-all cursor-pointer ${
                                    props.activeMailboxAccountId === account.id &&
                                    props.activeMailboxFolder === 'SENT'
                                      ? 'text-gray-900 bg-white shadow-sm border border-gray-100 font-semibold'
                                      : 'text-gray-500 hover:text-gray-900'
                                  }`}
                                >
                                  <Send
                                    className={`h-3.5 w-3.5 ${
                                      props.activeMailboxAccountId === account.id &&
                                      props.activeMailboxFolder === 'SENT'
                                        ? 'text-blue-500'
                                        : 'text-gray-400'
                                    }`}
                                  />
                                  <span>Sent</span>
                                </button>

                                <div className="w-px h-4 bg-gray-300 mx-1" />

                                <button
                                  type="button"
                                  onClick={() => props.handleRunMailboxSyncNow(account.id)}
                                  disabled={!account.mailboxSyncAvailable}
                                  className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 rounded flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <RefreshCw className="h-3.5 w-3.5 text-gray-400" />
                                  <span>Sync Mailbox</span>
                                </button>
                              </div>
                            </div>

                            {/* Right: Destructive Action */}
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => props.handleDeleteMail(account.id, account.email)}
                                className="text-sm font-medium text-gray-400 hover:text-red-600 transition-colors flex items-center gap-2 focus:outline-hidden cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>

                          {/* Synced Mailbox Preview if open */}
                          {props.activeMailboxAccountId === account.id && (
                            <div className="mt-6 pt-5 border-t border-gray-100 space-y-3">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold uppercase tracking-wider text-gray-900">
                                  {props.activeMailboxFolder} Folder
                                </span>
                                <span className="text-gray-500">
                                  {props.mailboxLoading
                                    ? 'Loading messages...'
                                    : `${props.mailboxMessages.length} messages`}
                                </span>
                              </div>

                              <div className="space-y-2">
                                {props.mailboxMessages.length === 0 && !props.mailboxLoading ? (
                                  <div className="text-xs text-gray-400 italic py-2">
                                    No synced messages in this folder.
                                  </div>
                                ) : (
                                  props.mailboxMessages.map((message) => (
                                    <div
                                      key={message.id}
                                      className="p-3.5 rounded-xl bg-white border border-gray-100 shadow-2xs text-xs flex items-center justify-between gap-3"
                                    >
                                      <div className="min-w-0 flex-1">
                                        <div className="font-semibold text-gray-900 truncate">
                                          {message.subject || '(no subject)'}
                                        </div>
                                        <div className="text-[11px] text-gray-500 mt-0.5 truncate">
                                          From {message.fromEmail} •{' '}
                                          {message.receivedAt ? new Date(message.receivedAt).toLocaleDateString() : ''}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        {!message.isRead && (
                                          <button
                                            type="button"
                                            className="px-2.5 py-1 rounded-md border border-gray-200 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                                            onClick={() =>
                                              props.handleMailboxAction(account.id, message.id, 'mark-read')
                                            }
                                          >
                                            Mark read
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-3 flex flex-wrap items-center justify-between border-t border-gray-100 bg-white text-xs gap-3">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Rows:</span>
            <select
              value={currentLimit}
              onChange={(e) => props.setAccountsLimit(Number(e.target.value))}
              className="bg-transparent text-gray-900 font-semibold border-none focus:ring-0 cursor-pointer p-0 text-xs focus:outline-hidden"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-gray-400 ml-4 border-l border-gray-200 pl-4">
              {totalCount > 0
                ? `${(currentPage - 1) * currentLimit + 1}–${Math.min(currentPage * currentLimit, totalCount)} of ${totalCount}`
                : '0 of 0'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => props.setAccountsPage(1)}
              className="w-7 h-7 flex items-center justify-center rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => props.setAccountsPage(currentPage - 1)}
              className="w-7 h-7 flex items-center justify-center rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1 mx-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, idx, arr) => {
                  const showGap = idx > 0 && p - arr[idx - 1] > 1
                  return (
                    <span key={p} className="flex items-center gap-1">
                      {showGap && <span className="text-gray-400 px-0.5">...</span>}
                      <button
                        type="button"
                        onClick={() => props.setAccountsPage(p)}
                        className={`w-7 h-7 rounded text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
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
              className="w-7 h-7 flex items-center justify-center rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => props.setAccountsPage(totalPages)}
              className="w-7 h-7 flex items-center justify-center rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Action Button (Bottom Right) */}
      <div className="fixed bottom-8 right-8 z-30 flex flex-col items-end gap-2">
        {showFabMenu && (
          <div
            className="mb-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 flex flex-col gap-1 min-w-[190px] animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                setShowFabMenu(false)
                props.setActiveTab?.('add-zoho')
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors text-left cursor-pointer"
            >
              <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
                Z
              </span>
              <span>Add Zoho Mail</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowFabMenu(false)
                props.setActiveTab?.('add-gmail')
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors text-left cursor-pointer"
            >
              <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">
                G
              </span>
              <span>Add Gmail</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowFabMenu(false)
                props.setActiveTab?.('add-outlook')
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left cursor-pointer"
            >
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                O
              </span>
              <span>Add Outlook</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowFabMenu(false)
                props.setActiveTab?.('add-smtp-imap')
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors text-left cursor-pointer"
            >
              <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center font-bold text-xs">
                S
              </span>
              <span>Custom SMTP</span>
            </button>
          </div>
        )}

        <button
          type="button"
          aria-label="Add Mail Account"
          onClick={() => setShowFabMenu((prev) => !prev)}
          className="w-14 h-14 bg-red-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-red-600 transition-all hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-red-500/30 cursor-pointer active:scale-95"
        >
          <Plus
            className={`h-6 w-6 transition-transform duration-200 ${showFabMenu ? 'rotate-45' : ''}`}
          />
        </button>
      </div>

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
