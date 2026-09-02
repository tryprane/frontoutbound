'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Activity,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CircleAlert,
  CircleCheck,
  CheckCircle2,
  AlertCircle,
  Flame,
  Inbox,
  KeyRound,
  Loader2,
  Mail,
  MoreVertical,
  Plus,
  Power,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldAlert,
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

// ── Health Circular Gauge Component ──────────────────────────────────────────
function HealthGauge({ score }: { score: number }) {
  const safeScore = Math.max(0, Math.min(100, score || 0))
  const strokeColor = safeScore >= 70 ? '#0f8a5f' : safeScore >= 40 ? '#d97706' : '#ee382b'

  return (
    <div className="flex items-center gap-1.5 justify-end">
      <div className="relative w-8 h-8 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke="#121316"
            strokeOpacity="0.08"
            strokeWidth="3"
          />
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke={strokeColor}
            strokeWidth="3"
            strokeDasharray={`${(safeScore * 94.2) / 100}, 100`}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <span className="absolute text-[10px] font-bold font-mono text-[#121316]">
          {safeScore}
        </span>
      </div>
      <span className="text-[11px] font-mono text-[#8a8780]">/100</span>
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

  // Escape key listener for TrulyInbox modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showTrulyInboxModal) {
        setShowTrulyInboxModal(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showTrulyInboxModal])

  const filteredAccounts = useMemo(() => {
    if (!searchQuery.trim()) return props.accounts
    const q = searchQuery.toLowerCase()
    return props.accounts.filter(
      (a) =>
        a.email.toLowerCase().includes(q) ||
        (a.displayName || '').toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q)
    )
  }, [props.accounts, searchQuery])

  const totalConnected = props.accounts.filter((a) => a.connectionReady !== false).length
  const totalWarmed = props.accounts.filter((a) => a.warmupStatus === 'WARMED').length
  const trulyInboxConnectedCount = props.accounts.filter((a) => a.trulyInboxConnected).length

  const currentPage = props.accountsPagination?.page || 1
  const totalPages = props.accountsPagination?.pages || 1
  const currentLimit = props.accountsPagination?.limit || 10
  const totalCount = props.accountsPagination?.total || props.accounts.length

  return (
    <div className="space-y-4">
      {/* Top Floating Status & Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/90 backdrop-blur-md rounded-full border border-[#121316]/08 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-[#0f8a5f]" />
            <span className="text-xs font-semibold text-[#121316]">
              {totalConnected} Connected
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/90 backdrop-blur-md rounded-full border border-[#ee382b]/15 shadow-sm">
            <Flame className="h-3.5 w-3.5 text-[#ee382b]" />
            <span className="text-xs font-semibold text-[#121316]">
              {totalWarmed} Warmed
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8780]" />
          <input
            type="text"
            placeholder="Search accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 bg-white/90 backdrop-blur-md border border-[#121316]/10 rounded-full text-xs text-[#121316] placeholder-[#8a8780] focus:outline-none focus:ring-1 focus:ring-[#ee382b] focus:border-[#ee382b] transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Connect Action Bar & Provider Filters */}
      <section className="flex flex-wrap items-center gap-2 w-full">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide flex-1">
          <button
            type="button"
            onClick={() => props.setActiveTab?.('accounts')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer shadow-sm ${
              !props.activeTab || props.activeTab === 'accounts'
                ? 'bg-[#121316] text-white shadow-xs'
                : 'bg-white/90 border border-[#121316]/10 text-[#121316] hover:bg-white hover:shadow-md'
            }`}
          >
            <span>All Accounts</span>
          </button>
          <button
            type="button"
            onClick={() => props.setActiveTab?.('add-zoho')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/90 border border-[#121316]/10 text-[#121316] rounded-full hover:bg-white hover:shadow-md transition-all shrink-0 cursor-pointer text-xs font-medium shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 text-[#d97706]" />
            <span>Zoho</span>
          </button>
          <button
            type="button"
            onClick={() => props.setActiveTab?.('add-gmail')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/90 border border-[#121316]/10 text-[#121316] rounded-full hover:bg-white hover:shadow-md transition-all shrink-0 cursor-pointer text-xs font-medium shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 text-[#ee382b]" />
            <span>Gmail</span>
          </button>
          <button
            type="button"
            onClick={() => props.setActiveTab?.('add-outlook')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/90 border border-[#121316]/10 text-[#121316] rounded-full hover:bg-white hover:shadow-md transition-all shrink-0 cursor-pointer text-xs font-medium shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 text-[#004ac6]" />
            <span>Outlook</span>
          </button>
          <button
            type="button"
            onClick={() => props.setActiveTab?.('add-smtp-imap')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/90 border border-[#121316]/10 text-[#121316] rounded-full hover:bg-white hover:shadow-md transition-all shrink-0 cursor-pointer text-xs font-medium shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 text-[#475569]" />
            <span>Custom SMTP</span>
          </button>
          <button
            type="button"
            onClick={() => setShowTrulyInboxModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#0f8a5f]/10 to-white border border-[#0f8a5f]/25 text-[#0f8a5f] rounded-full hover:shadow-md transition-all shrink-0 cursor-pointer text-xs font-semibold shadow-sm ml-auto"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#0f8a5f]" />
            <span>TrulyInbox AI {trulyInboxConnectedCount > 0 ? `(${trulyInboxConnectedCount})` : ''}</span>
          </button>
        </div>
      </section>

      {/* Main Data List Container */}
      <section className="uneevo-card rounded-[20px] shadow-sm border border-[#121316]/12 bg-white flex flex-col overflow-hidden">
        {/* Table Header */}
        <div className="px-4 py-3 flex items-center bg-[#faf8f4] border-b border-[#121316]/12 text-[11px] text-[#62605c] uppercase tracking-wider font-bold">
          <div className="w-8 shrink-0"></div>
          <div className="flex-1 min-w-[200px]">Account</div>
          <div className="w-28 shrink-0">Status</div>
          <div className="w-24 shrink-0 text-right pr-4">Sent</div>
          <div className="w-24 shrink-0 text-right pr-4">Warmup</div>
          <div className="w-32 shrink-0 text-right pr-2">Health</div>
          <div className="w-8 shrink-0"></div>
        </div>

        {/* Account Rows List */}
        <div className="flex flex-col w-full divide-y divide-[#121316]/08">
          {props.loading ? (
            <div className="px-4 py-12 text-center text-xs text-[#8a8780]">
              Loading mail accounts...
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="px-4 py-12 text-center text-xs text-[#8a8780] italic">
              {searchQuery ? 'No accounts match your search filter.' : 'No email accounts connected.'}
            </div>
          ) : (
            filteredAccounts.map((account) => {
              const isExpanded = expandedAccountId === account.id
              const isDetailLoading = props.accountDetailsLoading[account.id] === true
              const provider =
                account.type === 'gmail'
                  ? { label: 'Gmail', color: '#ee382b', bg: 'bg-[#ee382b]/10 text-[#ee382b] border-[#ee382b]/20' }
                  : account.type === 'zoho'
                  ? { label: 'Zoho Mail', color: '#d97706', bg: 'bg-[#d97706]/10 text-[#d97706] border-[#d97706]/20' }
                  : account.type === 'outlook'
                  ? { label: 'Outlook', color: '#004ac6', bg: 'bg-[#004ac6]/10 text-[#004ac6] border-[#004ac6]/20' }
                  : { label: 'Custom SMTP', color: '#475569', bg: 'bg-[#475569]/10 text-[#475569] border-[#475569]/20' }

              const connectionReady = account.connectionReady !== false
              const hasMicrosoftWarning = account.type === 'outlook' && Boolean(account.microsoftAuthError)
              const initialLetter = (account.displayName || account.email || 'M').charAt(0).toUpperCase()

              return (
                <article key={account.id} className="flex flex-col w-full">
                  {/* Compact Main Row */}
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
                    className={`px-4 py-3 flex items-center hover:bg-[#faf8f4]/60 transition-colors group cursor-pointer text-xs ${
                      isExpanded ? 'bg-[#faf8f4]/80' : ''
                    }`}
                  >
                    {/* Avatar Icon */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs mr-3 border ${provider.bg}`}
                    >
                      {initialLetter}
                    </div>

                    {/* Account Title & Subtitle */}
                    <div className="flex flex-col min-w-[200px] flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#121316] truncate text-xs sm:text-sm">
                          {account.email}
                        </span>
                        {account.trulyInboxConnected && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#0f8a5f]/10 text-[#0f8a5f] border border-[#0f8a5f]/20">
                            <Sparkles className="h-2.5 w-2.5" />
                            TrulyInbox
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#62605c] truncate mt-0.5">
                        {provider.label} · {account.displayName || account.email}
                      </span>
                    </div>

                    {/* Status Badges */}
                    <div className="flex flex-col gap-1 w-28 shrink-0">
                      <div className={`flex items-center gap-1.5 ${connectionReady ? 'text-[#0f8a5f]' : 'text-[#c2414c]'}`}>
                        {connectionReady ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <CircleAlert className="h-3.5 w-3.5" />
                        )}
                        <span className="text-[11px] font-semibold">
                          {connectionReady ? (hasMicrosoftWarning ? 'Warning' : 'Connected') : 'Reconnect'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#62605c]">
                        <RefreshCw className={`h-3 w-3 ${account.mailboxSyncStatus === 'syncing' ? 'animate-spin text-[#ee382b]' : ''}`} />
                        <span className="text-[11px]">
                          {account.mailboxSyncStatus === 'syncing' ? 'Syncing' : account.mailboxSyncStatus === 'error' ? 'Sync error' : 'Synced'}
                        </span>
                      </div>
                    </div>

                    {/* Sent Count */}
                    <div className="flex items-center justify-end w-24 shrink-0 pr-4 font-mono">
                      <span className="font-bold text-[#121316]">{account.sentToday}</span>
                      <span className="text-[#8a8780] text-[11px] ml-1">/{account.dailyLimit}</span>
                    </div>

                    {/* Warmup Count */}
                    <div className="flex items-center justify-end w-24 shrink-0 pr-4 font-mono">
                      <span className="font-bold text-[#121316]">{account.warmupSentToday}</span>
                      <span className="text-[#8a8780] text-[11px] ml-1">/{account.warmupDailyLimit}</span>
                    </div>

                    {/* Health Circular Gauge */}
                    <div className="flex flex-col items-end justify-center w-32 shrink-0 pr-2">
                      <HealthGauge score={account.mailboxHealthScore} />
                    </div>

                    {/* More Action Toggle Button */}
                    <button
                      type="button"
                      aria-label="More actions"
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[#8a8780] hover:text-[#121316] hover:bg-[#121316]/05 transition-all shrink-0 ml-2 cursor-pointer"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Expanded Mailbox Controls Drawer */}
                  {isExpanded && (
                    <div className="px-5 py-5 border-t border-[#121316]/08 bg-[#faf8f4]/40 animate-fade-in space-y-6">
                      {!account.detailsLoaded ? (
                        <div className="py-4 text-center text-xs text-[#8a8780]">
                          {isDetailLoading ? 'Loading mailbox controls and health diagnostics...' : 'Loading controls...'}
                        </div>
                      ) : (
                        <>
                          {/* TrulyInbox Deliverability Booster Section */}
                          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-white to-[#faf8f4] border border-[#0f8a5f]/20 shadow-2xs space-y-4">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0f8a5f] to-[#121316] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                                  <Sparkles className="h-4 w-4 text-emerald-300" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-[#121316] uppercase tracking-wider">
                                      TrulyInbox Deliverability Engine
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0f8a5f]/10 text-[#0f8a5f] border border-[#0f8a5f]/20">
                                      AI Warmup & Spam Rescue
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-[#62605c] mt-0.5">
                                    Autonomous inbox rotation, spam folder rescue, and email reputation warming.
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono border ${
                                    account.trulyInboxConnected
                                      ? 'bg-[#0f8a5f]/10 border-[#0f8a5f]/25 text-[#0f8a5f]'
                                      : 'bg-[#121316]/05 border-[#121316]/10 text-[#8a8780]'
                                  }`}
                                >
                                  {account.trulyInboxConnected ? (
                                    <>
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      <span>Connected {account.trulyInboxEmailAccountId ? `(#${account.trulyInboxEmailAccountId})` : ''}</span>
                                    </>
                                  ) : (
                                    <span>Not Connected</span>
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* API Key Input & Connection Actions */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              <div className="relative flex-1">
                                <input
                                  className="w-full pl-3.5 pr-16 py-2 rounded-xl border border-[#121316]/12 bg-white text-xs font-mono text-[#121316] placeholder-[#8a8780] focus:outline-none focus:ring-2 focus:ring-[#0f8a5f]/30 focus:border-[#0f8a5f] transition-all shadow-2xs"
                                  type={props.showTrulyInboxApiKeys[account.id] ? 'text' : 'password'}
                                  placeholder={account.trulyInboxHasApiKey ? '•••••••••••••••• (Key Saved)' : 'Enter TrulyInbox API Key (e.g. ti_...)'}
                                  value={props.pendingTrulyInboxApiKeys[account.id] ?? ''}
                                  onChange={(e) =>
                                    props.setPendingTrulyInboxApiKeys((prev) => ({ ...prev, [account.id]: e.target.value }))
                                  }
                                />
                                <button
                                  type="button"
                                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-bold text-[#62605c] hover:text-[#121316] rounded transition-colors cursor-pointer"
                                  onClick={() =>
                                    props.setShowTrulyInboxApiKeys((prev) => ({ ...prev, [account.id]: !prev[account.id] }))
                                  }
                                >
                                  {props.showTrulyInboxApiKeys[account.id] ? 'HIDE' : 'SHOW'}
                                </button>
                              </div>

                              <button
                                type="button"
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#121316] text-white text-xs font-semibold hover:bg-black disabled:opacity-50 transition-all shadow-2xs cursor-pointer shrink-0"
                                disabled={!!props.trulyInboxConnecting[account.id]}
                                onClick={() => props.handleConnectTrulyInbox(account.id)}
                              >
                                {props.trulyInboxConnecting[account.id] ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    <span>Connecting...</span>
                                  </>
                                ) : (
                                  <span>{account.trulyInboxConnected ? 'Update API Key' : 'Connect API Key'}</span>
                                )}
                              </button>

                              {account.trulyInboxConnected && (
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#0f8a5f] text-white text-xs font-bold hover:bg-[#0c7450] disabled:opacity-50 transition-all shadow-2xs cursor-pointer shrink-0"
                                  disabled={!!props.trulyInboxStarting[account.id]}
                                  onClick={() => props.handleStartTrulyInboxWarmup(account.id)}
                                >
                                  {props.trulyInboxStarting[account.id] ? (
                                    <>
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      <span>Starting...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Flame className="h-3.5 w-3.5" />
                                      <span>Start Truly Warmup</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>

                            {/* Status & Sync Details if Connected */}
                            {account.trulyInboxConnected && (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
                                <div className="p-2.5 rounded-lg bg-white border border-[#121316]/06">
                                  <span className="text-[#8a8780] block text-[10px] uppercase font-bold">Engine Status</span>
                                  <span className="font-semibold text-[#121316] capitalize">
                                    {account.trulyInboxStatus || 'Active & Syncing'}
                                  </span>
                                </div>
                                <div className="p-2.5 rounded-lg bg-white border border-[#121316]/06">
                                  <span className="text-[#8a8780] block text-[10px] uppercase font-bold">Last Synced</span>
                                  <span className="font-semibold text-[#121316]">
                                    {account.trulyInboxLastSyncedAt ? new Date(account.trulyInboxLastSyncedAt).toLocaleTimeString() : 'Recent'}
                                  </span>
                                </div>
                                <div className="p-2.5 rounded-lg bg-white border border-[#121316]/06 col-span-2 sm:col-span-1">
                                  <span className="text-[#8a8780] block text-[10px] uppercase font-bold">Deliverability Mode</span>
                                  <span className="font-semibold text-[#0f8a5f]">AI Placement Optimizer</span>
                                </div>
                              </div>
                            )}

                            {account.trulyInboxLastError && (
                              <div className="p-3 rounded-xl bg-[#c2414c]/08 border border-[#c2414c]/20 text-xs text-[#c2414c] flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>{account.trulyInboxLastError}</span>
                              </div>
                            )}
                          </div>

                          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]">
                            {/* Performance & Health Column */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#121316]">
                                <Activity className="h-4 w-4 text-[#ee382b]" />
                                <span>Performance & Health Diagnostics</span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div className="p-3.5 rounded-xl bg-white border border-[#121316]/08 shadow-2xs">
                                  <span className="text-[10px] uppercase font-bold text-[#8a8780] block mb-1">Warmup 7d</span>
                                  <span className="font-mono text-xs font-bold text-[#121316]">
                                    {account.warmupStats7d?.successRate ?? 0}% ({account.warmupStats7d?.sent ?? 0}/{account.warmupStats7d?.total ?? 0})
                                  </span>
                                </div>
                                <div className="p-3.5 rounded-xl bg-white border border-[#121316]/08 shadow-2xs">
                                  <span className="text-[10px] uppercase font-bold text-[#8a8780] block mb-1">Campaign Sending</span>
                                  <span className="font-mono text-xs font-bold text-[#121316]">
                                    {account.sentToday}/{account.dailyLimit}
                                  </span>
                                </div>
                                <div className="p-3.5 rounded-xl bg-white border border-[#121316]/08 shadow-2xs">
                                  <span className="text-[10px] uppercase font-bold text-[#8a8780] block mb-1">Warmup Sending</span>
                                  <span className="font-mono text-xs font-bold text-[#121316]">
                                    {account.warmupSentToday}/{account.warmupDailyLimit}
                                  </span>
                                </div>
                                <div className="p-3.5 rounded-xl bg-white border border-[#121316]/08 shadow-2xs">
                                  <span className="text-[10px] uppercase font-bold text-[#8a8780] block mb-1">Warmup Replies</span>
                                  <span className="font-mono text-xs font-bold text-[#121316]">
                                    {account.warmupRepliesToday}/{account.warmupReplyDailyLimit}
                                  </span>
                                </div>
                                <div className="p-3.5 rounded-xl bg-white border border-[#121316]/08 shadow-2xs">
                                  <span className="text-[10px] uppercase font-bold text-[#8a8780] block mb-1">Mailbox Sync</span>
                                  <span className="text-xs font-semibold text-[#121316] capitalize">
                                    {account.mailboxSyncStatus}
                                  </span>
                                </div>
                                <div className="p-3.5 rounded-xl bg-white border border-[#121316]/08 shadow-2xs">
                                  <span className="text-[10px] uppercase font-bold text-[#8a8780] block mb-1">Health Score</span>
                                  <span className={`font-mono text-xs font-bold ${account.mailboxHealthScore > 65 ? 'text-[#0f8a5f]' : 'text-[#d97706]'}`}>
                                    {account.mailboxHealthScore}/100 ({account.mailboxHealthStatus})
                                  </span>
                                </div>
                              </div>

                              {/* Action Buttons Grid */}
                              <div className="flex flex-wrap gap-2 pt-2">
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#121316]/10 bg-white text-xs font-semibold text-[#121316] hover:bg-[#faf8f4] shadow-2xs cursor-pointer"
                                  onClick={() => props.handleWarmupAutoToggle(account.id, account.warmupAutoEnabled)}
                                >
                                  <Flame className="h-3.5 w-3.5 text-[#ee382b]" />
                                  <span>Warmup {account.warmupAutoEnabled ? 'ON' : 'OFF'}</span>
                                </button>

                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#121316]/10 bg-white text-xs font-semibold text-[#121316] hover:bg-[#faf8f4] shadow-2xs cursor-pointer"
                                  onClick={() => props.handleOpenMailboxFolder(account.id, 'INBOX')}
                                  disabled={!account.mailboxSyncAvailable}
                                >
                                  <Inbox className="h-3.5 w-3.5" />
                                  <span>Inbox</span>
                                </button>

                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#121316]/10 bg-white text-xs font-semibold text-[#121316] hover:bg-[#faf8f4] shadow-2xs cursor-pointer"
                                  onClick={() => props.handleOpenMailboxFolder(account.id, 'SPAM')}
                                  disabled={!account.mailboxSyncAvailable}
                                >
                                  <ShieldAlert className="h-3.5 w-3.5" />
                                  <span>Spam</span>
                                </button>

                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#121316]/10 bg-white text-xs font-semibold text-[#121316] hover:bg-[#faf8f4] shadow-2xs cursor-pointer"
                                  onClick={() => props.handleOpenMailboxFolder(account.id, 'SENT')}
                                  disabled={!account.mailboxSyncAvailable}
                                >
                                  <Send className="h-3.5 w-3.5" />
                                  <span>Sent</span>
                                </button>

                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#121316]/10 bg-white text-xs font-semibold text-[#121316] hover:bg-[#faf8f4] shadow-2xs cursor-pointer"
                                  onClick={() => props.handleRunMailboxSyncNow(account.id)}
                                  disabled={!account.mailboxSyncAvailable}
                                >
                                  <RefreshCw className="h-3.5 w-3.5" />
                                  <span>Sync Mailbox</span>
                                </button>

                                <button
                                  type="button"
                                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-2xs cursor-pointer ${
                                    account.isActive
                                      ? 'bg-[#121316] text-white hover:bg-black'
                                      : 'border border-[#121316]/10 bg-white text-[#121316] hover:bg-[#faf8f4]'
                                  }`}
                                  onClick={() => props.handleToggleMailActive(account.id, account.isActive, account.warmupStatus)}
                                >
                                  <Power className="h-3.5 w-3.5" />
                                  <span>{account.isActive ? 'Disable' : 'Enable'}</span>
                                </button>

                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#c2414c]/20 bg-white text-xs font-semibold text-[#c2414c] hover:bg-[#c2414c]/08 shadow-2xs cursor-pointer ml-auto"
                                  onClick={() => props.handleDeleteMail(account.id, account.email)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Remove</span>
                                </button>
                              </div>
                            </div>

                            {/* Limits & Configuration Column */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#121316]">
                                <Settings2 className="h-4 w-4 text-[#ee382b]" />
                                <span>Limits & Operations</span>
                              </div>

                              <div className="space-y-2.5">
                                {/* Daily Send Limit */}
                                <div className="flex items-center gap-2">
                                  <input
                                    className="w-20 px-3 py-1.5 rounded-lg border border-[#121316]/10 text-xs font-mono"
                                    type="number"
                                    min={1}
                                    max={500}
                                    value={props.pendingDailyLimits[account.id] ?? String(account.dailyLimit)}
                                    onChange={(e) => props.setPendingDailyLimits((prev) => ({ ...prev, [account.id]: e.target.value }))}
                                  />
                                  <button
                                    type="button"
                                    className="flex-1 px-3 py-1.5 rounded-lg border border-[#121316]/10 bg-white text-xs font-semibold text-[#121316] hover:bg-[#faf8f4] cursor-pointer"
                                    onClick={() => props.handleUpdateMailDailyLimit(account.id)}
                                  >
                                    Save Daily Send Limit
                                  </button>
                                </div>

                                {/* Warmup Limit */}
                                <div className="flex items-center gap-2">
                                  <input
                                    className="w-20 px-3 py-1.5 rounded-lg border border-[#121316]/10 text-xs font-mono"
                                    type="number"
                                    min={1}
                                    max={500}
                                    value={props.pendingWarmupLimits[account.id] ?? String(account.warmupDailyLimit)}
                                    onChange={(e) => props.setPendingWarmupLimits((prev) => ({ ...prev, [account.id]: e.target.value }))}
                                  />
                                  <button
                                    type="button"
                                    className="flex-1 px-3 py-1.5 rounded-lg border border-[#121316]/10 bg-white text-xs font-semibold text-[#121316] hover:bg-[#faf8f4] cursor-pointer"
                                    onClick={() => props.handleUpdateMailWarmupLimit(account.id)}
                                  >
                                    Save Warmup Limit
                                  </button>
                                </div>

                                {/* Warmup Reply Limit */}
                                <div className="flex items-center gap-2">
                                  <input
                                    className="w-20 px-3 py-1.5 rounded-lg border border-[#121316]/10 text-xs font-mono"
                                    type="number"
                                    min={1}
                                    max={500}
                                    value={props.pendingWarmupReplyLimits[account.id] ?? String(account.warmupReplyDailyLimit)}
                                    onChange={(e) =>
                                      props.setPendingWarmupReplyLimits((prev) => ({ ...prev, [account.id]: e.target.value }))
                                    }
                                  />
                                  <button
                                    type="button"
                                    className="flex-1 px-3 py-1.5 rounded-lg border border-[#121316]/10 bg-white text-xs font-semibold text-[#121316] hover:bg-[#faf8f4] cursor-pointer"
                                    onClick={() => props.handleUpdateMailWarmupReplyLimit(account.id)}
                                  >
                                    Save Reply Limit
                                  </button>
                                </div>

                                {/* Warmup Status Select */}
                                <select
                                  className="w-full px-3 py-1.5 rounded-lg border border-[#121316]/10 bg-white text-xs font-medium text-[#121316]"
                                  value={account.warmupStatus}
                                  onChange={(e) => props.handleWarmupStatusChange(account.id, e.target.value as MailAccount['warmupStatus'])}
                                >
                                  <option value="COLD">Status: COLD</option>
                                  <option value="WARMING">Status: WARMING</option>
                                  <option value="PAUSED">Status: PAUSED</option>
                                  <option value="WARMED">Status: WARMED</option>
                                </select>

                                {/* Warmup Partner Select */}
                                <select
                                  className="w-full px-3 py-1.5 rounded-lg border border-[#121316]/10 bg-white text-xs font-medium text-[#121316]"
                                  value={account.warmupProviderPreference}
                                  onChange={(e) => props.handleWarmupProviderPreferenceChange(account.id, e.target.value as MailAccount['warmupProviderPreference'])}
                                >
                                  <option value="random">Warmup partner: Random</option>
                                  <option value="gmail">Warmup partner: Gmail</option>
                                  <option value="zoho">Warmup partner: Zoho</option>
                                  <option value="outlook">Warmup partner: Outlook</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Synced Mailbox Messages Preview if folder open */}
                      {props.activeMailboxAccountId === account.id && (
                        <div className="mt-6 pt-5 border-t border-[#121316]/08 space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold uppercase tracking-wider text-[#121316]">
                              {props.activeMailboxFolder} Folder
                            </span>
                            <span className="text-[#62605c]">
                              {props.mailboxLoading ? 'Loading messages...' : `${props.mailboxMessages.length} messages`}
                            </span>
                          </div>

                          <div className="space-y-2">
                            {props.mailboxMessages.length === 0 && !props.mailboxLoading ? (
                              <div className="text-xs text-[#8a8780] italic py-2">
                                No synced messages in this folder.
                              </div>
                            ) : (
                              props.mailboxMessages.map((message) => (
                                <div key={message.id} className="p-3 rounded-xl bg-white border border-[#121316]/08 text-xs flex items-center justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-[#121316] truncate">
                                      {message.subject || '(no subject)'}
                                    </div>
                                    <div className="text-[11px] text-[#62605c] mt-0.5 truncate">
                                      From {message.fromEmail} • {message.receivedAt ? new Date(message.receivedAt).toLocaleDateString() : ''}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {!message.isRead && (
                                      <button
                                        type="button"
                                        className="px-2.5 py-1 rounded-md border border-[#121316]/10 text-[11px] font-semibold text-[#121316] hover:bg-[#faf8f4]"
                                        onClick={() => props.handleMailboxAction(account.id, message.id, 'mark-read')}
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
                    </div>
                  )}
                </article>
              )
            })
          )}
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-2.5 flex flex-wrap items-center justify-between border-t border-[#121316]/12 bg-white text-xs gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[#62605c]">Rows:</span>
            <select
              value={currentLimit}
              onChange={(e) => props.setAccountsLimit(Number(e.target.value))}
              className="bg-transparent text-[#121316] font-semibold border-none focus:ring-0 cursor-pointer p-0 text-xs"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-[#8a8780] ml-4 border-l border-[#121316]/15 pl-4">
              {totalCount > 0 ? `${(currentPage - 1) * currentLimit + 1}–${Math.min(currentPage * currentLimit, totalCount)} of ${totalCount}` : '0 of 0'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => props.setAccountsPage(1)}
              className="w-7 h-7 flex items-center justify-center rounded text-[#62605c] hover:bg-[#faf8f4] disabled:opacity-40 cursor-pointer"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => props.setAccountsPage(currentPage - 1)}
              className="w-7 h-7 flex items-center justify-center rounded text-[#62605c] hover:bg-[#faf8f4] disabled:opacity-40 cursor-pointer"
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
                      {showGap && <span className="text-[#8a8780] px-0.5">...</span>}
                      <button
                        type="button"
                        onClick={() => props.setAccountsPage(p)}
                        className={`w-7 h-7 rounded text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                          p === currentPage
                            ? 'bg-[#121316] text-white shadow-2xs'
                            : 'text-[#121316] hover:bg-[#faf8f4]'
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
              className="w-7 h-7 flex items-center justify-center rounded text-[#62605c] hover:bg-[#faf8f4] disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => props.setAccountsPage(totalPages)}
              className="w-7 h-7 flex items-center justify-center rounded text-[#62605c] hover:bg-[#faf8f4] disabled:opacity-40 cursor-pointer"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* TrulyInbox Deliverability Partner Overview Modal */}
      {showTrulyInboxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#121316]/40 backdrop-blur-xs animate-fade-in">
          <div
            className="w-full max-w-2xl bg-white rounded-[24px] border border-[#121316]/12 shadow-2xl p-6 sm:p-8 space-y-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0f8a5f] to-[#121316] text-white flex items-center justify-center font-bold shadow-sm">
                  <Sparkles className="h-6 w-6 text-emerald-300" />
                </div>
                <div>
                  <span className="text-[11px] font-bold tracking-widest text-[#0f8a5f] uppercase block">
                    DELIVERABILITY ACCELERATOR
                  </span>
                  <h3 className="text-xl font-bold text-[#121316]">
                    TrulyInbox AI Warmup & Deliverability
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowTrulyInboxModal(false)}
                className="p-2 rounded-full text-[#8a8780] hover:text-[#121316] hover:bg-[#121316]/05 transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-[#faf8f4] border border-[#121316]/06 space-y-1">
                <span className="text-xs font-bold text-[#121316] block">AI Warmup Pool</span>
                <p className="text-[11px] text-[#62605c] leading-relaxed">
                  Simulates human conversations across real business domains.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#faf8f4] border border-[#121316]/06 space-y-1">
                <span className="text-xs font-bold text-[#121316] block">Spam Folder Rescue</span>
                <p className="text-[11px] text-[#62605c] leading-relaxed">
                  Automatically rescues warm messages and marks them important.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#faf8f4] border border-[#121316]/06 space-y-1">
                <span className="text-xs font-bold text-[#121316] block">Domain Reputation</span>
                <p className="text-[11px] text-[#62605c] leading-relaxed">
                  Maintains a 95%+ sender reputation for maximum deliverability.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0f8a5f]/06 border border-[#0f8a5f]/20 space-y-2">
              <span className="text-xs font-bold text-[#121316] block">How to enable on your accounts:</span>
              <ol className="list-decimal list-inside text-xs text-[#62605c] space-y-1">
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
                className="text-xs font-bold text-[#0f8a5f] hover:underline inline-flex items-center gap-1"
              >
                <span>Get TrulyInbox API Key</span>
                <span>↗</span>
              </a>

              <button
                type="button"
                onClick={() => setShowTrulyInboxModal(false)}
                className="px-6 py-2.5 rounded-full bg-[#121316] text-white text-xs font-bold hover:bg-black transition-all cursor-pointer shadow-sm"
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

  const handleConnectOAuth = () => {
    setConnectingOAuth(true)
    window.location.href = '/api/mail-accounts/zoho/connect'
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

        <div className="p-4 sm:p-5 rounded-xl border border-[#2563eb]/15 bg-white flex items-center justify-between gap-4 flex-wrap shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-xs">
              Z
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-[#121316]">Authorize via Zoho OAuth</div>
              <div className="text-[11px] sm:text-xs text-[#62605c] mt-0.5">
                Redirects to Zoho to authorize account permissions.
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
