'use client'

import { Suspense, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import {
  AccountsView,
  AddGmailView,
  AddOutlookView,
  AddSmtpImapView,
  AddZohoView,
} from '@/components/mail-accounts/MailAccountsSections'
import { useMailAccountsDashboard } from '@/components/mail-accounts/useMailAccountsDashboard'

function MailAccountsPageContent() {
  const dashboard = useMailAccountsDashboard()

  // Handle ESC key to dismiss add form and return to accounts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dashboard.activeTab !== 'accounts') {
        dashboard.setActiveTab('accounts')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dashboard.activeTab, dashboard.setActiveTab])

  return (
    <div className="animate-fade-in space-y-4">
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
          }}
        >
          {dashboard.toast.msg}
        </div>
      ) : null}

      {/* When on add sub-view, show floating back navigation */}
      {dashboard.activeTab !== 'accounts' && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => dashboard.setActiveTab('accounts')}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#121316]/10 bg-white/90 backdrop-blur-md px-4 py-2 text-xs font-semibold text-[#121316] shadow-sm transition-all hover:bg-white hover:shadow-md active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to All Accounts</span>
          </button>
        </div>
      )}

      {dashboard.activeTab === 'accounts' ? (
        <AccountsView
          loading={dashboard.loading}
          accounts={dashboard.accounts}
          accountsPagination={dashboard.accountsPagination}
          setAccountsPage={dashboard.setAccountsPage}
          setAccountsLimit={dashboard.setAccountsLimit}
          pendingDailyLimits={dashboard.pendingDailyLimits}
          setPendingDailyLimits={dashboard.setPendingDailyLimits}
          pendingWarmupLimits={dashboard.pendingWarmupLimits}
          setPendingWarmupLimits={dashboard.setPendingWarmupLimits}
          pendingWarmupReplyLimits={dashboard.pendingWarmupReplyLimits}
          setPendingWarmupReplyLimits={dashboard.setPendingWarmupReplyLimits}
          pendingTrackingDomains={dashboard.pendingTrackingDomains}
          setPendingTrackingDomains={dashboard.setPendingTrackingDomains}
          pendingWarmupTimezones={dashboard.pendingWarmupTimezones}
          setPendingWarmupTimezones={dashboard.setPendingWarmupTimezones}
          pendingWarmupBusinessHoursStart={dashboard.pendingWarmupBusinessHoursStart}
          setPendingWarmupBusinessHoursStart={dashboard.setPendingWarmupBusinessHoursStart}
          pendingWarmupBusinessHoursEnd={dashboard.pendingWarmupBusinessHoursEnd}
          setPendingWarmupBusinessHoursEnd={dashboard.setPendingWarmupBusinessHoursEnd}
          pendingTrulyInboxApiKeys={dashboard.pendingTrulyInboxApiKeys}
          setPendingTrulyInboxApiKeys={dashboard.setPendingTrulyInboxApiKeys}
          showTrulyInboxApiKeys={dashboard.showTrulyInboxApiKeys}
          setShowTrulyInboxApiKeys={dashboard.setShowTrulyInboxApiKeys}
          trulyInboxConnecting={dashboard.trulyInboxConnecting}
          trulyInboxStarting={dashboard.trulyInboxStarting}
          handleWarmupStatusChange={dashboard.handleWarmupStatusChange}
          handleWarmupAutoToggle={dashboard.handleWarmupAutoToggle}
          handleUpdateMailDailyLimit={dashboard.handleUpdateMailDailyLimit}
          handleUpdateMailWarmupLimit={dashboard.handleUpdateMailWarmupLimit}
          handleUpdateMailWarmupReplyLimit={dashboard.handleUpdateMailWarmupReplyLimit}
          handleWarmupProviderPreferenceChange={dashboard.handleWarmupProviderPreferenceChange}
          handleUpdateTrackingDomain={dashboard.handleUpdateTrackingDomain}
          handleUpdateMailWarmupSchedule={dashboard.handleUpdateMailWarmupSchedule}
          handleReconnectGmail={dashboard.handleReconnectGmail}
          handleReconnectZohoApi={dashboard.handleReconnectZohoApi}
          handleConnectTrulyInbox={dashboard.handleConnectTrulyInbox}
          handleStartTrulyInboxWarmup={dashboard.handleStartTrulyInboxWarmup}
          handleUseZohoApi={dashboard.handleUseZohoApi}
          handleZohoImapToggle={dashboard.handleZohoImapToggle}
          handleOpenMailboxFolder={dashboard.handleOpenMailboxFolder}
          handleMailboxAction={dashboard.handleMailboxAction}
          activeMailboxAccountId={dashboard.activeMailboxAccountId}
          activeMailboxFolder={dashboard.activeMailboxFolder}
          mailboxMessages={dashboard.mailboxMessages}
          mailboxPagination={dashboard.mailboxPagination}
          mailboxLoading={dashboard.mailboxLoading}
          accountDetailsLoading={dashboard.accountDetailsLoading}
          loadMailAccountDetail={dashboard.loadMailAccountDetail}
          handleMailboxPageChange={dashboard.handleMailboxPageChange}
          handleMailboxLimitChange={dashboard.handleMailboxLimitChange}
          handleRunWarmupNow={dashboard.handleRunWarmupNow}
          handleRunMailboxSyncNow={dashboard.handleRunMailboxSyncNow}
          handleToggleMailActive={dashboard.handleToggleMailActive}
          handleDeleteMail={dashboard.handleDeleteMail}
          activeTab={dashboard.activeTab}
          setActiveTab={dashboard.setActiveTab}
        />
      ) : null}

      {dashboard.activeTab === 'add-zoho' ? (
        <AddZohoView
          onAdded={() => {
            void dashboard.loadAll()
            dashboard.setActiveTab('accounts')
            dashboard.showToast('success', 'Zoho mail account connected successfully')
          }}
          onClose={() => dashboard.setActiveTab('accounts')}
        />
      ) : null}

      {dashboard.activeTab === 'add-gmail' ? (
        <AddGmailView
          onAdded={() => {
            void dashboard.loadAll()
            dashboard.setActiveTab('accounts')
            dashboard.showToast('success', 'Gmail app-password setup saved')
          }}
          onClose={() => dashboard.setActiveTab('accounts')}
        />
      ) : null}

      {dashboard.activeTab === 'add-outlook' ? (
        <AddOutlookView
          onAdded={() => {
            void dashboard.loadAll()
            dashboard.setActiveTab('accounts')
            dashboard.showToast('success', 'Outlook mailbox setup saved')
          }}
          onClose={() => dashboard.setActiveTab('accounts')}
        />
      ) : null}

      {dashboard.activeTab === 'add-smtp-imap' ? (
        <AddSmtpImapView
          onAdded={() => {
            void dashboard.loadAll()
            dashboard.setActiveTab('accounts')
            dashboard.showToast('success', 'SMTP/IMAP mailbox setup saved')
          }}
          onClose={() => dashboard.setActiveTab('accounts')}
        />
      ) : null}
    </div>
  )
}

export default function MailAccountsPage() {
  return (
    <Suspense fallback={<div className="animate-fade-in py-12 text-center text-xs text-[#8a8780]">Loading...</div>}>
      <MailAccountsPageContent />
    </Suspense>
  )
}
