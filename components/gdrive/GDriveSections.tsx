'use client'

import { useRef } from 'react'
import { FileUp, HardDrive, Plus, Power, RefreshCw, ShieldAlert, Trash2, X } from 'lucide-react'
import {
  MetricPair,
  panelStyle,
  ProgressBar,
  StatCard,
  surfaceCardStyle,
} from '@/components/mail-accounts/MailAccountsPrimitives'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { DriveAccount, DriveAsset, DriveSummary } from '@/components/gdrive/useGDriveDashboard'

function formatDate(value: string | null) {
  if (!value) return 'Never'
  return new Date(value).toLocaleString()
}

function formatBytes(bytes: number | null) {
  if (bytes === null || !Number.isFinite(bytes)) return ''
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`
}

export function GDriveHero(props: { summary: DriveSummary }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-1 mb-6">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#121316] bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-full border border-[#121316]/08 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-[#121316]" />
          <span>{props.summary.connected} Connected</span>
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#62605c] bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-full border border-[#121316]/08 shadow-sm">
          <span>{props.summary.totalDailyCapacity} Daily Cap</span>
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0f8a5f] bg-[#0f8a5f]/10 backdrop-blur-md px-3.5 py-2 rounded-full border border-[#0f8a5f]/20 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-[#0f8a5f] animate-pulse" />
          <span>{props.summary.orgSentToday} / {props.summary.orgDailyCap} Org Today</span>
        </span>
      </div>
    </div>
  )
}

export function GDriveExplainer() {
  return (
    <div className="uneevo-card p-6 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] mb-6 flex gap-4 items-start">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ee382b]/10 text-[#ee382b]">
        <ShieldAlert className="h-5 w-5" />
      </div>
      <div className="text-xs sm:text-sm text-[#62605c] leading-relaxed space-y-2">
        <div className="font-bold text-[#121316] text-sm">
          How GDrive Deliverability Works
        </div>
        <p>
          When a campaign runs, each connected Google account shares its selected Drive asset with the prospect
          and attaches your message as a share note. Google sends that note directly from{' '}
          <code className="bg-[#faf8f4] px-2 py-0.5 rounded-md border border-[#121316]/08 font-mono text-xs text-[#121316]">
            drive-shares-dm-noreply@google.com
          </code>
          , with prospect replies routed straight to your sender inbox.
        </p>
        <p>
          Google rate-limits bulk sharing to unlinked contacts. We recommend keeping daily volume under{' '}
          <strong className="text-[#121316] font-bold">50 sends per account/day</strong> for maximum domain longevity.
        </p>
      </div>
    </div>
  )
}

export function GDriveConnectPanel(props: { onConnect: () => void; hasAccounts: boolean }) {
  return (
    <div className="uneevo-card p-6 md:p-7 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] mb-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
      <div>
        <h3 className="zoho-puvi-headline text-base sm:text-lg font-bold text-[#121316]">
          {props.hasAccounts ? 'Connect Another Google Account' : 'Connect Your First Google Drive Account'}
        </h3>
        <p className="text-xs sm:text-sm text-[#62605c] mt-1">
          Grant scoped Drive access so OutreachOS can share selected assets and attach sequence notes.
        </p>
      </div>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full bg-[#ee382b] px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-[0_6px_20px_rgba(238,56,43,0.22)] transition-all hover:bg-[#d92b1f] hover:shadow-[0_10px_28px_rgba(238,56,43,0.32)] active:scale-95 cursor-pointer shrink-0"
        onClick={props.onConnect}
      >
        <Plus className="h-4 w-4" />
        <span>Connect Google Account</span>
      </button>
    </div>
  )
}

/**
 * Files this account has uploaded, and the control to add another.
 *
 * The app holds the `drive.file` scope, which only ever reaches files the app
 * itself created — so uploading here is what makes a file available to a
 * campaign. Nothing else in the user's Drive is visible to us.
 */
function GDriveAssetManager(props: {
  assets: DriveAsset[]
  disabled: boolean
  uploadProgress: number | undefined
  removingAsset: Record<string, boolean>
  onUpload: (file: File) => void
  onRemoveAsset: (assetId: string, name: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const uploading = props.uploadProgress !== undefined

  return (
    <div style={{ ...surfaceCardStyle, display: 'grid', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Files for campaigns ({props.assets.length})
        </div>
        <input
          ref={inputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) props.onUpload(file)
            // Reset so re-picking the same file fires onChange again.
            event.target.value = ''
          }}
        />
        <button
          type="button"
          className="btn-ghost"
          onClick={() => inputRef.current?.click()}
          disabled={props.disabled || uploading}
        >
          <FileUp size={14} aria-hidden="true" style={{ marginRight: '6px' }} />
          {uploading ? 'Uploading…' : 'Upload file'}
        </button>
      </div>

      {uploading ? (
        <div style={{ display: 'grid', gap: '6px' }}>
          <ProgressBar value={props.uploadProgress ?? 0} max={100} color="var(--accent)" />
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {props.uploadProgress}% uploaded to Google Drive
          </div>
        </div>
      ) : null}

      {props.assets.length === 0 && !uploading ? (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.55 }}>
          No files yet. Upload the video or document this account should share — you can add
          several and pick one per campaign.
        </div>
      ) : null}

      {props.assets.map((asset) => (
        <div
          key={asset.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            padding: '8px 10px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: '13px',
                color: 'var(--text-primary)',
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={asset.name}
            >
              {asset.name}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {[asset.mimeType, formatBytes(asset.sizeBytes)].filter(Boolean).join(' · ')}
            </div>
          </div>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => props.onRemoveAsset(asset.id, asset.name)}
            disabled={Boolean(props.removingAsset[asset.id])}
            title="Remove from the campaign file list (the file stays in your Drive)"
            style={{ color: 'var(--text-muted)', flexShrink: 0 }}
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  )
}

export function GDriveAccountCard(props: {
  account: DriveAccount
  assets: DriveAsset[]
  pendingDailyLimit: string
  onPendingDailyLimitChange: (value: string) => void
  onSaveDailyLimit: () => void
  savingDailyLimit: boolean
  onToggleActive: () => void
  onReconnect: () => void
  onDisconnect: () => void
  onUpload: (file: File) => void
  onRemoveAsset: (assetId: string, name: string) => void
  uploadProgress: number | undefined
  removingAsset: Record<string, boolean>
  deleting: boolean
}) {
  const { account } = props
  const needsReconnect = account.connectionStatus !== 'connected'
  const usageColor = account.sentToday >= account.dailyLimit ? 'var(--error)' : 'var(--success)'

  return (
    <div style={{ ...panelStyle, display: 'grid', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{account.email}</div>
        <StatusBadge status={needsReconnect ? 'error' : 'connected'} />
        {!account.isActive ? (
          <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
            Paused
          </span>
        ) : null}
      </div>

      {needsReconnect && account.connectionError ? (
        <div
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            background: 'rgba(239,68,68,0.1)',
            color: 'var(--error)',
            border: '1px solid rgba(239,68,68,0.2)',
          }}
        >
          {account.connectionError}
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px' }}>
        <MetricPair label="Sent today" value={`${account.sentToday} / ${account.dailyLimit}`} tone={usageColor} />
        <MetricPair label="Remaining" value={account.remainingToday} />
        <MetricPair label="Last share" value={formatDate(account.lastShareSentAt)} />
      </div>

      <ProgressBar value={account.sentToday} max={account.dailyLimit} color={usageColor} />

      <div style={{ ...surfaceCardStyle, display: 'grid', gap: '10px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Daily sending volume
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="number"
            min={1}
            max={200}
            value={props.pendingDailyLimit}
            onChange={(event) => props.onPendingDailyLimitChange(event.target.value)}
            className="input"
            style={{ width: '110px' }}
          />
          <button
            type="button"
            className="btn-ghost"
            onClick={props.onSaveDailyLimit}
            disabled={props.savingDailyLimit}
          >
            {props.savingDailyLimit ? 'Saving…' : 'Save'}
          </button>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            shares per day from this account (50 recommended)
          </span>
        </div>
      </div>

      <GDriveAssetManager
        assets={props.assets}
        disabled={needsReconnect}
        uploadProgress={props.uploadProgress}
        removingAsset={props.removingAsset}
        onUpload={props.onUpload}
        onRemoveAsset={props.onRemoveAsset}
      />

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {needsReconnect ? (
          <button type="button" className="btn-primary" onClick={props.onReconnect} style={{ borderRadius: '7px' }}>
            <RefreshCw size={14} aria-hidden="true" style={{ marginRight: '6px' }} />
            Reconnect
          </button>
        ) : null}
        <button type="button" className="btn-ghost" onClick={props.onToggleActive}>
          <Power size={14} aria-hidden="true" style={{ marginRight: '6px' }} />
          {account.isActive ? 'Pause' : 'Activate'}
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={props.onDisconnect}
          disabled={props.deleting}
          style={{ color: 'var(--error)' }}
        >
          <Trash2 size={14} aria-hidden="true" style={{ marginRight: '6px' }} />
          {props.deleting ? 'Removing…' : 'Disconnect'}
        </button>
      </div>
    </div>
  )
}

export function GDriveAccountsView(props: {
  loading: boolean
  accounts: DriveAccount[]
  assets: DriveAsset[]
  summary: DriveSummary
  pendingDailyLimits: Record<string, string>
  setPendingDailyLimits: React.Dispatch<React.SetStateAction<Record<string, string>>>
  savingDailyLimit: Record<string, boolean>
  deleting: Record<string, boolean>
  uploadProgress: Record<string, number>
  removingAsset: Record<string, boolean>
  onSaveDailyLimit: (id: string) => void
  onToggleActive: (id: string, current: boolean) => void
  onReconnect: () => void
  onDisconnect: (id: string, email: string) => void
  onUpload: (accountId: string, file: File) => void
  onRemoveAsset: (assetId: string, name: string) => void
}) {
  if (props.loading) {
    return <div style={{ ...panelStyle, color: 'var(--text-secondary)' }}>Loading Drive accounts…</div>
  }

  if (props.accounts.length === 0) {
    return (
      <div style={{ ...panelStyle, textAlign: 'center', padding: '40px 20px' }}>
        <HardDrive size={28} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} aria-hidden="true" />
        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
          No Drive accounts connected
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Connect a Google account above to start sending GDrive campaigns.
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: '18px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
        <StatCard value={props.summary.connected} label="Connected accounts" color="var(--success)" />
        <StatCard value={props.summary.totalDailyCapacity} label="Daily share capacity" color="var(--text-primary)" />
        <StatCard value={props.summary.sentToday} label="Shares sent today" color="var(--text-primary)" />
      </div>

      {props.accounts.map((account) => (
        <GDriveAccountCard
          key={account.id}
          account={account}
          assets={props.assets.filter((asset) => asset.driveAccountId === account.id)}
          pendingDailyLimit={props.pendingDailyLimits[account.id] ?? String(account.dailyLimit)}
          onPendingDailyLimitChange={(value) =>
            props.setPendingDailyLimits((prev) => ({ ...prev, [account.id]: value }))
          }
          onSaveDailyLimit={() => props.onSaveDailyLimit(account.id)}
          savingDailyLimit={Boolean(props.savingDailyLimit[account.id])}
          onToggleActive={() => props.onToggleActive(account.id, account.isActive)}
          onReconnect={props.onReconnect}
          onDisconnect={() => props.onDisconnect(account.id, account.email)}
          onUpload={(file) => props.onUpload(account.id, file)}
          onRemoveAsset={props.onRemoveAsset}
          uploadProgress={props.uploadProgress[account.id]}
          removingAsset={props.removingAsset}
          deleting={Boolean(props.deleting[account.id])}
        />
      ))}
    </div>
  )
}
