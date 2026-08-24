'use client'

import {
  GDriveAccountsView,
  GDriveConnectPanel,
  GDriveExplainer,
  GDriveHero,
} from '@/components/gdrive/GDriveSections'
import { useGDriveDashboard } from '@/components/gdrive/useGDriveDashboard'

export function GDriveWorkspace() {
  const dashboard = useGDriveDashboard()

  return (
    <div className="animate-fade-in">
      {dashboard.toast ? (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 99,
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            border: '1px solid rgba(255,255,255,0.08)',
            background: dashboard.toast.type === 'success' ? 'rgba(34,211,165,0.15)' : 'rgba(239,68,68,0.15)',
            color: dashboard.toast.type === 'success' ? 'var(--success)' : 'var(--error)',
            boxShadow: '0 18px 40px rgba(0,0,0,0.25)',
            maxWidth: '420px',
          }}
        >
          {dashboard.toast.msg}
        </div>
      ) : null}

      <GDriveHero summary={dashboard.summary} />

      <GDriveExplainer />

      <GDriveConnectPanel onConnect={dashboard.handleConnect} hasAccounts={dashboard.accounts.length > 0} />

      <GDriveAccountsView
        loading={dashboard.loading}
        accounts={dashboard.accounts}
        assets={dashboard.assets}
        summary={dashboard.summary}
        pendingDailyLimits={dashboard.pendingDailyLimits}
        setPendingDailyLimits={dashboard.setPendingDailyLimits}
        savingDailyLimit={dashboard.savingDailyLimit}
        deleting={dashboard.deleting}
        uploadProgress={dashboard.uploadProgress}
        removingAsset={dashboard.removingAsset}
        onSaveDailyLimit={(id) => void dashboard.handleUpdateDailyLimit(id)}
        onToggleActive={(id, current) => void dashboard.handleToggleActive(id, current)}
        onReconnect={dashboard.handleReconnect}
        onDisconnect={(id, email) => void dashboard.handleDisconnect(id, email)}
        onUpload={(accountId, file) => void dashboard.handleUpload(accountId, file)}
        onRemoveAsset={(assetId, name) => void dashboard.handleRemoveAsset(assetId, name)}
      />
    </div>
  )
}
