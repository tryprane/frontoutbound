'use client'

import { Suspense } from 'react'
import {
  AccountsView,
  AddGmailView,
  AddOutlookView,
  AddSmtpImapView,
  AddZohoView,
  MailAccountsHero,
} from '@/components/mail-accounts/MailAccountsSections'
import { useMailAccountsDashboard } from '@/components/mail-accounts/useMailAccountsDashboard'

function MailAccountsPageContent() {
  const dashboard = useMailAccountsDashboard()

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
          }}
        >
          {dashboard.toast.msg}
        </div>
      ) : null}

      <MailAccountsHero
        activeTab={dashboard.activeTab}
        setActiveTab={dashboard.setActiveTab}
        accountCount={dashboard.accounts.length}
        warmedCount={dashboard.warmedAccounts.length}
      />

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
        />
      ) : null}

      {dashboard.activeTab === 'add-zoho' ? (
        <AddZohoView
          onAdded={() => {
            void dashboard.loadAll()
            dashboard.showToast('success', 'Zoho setup step saved')
          }}
        />
      ) : null}

      {dashboard.activeTab === 'add-gmail' ? (
        <AddGmailView
          onAdded={() => {
            void dashboard.loadAll()
            dashboard.showToast('success', 'Gmail app-password setup saved')
          }}
        />
      ) : null}

      {dashboard.activeTab === 'add-outlook' ? (
        <AddOutlookView
          onAdded={() => {
            void dashboard.loadAll()
            dashboard.showToast('success', 'Outlook mailbox setup saved')
          }}
        />
      ) : null}

      {dashboard.activeTab === 'add-smtp-imap' ? (
        <AddSmtpImapView
          onAdded={() => {
            void dashboard.loadAll()
            dashboard.showToast('success', 'SMTP/IMAP mailbox setup saved')
          }}
        />
      ) : null}
    </div>
  )
}

export default function MailAccountsPage() {
  return (
    <Suspense fallback={<div className="animate-fade-in">Loading...</div>}>
      <MailAccountsPageContent />
    </Suspense>
  )
}
