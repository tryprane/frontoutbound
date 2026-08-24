'use client'

import { useState } from 'react'
import {
  Activity,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  Flame,
  Inbox,
  KeyRound,
  Mail,
  Plus,
  Power,
  RefreshCw,
  Send,
  Settings2,
  ShieldAlert,
  Trash2,
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

export function MailAccountsHero(props: {
  activeTab: ActiveTab
  setActiveTab: (tab: ActiveTab) => void
  accountCount: number
  warmedCount: number
}) {
  const tabs: { key: ActiveTab; label: string }[] = [
    { key: 'accounts', label: 'All Accounts' },
    { key: 'add-zoho', label: 'Connect Zoho' },
    { key: 'add-gmail', label: 'Connect Gmail' },
    { key: 'add-outlook', label: 'Connect Outlook' },
    { key: 'add-smtp-imap', label: 'Custom SMTP/IMAP' },
  ]

  return (
    <div className="space-y-6 mb-6">
      <header className="uneevo-card p-6 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#121316] text-white shadow-xs">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase block mb-1">
              SENDER INFRASTRUCTURE
            </span>
            <h1 className="zoho-puvi-headline text-2xl sm:text-3xl font-bold tracking-tight text-[#121316]">
              Mail Accounts & Sender Pools
            </h1>
            <p className="text-xs sm:text-sm text-[#62605c] mt-0.5">
              Connection health, warmup rotation status, and deliverability limits.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-[#121316]/06 border border-[#121316]/08 px-4 py-2 rounded-full">
            <span className="font-mono text-base font-bold tabular-nums text-[#121316]">
              {props.accountCount}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#62605c]">
              Connected
            </span>
          </div>
          <div className="flex items-center gap-2.5 bg-[#0f8a5f]/10 border border-[#0f8a5f]/20 px-4 py-2 rounded-full">
            <span className="font-mono text-base font-bold tabular-nums text-[#0f8a5f]">
              {props.warmedCount}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0f8a5f]">
              Warmed
            </span>
          </div>
        </div>
      </header>

      <nav className="flex items-center gap-2 overflow-x-auto pb-1" aria-label="Mail account views">
        {tabs.map((tab) => {
          const isActive = props.activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => props.setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#121316] text-white shadow-xs'
                  : 'bg-white border border-[#121316]/12 text-[#121316] hover:bg-[#faf8f4]'
              }`}
            >
              {tab.key === 'accounts' ? <Mail className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
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
}) {
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null)

  return (
    <div style={{ display: 'grid', gap: '18px' }}>
      <div style={panelStyle}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>Email accounts</div>
        {props.loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading...</div>
        ) : props.accounts.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No email account connected.</div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {props.accountsPagination.total > 0 ? (
              <PaginationControls
                page={props.accountsPagination.page}
                pages={props.accountsPagination.pages}
                total={props.accountsPagination.total}
                limit={props.accountsPagination.limit}
                onPageChange={props.setAccountsPage}
                onLimitChange={props.setAccountsLimit}
                label="mailboxes"
              />
            ) : null}
            {props.accounts.map((account) => {
              const isExpanded = expandedAccountId === account.id
              const isDetailLoading = props.accountDetailsLoading[account.id] === true
              const provider = account.type === 'gmail'
                ? { label: 'Gmail', color: '#d94b3d' }
                : account.type === 'zoho'
                  ? { label: 'Zoho Mail', color: '#d97706' }
                  : account.type === 'outlook'
                    ? { label: 'Microsoft Outlook', color: '#1674d1' }
                    : { label: 'SMTP / IMAP', color: '#475569' }
              const connectionReady = account.connectionReady !== false
              const hasMicrosoftWarning = account.type === 'outlook' && Boolean(account.microsoftAuthError)
              const needsAttention = !connectionReady || account.mailboxSyncStatus === 'error' || hasMicrosoftWarning
              return (
              <article key={account.id} className={`mail-account-card${needsAttention ? ' needs-attention' : ''}`}>
                <button
                  type="button"
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
                  className="mail-account-summary"
                  aria-expanded={isExpanded}
                >
                  <div className="mail-account-identity">
                    <div className="mail-provider-mark" style={{ background: provider.color }}>
                      <Mail size={18} aria-hidden="true" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="mail-account-email">{account.email}</div>
                      <div className="mail-account-provider">{provider.label} · {account.displayName || account.email}</div>
                    </div>
                  </div>

                  <div className="mail-status-row">
                    <span className={`mail-status-pill ${connectionReady ? hasMicrosoftWarning ? 'warn' : 'good' : 'bad'}`}>
                      {connectionReady ? <CircleCheck size={13} aria-hidden="true" /> : <CircleAlert size={13} aria-hidden="true" />}
                      {connectionReady ? hasMicrosoftWarning ? 'Microsoft warning' : 'Connected' : 'Reconnect'}
                    </span>
                    <span className={`mail-status-pill ${account.mailboxSyncStatus === 'error' ? 'bad' : account.mailboxSyncStatus === 'syncing' ? 'warn' : 'good'}`}>
                      <RefreshCw size={13} aria-hidden="true" />
                      {account.mailboxSyncStatus === 'syncing' ? 'Syncing' : account.mailboxSyncStatus === 'error' ? 'Sync error' : 'Synced'}
                    </span>
                    <span className={`mail-status-pill ${account.isActive ? 'good' : ''}`}>
                      <Power size={13} aria-hidden="true" />
                      {account.isActive ? 'Sending enabled' : 'Sending off'}
                    </span>
                  </div>

                  <div className="mail-metric-row">
                    <div className="mail-metric"><strong>{account.sentToday}/{account.dailyLimit}</strong><span>Sent today</span></div>
                    <div className="mail-metric"><strong>{account.warmupSentToday}/{account.warmupDailyLimit}</strong><span>Warmup</span></div>
                    <div className="mail-metric"><strong>{account.mailboxHealthScore}/100</strong><span>Health</span></div>
                  </div>

                  <span className={`mail-summary-chevron${isExpanded ? ' open' : ''}`} aria-hidden="true">
                    <ChevronDown size={18} />
                  </span>
                </button>
                {isExpanded ? (
                <div className="mail-account-expanded grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]">
                  {!account.detailsLoaded ? (
                    <div style={{ gridColumn: '1 / -1', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {isDetailLoading ? 'Loading mailbox controls and health details...' : 'Loading mailbox controls...'}
                    </div>
                  ) : (
                    <>
                  <div className="mail-control-section">
                    <div className="mail-section-title"><Activity size={15} aria-hidden="true" /> Performance and health</div>
                    <AccountHeader
                      title={account.email}
                      providerLabel={account.type}
                      statusLabel={`${account.warmupStatus} • Stage ${account.warmupStage + 1}`}
                      secondaryStatus={account.type === 'zoho' && account.connectionReady === false ? 'Setup incomplete' : account.isActive ? 'Campaign active' : 'Campaign inactive'}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: '10px', marginTop: '14px' }}>
                      <MetricPair label="Warmup 7d" value={`${account.warmupStats7d?.successRate ?? 0}% (${account.warmupStats7d?.sent ?? 0}/${account.warmupStats7d?.total ?? 0})`} />
                      <MetricPair label="Campaign sending" value={`${account.sentToday}/${account.dailyLimit}`} />
                      <MetricPair label="Warmup sending" value={`${account.warmupSentToday}/${account.warmupDailyLimit} with target ${account.recommendedDailyLimit ?? account.warmupDailyLimit}`} />
                      <MetricPair label="Warmup replies" value={`${account.warmupRepliesToday}/${account.warmupReplyDailyLimit}`} />
                      <MetricPair label="Mailbox sync" value={<span><StatusBadge status={account.mailboxSyncStatus} /></span>} />
                      <MetricPair label="Mailbox health" value={`${account.mailboxHealthScore}/100 (${account.mailboxHealthStatus})`} tone={account.mailboxHealthScore > 65 ? 'var(--success)' : account.mailboxHealthScore > 0 ? 'var(--warning)' : 'var(--text-primary)'} />
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '12px', lineHeight: 1.7 }}>
                      Last mail: {account.lastMailSentAt ? new Date(account.lastMailSentAt).toLocaleString() : 'Never'}<br />
                      Last campaign send: {account.lastCampaignSentAt ? new Date(account.lastCampaignSentAt).toLocaleString() : 'Never'}<br />
                      Last warmup send: {account.lastWarmupSentAt ? new Date(account.lastWarmupSentAt).toLocaleString() : 'Never'}<br />
                      Last warmup reply: {account.lastWarmupReplyAt ? new Date(account.lastWarmupReplyAt).toLocaleString() : 'Never'}<br />
                      Warmup window: {account.warmupBusinessHoursStart || 'Workspace default'} - {account.warmupBusinessHoursEnd || 'Workspace default'} ({account.warmupTimezone || 'Workspace default'})<br />
                      Last sync: {account.mailboxLastSyncedAt ? new Date(account.mailboxLastSyncedAt).toLocaleString() : 'Never'}<br />
                      Started: {account.warmupStartedAt ? new Date(account.warmupStartedAt).toLocaleString() : 'Not started'} | Completed: {account.warmupCompletedAt ? new Date(account.warmupCompletedAt).toLocaleString() : 'Not completed'}
                    </div>
                    {account.type === 'zoho' ? (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                        Zoho setup: {account.zohoSetupStatus === 'complete' ? 'SMTP + OAuth connected' : account.zohoSetupStatus === 'pending_oauth' ? 'SMTP connected, OAuth pending' : account.zohoSetupStatus === 'pending_smtp' ? 'OAuth connected, SMTP pending' : 'SMTP + OAuth pending'}
                        {' | '}Active inbox mode: {account.mailboxConnectionMethod === 'api' ? 'Zoho API' : 'Zoho IMAP'}
                        {account.mailboxConnectionMethod === 'imap' ? ` | IMAP ${account.zohoImapEnabled === false ? 'OFF' : 'ON'}` : ''}
                        {account.trackingDomain ? ` | Tracker ${account.trackingDomain}` : ''}
                      </div>
                    ) : null}
                    {account.type === 'gmail' ? (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                        Gmail connection: {account.mailboxConnectionMethod === 'imap' ? 'IMAP + SMTP app password' : 'Google OAuth'}
                        {account.trackingDomain ? ` | Tracker ${account.trackingDomain}` : ' | Tracker global'}
                      </div>
                    ) : null}
                    {account.type === 'outlook' ? (
                      <div style={{ fontSize: '12px', color: account.connectionReady === false ? 'var(--warning)' : 'var(--text-secondary)', marginTop: '8px' }}>
                        Microsoft connection: {account.connectionReady === false ? 'Reconnect required' : 'Microsoft Graph OAuth'}
                        {account.microsoftTokenExpiry ? ` | Token refresh by ${new Date(account.microsoftTokenExpiry).toLocaleString()}` : ''}
                      </div>
                    ) : account.type === 'smtp_imap' ? (
                      <div style={{ fontSize: '12px', color: account.connectionReady === false ? 'var(--warning)' : 'var(--text-secondary)', marginTop: '8px' }}>
                        Mailbox connection: {account.connectionReady === false ? 'SMTP/IMAP incomplete' : 'Custom SMTP + IMAP'}
                        {account.trackingDomain ? ` | Tracker ${account.trackingDomain}` : ' | Tracker global'}
                      </div>
                    ) : null}
                    {account.type === 'outlook' && account.microsoftAuthError ? (
                      <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.22)', background: 'rgba(245,158,11,0.08)', color: 'var(--warning)', fontSize: '12px' }}>
                        Microsoft Graph: {account.microsoftAuthError}
                      </div>
                    ) : account.type === 'outlook' && account.connectionReady === false ? (
                      <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.22)', background: 'rgba(245,158,11,0.08)', color: 'var(--warning)', fontSize: '12px' }}>
                        Reconnect this mailbox with Microsoft OAuth before sending, syncing, warmup, or proxy use.
                      </div>
                    ) : null}
                    {account.type === 'zoho' && account.connectionReady === false ? (
                      <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.22)', background: 'rgba(245,158,11,0.08)', color: 'var(--warning)', fontSize: '12px' }}>
                        This mailbox is kept in one matched record, but campaign activation should wait until SMTP and OAuth are both attached to the same Zoho email.
                      </div>
                    ) : null}
                    {account.mailboxSyncError ? (
                      <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.18)', background: 'rgba(239,68,68,0.08)', color: 'var(--error)', fontSize: '12px' }}>
                        Sync error: {account.mailboxSyncError}
                      </div>
                    ) : null}
                    {account.warmupHealthSnapshots?.[0]?.notes ? (
                      <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {account.warmupHealthSnapshots[0]?.notes}
                      </div>
                    ) : null}

                    {account.proxyDetails ? (
                      <div
                        style={{
                          marginTop: '16px',
                          padding: '16px',
                          borderRadius: '14px',
                          background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(99,102,241,0.01))',
                          border: '1px solid rgba(99, 102, 241, 0.15)',
                          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.03)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
                          <span style={{ fontSize: '16px' }}>🔒</span> Mail Proxy Connection Details
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px', fontSize: '12px' }}>
                          <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                            <div style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>SMTP (Outgoing)</div>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{account.proxyDetails.smtpHost}:{account.proxyDetails.smtpPort}</div>
                            {account.proxyDetails.smtpSecurity ? (
                              <div style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>
                                Security: {account.proxyDetails.smtpSecurity}
                              </div>
                            ) : null}
                          </div>
                          <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                            <div style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>IMAP (Incoming)</div>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                              {account.proxyDetails.imapHost && account.proxyDetails.imapPort
                                ? `${account.proxyDetails.imapHost}:${account.proxyDetails.imapPort}`
                                : 'Unavailable'}
                            </div>
                            <div style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>
                              {account.proxyDetails.imapMode || 'unknown'}
                              {account.proxyDetails.imapSecurity ? ` | ${account.proxyDetails.imapSecurity}` : ''}
                            </div>
                          </div>
                          <div style={{ gridColumn: '1 / -1', background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                            <div style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>Proxy Credentials</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Username:</span>
                                <strong style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{account.proxyDetails.proxyUsername}</strong>
                              </div>
                              {account.proxyDetails.proxyPassword && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '2px', borderTop: '1px dashed var(--border)', paddingTop: '4px' }}>
                                  <span style={{ color: 'var(--text-secondary)' }}>Password:</span>
                                  <strong style={{ color: '#059669', wordBreak: 'break-all', fontFamily: 'monospace' }}>{account.proxyDetails.proxyPassword}</strong>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '10px', lineHeight: 1.5 }}>
                          💡 Connect your mail client/proxy client using these parameters. Authentication is permitted for any matched upstream provider configuration even if mailbox campaign/warmup states are inactive.
                        </div>
                      </div>
                    ) : null}

                    {account.trulyInboxVisibleToOrg ? (
                    <div
                      style={{
                        marginTop: '16px',
                        padding: '16px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(16,185,129,0.03))',
                        border: '1px solid rgba(34, 197, 94, 0.18)',
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                        TrulyInbox API
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        One TrulyInbox API key can be reused across multiple mailboxes. When connected, this mailbox is created in TrulyInbox using
                        `mail.prane.one`, SMTP `2525`, IMAP `1143`, no security layer, then TrulyInbox warmup is set to `13-15`
                        with `25%` reply rate. After success, this platform reduces internal warmup to `5-6`.
                      </div>
                      <div style={{ marginTop: '10px', fontSize: '12px', color: account.trulyInboxConnected ? 'var(--success)' : account.trulyInboxStatus === 'error' ? 'var(--error)' : 'var(--text-secondary)' }}>
                        Status: {account.trulyInboxConnected ? `Connected${account.trulyInboxEmailAccountId ? ` (#${account.trulyInboxEmailAccountId})` : ''}` : account.trulyInboxStatus || 'not connected'}
                      </div>
                      {account.trulyInboxHasApiKey ? (
                        <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                          API key saved. Enter a new key only if you want to replace it.
                        </div>
                      ) : null}
                      {account.trulyInboxConnectedAt ? (
                        <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                          Connected at {new Date(account.trulyInboxConnectedAt).toLocaleString()}
                        </div>
                      ) : null}
                      {account.trulyInboxLastError ? (
                        <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--error)' }}>
                          Last error: {account.trulyInboxLastError}
                        </div>
                      ) : null}
                      {!account.proxyDetails ? (
                        <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--warning)' }}>
                          Proxy credentials are not visible in this workspace yet, but you can still enter the API key here.
                          The backend will prepare the mailbox proxy automatically during connection.
                        </div>
                      ) : null}
                      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_88px_160px]" style={{ marginTop: '12px', minWidth: 0 }}>
                        <input
                          className="input-base"
                          type={props.showTrulyInboxApiKeys[account.id] ? 'text' : 'password'}
                          placeholder={account.trulyInboxHasApiKey ? 'Saved key hidden' : 'TrulyInbox API key'}
                          value={props.pendingTrulyInboxApiKeys[account.id] ?? ''}
                          onChange={(e) =>
                            props.setPendingTrulyInboxApiKeys((prev) => ({ ...prev, [account.id]: e.target.value }))
                          }
                          disabled={account.type === 'outlook' && account.connectionReady === false}
                        />
                        <button
                          className="btn-ghost"
                          type="button"
                          onClick={() =>
                            props.setShowTrulyInboxApiKeys((prev) => ({ ...prev, [account.id]: !prev[account.id] }))
                          }
                        >
                          {props.showTrulyInboxApiKeys[account.id] ? 'Hide' : 'Show'}
                        </button>
                        <button
                          className="btn-primary"
                          disabled={!!props.trulyInboxConnecting[account.id] || (account.type === 'outlook' && account.connectionReady === false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            justifyContent: 'center',
                            opacity: props.trulyInboxConnecting[account.id] ? 0.8 : 1,
                            cursor: props.trulyInboxConnecting[account.id] ? 'not-allowed' : 'pointer',
                          }}
                          onClick={() => props.handleConnectTrulyInbox(account.id)}
                        >
                          {props.trulyInboxConnecting[account.id] ? (
                            <>
                              <span style={{
                                width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.4)',
                                borderTopColor: '#fff', borderRadius: '50%',
                                display: 'inline-block', animation: 'spin 0.8s linear infinite'
                              }} />
                              Connecting…
                            </>
                          ) : account.trulyInboxConnected ? (
                            '✓ Connected — Reconnect'
                          ) : (
                            'Connect API'
                          )}
                        </button>
                      </div>
                      {/* Start Warmup button — appears right after TrulyInbox connection */}
                      {account.trulyInboxConnected && (
                        <div style={{ marginTop: '10px' }}>
                          {(account.trulyInboxStatus === 'active' || account.trulyInboxStatus === 'warming') ? (
                            <button
                              className="btn-primary"
                              disabled
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                opacity: 0.65, cursor: 'not-allowed',
                                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                              }}
                            >
                              <span style={{ fontSize: '14px' }}>✓</span> Warmup Active
                            </button>
                          ) : (
                            <button
                              className="btn-primary"
                              disabled={!!props.trulyInboxStarting[account.id] || (account.type === 'outlook' && account.connectionReady === false)}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                opacity: props.trulyInboxStarting[account.id] ? 0.8 : 1,
                                cursor: props.trulyInboxStarting[account.id] ? 'not-allowed' : 'pointer',
                                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                              }}
                              onClick={() => props.handleStartTrulyInboxWarmup(account.id)}
                            >
                              {props.trulyInboxStarting[account.id] ? (
                                <>
                                  <span style={{
                                    width: '12px', height: '12px',
                                    border: '2px solid rgba(255,255,255,0.4)',
                                    borderTopColor: '#fff', borderRadius: '50%',
                                    display: 'inline-block', animation: 'spin 0.8s linear infinite',
                                  }} />
                                  Starting…
                                </>
                              ) : (
                                <><span style={{ fontSize: '14px' }}>▶</span> Start Warmup</>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    ) : null}

                    <ProgressBar
                      value={account.warmupSentToday}
                      max={Math.max(account.recommendedDailyLimit ?? account.warmupDailyLimit, account.warmupDailyLimit)}
                      color={account.warmupStatus === 'WARMED' ? 'var(--success)' : 'var(--accent)'}
                    />
                  </div>
                  <div className="mail-control-section" style={{ display: 'grid', gap: '10px', alignContent: 'start' }}>
                    <div className="mail-section-title"><Settings2 size={15} aria-hidden="true" /> Limits and operations</div>
                    <div className="grid gap-2 sm:grid-cols-[92px_minmax(0,1fr)]">
                      <input
                        className="input-base"
                        type="number"
                        min={1}
                        max={500}
                        value={props.pendingDailyLimits[account.id] ?? String(account.dailyLimit)}
                        onChange={(e) => props.setPendingDailyLimits((prev) => ({ ...prev, [account.id]: e.target.value }))}
                      />
                      <button className="btn-ghost" onClick={() => props.handleUpdateMailDailyLimit(account.id)}>Save send</button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-[92px_minmax(0,1fr)]">
                      <input
                        className="input-base"
                        type="number"
                        min={1}
                        max={500}
                        value={props.pendingWarmupLimits[account.id] ?? String(account.warmupDailyLimit)}
                        onChange={(e) => props.setPendingWarmupLimits((prev) => ({ ...prev, [account.id]: e.target.value }))}
                      />
                      <button className="btn-ghost" onClick={() => props.handleUpdateMailWarmupLimit(account.id)}>Save warmup</button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-[92px_minmax(0,1fr)]">
                      <input
                        className="input-base"
                        type="number"
                        min={1}
                        max={500}
                        value={props.pendingWarmupReplyLimits[account.id] ?? String(account.warmupReplyDailyLimit)}
                        onChange={(e) =>
                          props.setPendingWarmupReplyLimits((prev) => ({ ...prev, [account.id]: e.target.value }))
                        }
                      />
                      <button className="btn-ghost" onClick={() => props.handleUpdateMailWarmupReplyLimit(account.id)}>Save replies</button>
                    </div>
                    {account.type === 'zoho' ? (
                      <div className="grid gap-2 sm:grid-cols-[92px_minmax(0,1fr)]">
                        <input
                          className="input-base"
                          type="text"
                          placeholder="track.example.com"
                          value={props.pendingTrackingDomains[account.id] ?? ''}
                          onChange={(e) => props.setPendingTrackingDomains((prev) => ({ ...prev, [account.id]: e.target.value }))}
                        />
                        <button className="btn-ghost" onClick={() => props.handleUpdateTrackingDomain(account.id)}>Save track</button>
                      </div>
                    ) : null}
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,1.2fr)_92px_92px_minmax(0,1fr)]">
                      <input
                        className="input-base"
                        type="text"
                        placeholder="Timezone override"
                        value={props.pendingWarmupTimezones[account.id] ?? ''}
                        onChange={(e) =>
                          props.setPendingWarmupTimezones((prev) => ({ ...prev, [account.id]: e.target.value }))
                        }
                      />
                      <input
                        className="input-base"
                        type="text"
                        placeholder="08:00"
                        value={props.pendingWarmupBusinessHoursStart[account.id] ?? ''}
                        onChange={(e) =>
                          props.setPendingWarmupBusinessHoursStart((prev) => ({
                            ...prev,
                            [account.id]: e.target.value,
                          }))
                        }
                      />
                      <input
                        className="input-base"
                        type="text"
                        placeholder="18:00"
                        value={props.pendingWarmupBusinessHoursEnd[account.id] ?? ''}
                        onChange={(e) =>
                          props.setPendingWarmupBusinessHoursEnd((prev) => ({
                            ...prev,
                            [account.id]: e.target.value,
                          }))
                        }
                      />
                      <button className="btn-ghost" onClick={() => props.handleUpdateMailWarmupSchedule(account.id)}>Save window</button>
                    </div>
                    <select className="input-base" disabled={account.type === 'outlook' && account.connectionReady === false} value={account.warmupStatus} onChange={(e) => props.handleWarmupStatusChange(account.id, e.target.value as MailAccount['warmupStatus'])}>
                      <option value="COLD">COLD</option>
                      <option value="WARMING">WARMING</option>
                      <option value="PAUSED">PAUSED</option>
                      <option value="WARMED">WARMED</option>
                    </select>
                    <select
                      className="input-base"
                      value={account.warmupProviderPreference}
                      onChange={(e) => props.handleWarmupProviderPreferenceChange(account.id, e.target.value as MailAccount['warmupProviderPreference'])}
                      disabled={account.type === 'outlook' && account.connectionReady === false}
                    >
                      <option value="random">Warmup partner: Random</option>
                      <option value="gmail">Warmup partner: Gmail</option>
                      <option value="zoho">Warmup partner: Zoho</option>
                      <option value="outlook">Warmup partner: Outlook</option>
                    </select>
                    <div className="mail-action-grid">
                      <button className="mail-action" disabled={account.type === 'outlook' && account.connectionReady === false} onClick={() => props.handleWarmupAutoToggle(account.id, account.warmupAutoEnabled)}>
                        <Flame size={15} aria-hidden="true" />
                        Warmup {account.warmupAutoEnabled ? 'ON' : 'OFF'}
                      </button>
                      {account.type === 'gmail' ? (
                        account.mailboxConnectionMethod !== 'imap' ? (
                        <button className="mail-action" onClick={props.handleReconnectGmail}><KeyRound size={15} aria-hidden="true" />Reconnect Gmail</button>
                        ) : null
                      ) : account.type === 'zoho' ? (
                        <>
                          {!account.zohoApiConnected ? (
                            <button className="mail-action" onClick={props.handleReconnectZohoApi}><KeyRound size={15} aria-hidden="true" />Connect Zoho API</button>
                          ) : account.mailboxConnectionMethod === 'api' ? (
                            <button className="mail-action" onClick={props.handleReconnectZohoApi}><KeyRound size={15} aria-hidden="true" />Reconnect Zoho</button>
                          ) : (
                            <button className="mail-action" onClick={() => props.handleUseZohoApi(account.id)}><RefreshCw size={15} aria-hidden="true" />Use Zoho API</button>
                          )}
                          {account.mailboxConnectionMethod === 'imap' ? (
                            <button className="mail-action" onClick={() => props.handleZohoImapToggle(account.id, account.zohoImapEnabled !== false)}>
                              <Power size={15} aria-hidden="true" />
                              IMAP {account.zohoImapEnabled === false ? 'OFF' : 'ON'}
                            </button>
                          ) : null}
                        </>
                      ) : account.type === 'outlook' ? (
                        <button className="mail-action" onClick={() => { window.location.href = '/api/mail-accounts/outlook' }}>
                          <KeyRound size={15} aria-hidden="true" />
                          {account.connectionReady === false ? 'Connect Microsoft OAuth' : 'Reconnect Microsoft OAuth'}
                        </button>
                      ) : null}
                      <button className="mail-action" onClick={() => props.handleOpenMailboxFolder(account.id, 'INBOX')} disabled={!account.mailboxSyncAvailable}><Inbox size={15} aria-hidden="true" />Inbox</button>
                      <button className="mail-action" onClick={() => props.handleOpenMailboxFolder(account.id, 'SPAM')} disabled={!account.mailboxSyncAvailable}><ShieldAlert size={15} aria-hidden="true" />Spam</button>
                      <button className="mail-action" onClick={() => props.handleOpenMailboxFolder(account.id, 'SENT')} disabled={!account.mailboxSyncAvailable}><Send size={15} aria-hidden="true" />Sent</button>
                      <button
                        className="mail-action"
                        onClick={() => props.handleRunWarmupNow(account.id)}
                        disabled={!['WARMING', 'WARMED'].includes(account.warmupStatus) || !account.warmupAutoEnabled || (account.type === 'outlook' && account.connectionReady === false)}
                      >
                        <Flame size={15} aria-hidden="true" />
                        Run warmup
                      </button>
                      <button className="mail-action" onClick={() => props.handleRunMailboxSyncNow(account.id)} disabled={!account.mailboxSyncAvailable}><RefreshCw size={15} aria-hidden="true" />Sync mailbox</button>
                      <button className={`mail-action${account.isActive ? '' : ' primary'}`} disabled={account.type === 'outlook' && account.connectionReady === false} onClick={() => props.handleToggleMailActive(account.id, account.isActive, account.warmupStatus)}>
                        <Power size={15} aria-hidden="true" />
                        {account.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button className="mail-action danger" onClick={() => props.handleDeleteMail(account.id, account.email)}><Trash2 size={15} aria-hidden="true" />Remove</button>
                    </div>
                  </div>
                    </>
                  )}
                </div>
                ) : null}
                {props.activeMailboxAccountId === account.id ? (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {props.activeMailboxFolder === 'SPAM' ? 'Spam folder' : props.activeMailboxFolder === 'SENT' ? 'Sent folder' : 'Inbox'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {props.mailboxLoading ? 'Loading messages...' : `${props.mailboxMessages.length} recent messages`}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {props.mailboxMessages.length === 0 && !props.mailboxLoading ? (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No synced messages in this folder yet.</div>
                      ) : null}
                      {props.mailboxMessages.map((message) => (
                        <div key={message.id} style={{ ...surfaceCardStyle, padding: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {message.subject || '(no subject)'}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                From {message.fromEmail || 'Unknown'} | To {message.toEmail || 'Unknown'}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                {message.receivedAt || message.sentAt ? new Date(message.receivedAt || message.sentAt || '').toLocaleString() : 'No timestamp'}
                              </div>
                              {message.snippet ? (
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>{message.snippet}</div>
                              ) : null}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignContent: 'start', justifyContent: 'flex-end' }}>
                              {!message.isRead ? (
                                <button className="btn-ghost" onClick={() => props.handleMailboxAction(account.id, message.id, 'mark-read')}>Mark read</button>
                              ) : null}
                              {message.isSpam ? (
                                <button className="btn-ghost" onClick={() => props.handleMailboxAction(account.id, message.id, 'rescue-to-inbox')}>Move to inbox</button>
                              ) : null}
                              {message.direction === 'inbound' ? (
                                <button className="btn-ghost" onClick={() => props.handleMailboxAction(account.id, message.id, 'reply')}>Reply</button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {props.mailboxPagination.total > 0 ? (
                      <div style={{ marginTop: '12px' }}>
                        <PaginationControls
                          page={props.mailboxPagination.page}
                          pages={props.mailboxPagination.pages}
                          total={props.mailboxPagination.total}
                          limit={props.mailboxPagination.limit}
                          onPageChange={props.handleMailboxPageChange}
                          onLimitChange={props.handleMailboxLimitChange}
                          label="messages"
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </article>
              )
            })}
          </div>
        )}
        {props.accountsPagination.total > 0 ? (
          <div style={{ marginTop: '14px' }}>
            <PaginationControls
              page={props.accountsPagination.page}
              pages={props.accountsPagination.pages}
              total={props.accountsPagination.total}
              limit={props.accountsPagination.limit}
              onPageChange={props.setAccountsPage}
              onLimitChange={props.setAccountsLimit}
              label="mailboxes"
            />
          </div>
        ) : null}
      </div>

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

function ZohoDualSetupPanel({ onBothConnected }: { onBothConnected: () => void }) {
  const [smtpDone, setSmtpDone] = useState(false)
  const [oauthDone, setOauthDone] = useState(false)
  const bothDone = smtpDone && oauthDone

  const stepPanelStyle = (done: boolean): React.CSSProperties => ({
    ...panelStyle,
    border: done
      ? '1.5px solid rgba(34,211,165,0.35)'
      : '1px solid rgba(255,255,255,0.08)',
    position: 'relative',
    transition: 'border-color 0.25s',
  })

  const badgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: '14px',
    right: '14px',
    padding: '3px 10px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.04em',
  }

  return (
    <div style={{ display: 'grid', gap: '18px' }}>
      {/* Step 1 — SMTP */}
      <div style={stepPanelStyle(smtpDone)}>
        {smtpDone ? (
          <div style={{ ...badgeStyle, background: 'rgba(34,211,165,0.14)', color: 'var(--success)' }}>
            ✓ Connected
          </div>
        ) : (
          <div style={{ ...badgeStyle, background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
            Step 1
          </div>
        )}
        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>SMTP — outbound sending</div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>
          Required for campaigns. Connects the Zoho mailbox as a sending account.
        </div>
        {smtpDone ? (
          <div style={{ fontSize: '13px', color: 'var(--success)' }}>SMTP credentials saved successfully.</div>
        ) : (
          <ZohoAccountForm
            onAccountAdded={() => setSmtpDone(true)}
          />
        )}
      </div>

      {/* Step 2 — OAuth */}
      <div style={stepPanelStyle(oauthDone)}>
        {oauthDone ? (
          <div style={{ ...badgeStyle, background: 'rgba(34,211,165,0.14)', color: 'var(--success)' }}>
            ✓ Connected
          </div>
        ) : (
          <div style={{ ...badgeStyle, background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
            Step 2
          </div>
        )}
        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Zoho OAuth — inbox sync & tools</div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>
          Unlocks inbox sync, spam rescue, and reply actions. Use the same email address as SMTP above — the app upgrades that same mailbox record automatically.
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            padding: '16px',
            border: '2px dashed rgba(255,255,255,0.1)',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(37,99,235,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#93c5fd',
              fontWeight: 800,
              fontSize: '20px',
              flexShrink: 0,
            }}
          >
            Z
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Connect Zoho OAuth</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              You will be redirected to Zoho to authorize access. When done, come back and this panel will update.
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
            <button
              className="btn-primary"
              onClick={() => { window.location.href = '/api/mail-accounts/zoho/connect' }}
            >
              Connect via OAuth
            </button>
            {!oauthDone && (
              <button
                className="btn-ghost"
                style={{ fontSize: '11px' }}
                onClick={() => setOauthDone(true)}
              >
                I already connected OAuth ✓
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Save button — only when both done */}
      {bothDone ? (
        <div
          style={{
            ...panelStyle,
            background: 'rgba(34,211,165,0.06)',
            border: '1.5px solid rgba(34,211,165,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--success)' }}>✓ Both connections ready</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              SMTP and OAuth are both attached. Click Save to finish and load the account into the dashboard.
            </div>
          </div>
          <button
            className="btn-primary"
            style={{ background: 'rgba(34,211,165,0.9)', color: '#000', minWidth: '160px' }}
            onClick={onBothConnected}
          >
            Save &amp; Connect Zoho Account
          </button>
        </div>
      ) : (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '6px 0' }}>
          Complete both steps above to enable the Save button.
        </div>
      )}
    </div>
  )
}

export function AddZohoView({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div style={{ display: 'grid', gap: '18px' }}>
        <div style={{ ...panelStyle, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Zoho mailboxes are tracked as one shared account record.
          Use the button below to open the setup modal, connect both SMTP and OAuth for the same email address, and save.
          The dashboard will only treat the mailbox as fully ready after both SMTP and OAuth are linked.
        </div>
        <div style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Connect new Zoho mail account</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.7 }}>
                First attach SMTP for sending or OAuth for inbox tools.
                Then complete the missing side using the same email address so the database keeps one matched mailbox record.
              </div>
            </div>
            <button className="btn-primary" onClick={() => setOpen(true)}>
              Connect new Zoho account
            </button>
          </div>
        </div>
      </div>

      {open ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 120,
            background: 'rgba(4,6,12,0.72)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              width: 'min(980px, 100%)',
              maxHeight: 'calc(100vh - 48px)',
              overflowY: 'auto',
              borderRadius: '24px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'linear-gradient(180deg, rgba(16,16,24,0.98), rgba(10,10,16,0.98))',
              boxShadow: '0 26px 80px rgba(0,0,0,0.4)',
              padding: '22px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>New Zoho mailbox setup</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.7, maxWidth: '760px' }}>
                  Connect <strong>both SMTP and OAuth</strong> for the same Zoho email address below.
                  Each step can be done in any order. The <strong>Save button</strong> appears only after both are connected.
                </div>
              </div>
              <button className="btn-ghost" onClick={() => setOpen(false)}>Close</button>
            </div>

            <ZohoDualSetupPanel
              onBothConnected={() => {
                onAdded()
                setOpen(false)
              }}
            />
          </div>
        </div>
      ) : null}
    </>
  )
}

export function AddGmailView({ onAdded }: { onAdded?: () => void }) {
  return (
    <div style={{ display: 'grid', gap: '18px' }}>
      <div style={panelStyle}>
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
          Connect Gmail with IMAP + SMTP app password
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
          Use this when you want to avoid repeated OAuth reconnects. If this Gmail already exists in the dashboard through OAuth, saving this form upgrades that same mailbox record to the IMAP + SMTP path.
        </div>
        <GmailImapSmtpForm onAccountAdded={onAdded} />
      </div>
    </div>
  )
}

export function AddOutlookView({ onAdded }: { onAdded?: () => void }) {
  return (
    <div style={panelStyle}>
      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
        Connect a Microsoft mailbox
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
        Microsoft OAuth replaces mailbox passwords and app passwords. Existing Outlook accounts are upgraded in place when the same email address reconnects.
      </div>
      <MicrosoftOAuthButton />
    </div>
  )
}

export function AddSmtpImapView({ onAdded }: { onAdded?: () => void }) {
  return (
    <div style={panelStyle}>
      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
        Connect any SMTP + IMAP mailbox
      </div>
      <ImapSmtpAccountForm
        providerLabel="SMTP/IMAP"
        endpoint="/api/mail-accounts/smtp-imap"
        description="Add any mailbox by entering its SMTP and IMAP settings manually. No ESP list is required; the connection test verifies both sending and inbox access before saving."
        passwordLabel="Mailbox password or app password"
        defaults={{ smtpHost: '', smtpPort: '587', smtpSecure: false, imapHost: '', imapPort: '993', imapSecure: true }}
        showUsernames
        saveLabel="Save SMTP/IMAP Mailbox"
        onAccountAdded={onAdded}
      />
    </div>
  )
}

