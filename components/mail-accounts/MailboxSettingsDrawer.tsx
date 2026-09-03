'use client'

import React, { useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Flame,
  Inbox,
  Loader2,
  Power,
  RefreshCw,
  Send,
  Settings2,
  ShieldAlert,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { MailboxAvatar, getMailboxProvider } from '@/components/mail-accounts/MailboxAvatar'
import type { MailAccount, MailboxMessage } from '@/components/mail-accounts/types'

export interface MailboxSettingsDrawerProps {
  account: MailAccount | null
  isOpen: boolean
  onClose: () => void
  isLoadingDetail?: boolean
  loadMailAccountDetail: (id: string) => void

  pendingDailyLimits: Record<string, string>
  setPendingDailyLimits: React.Dispatch<React.SetStateAction<Record<string, string>>>
  pendingWarmupLimits: Record<string, string>
  setPendingWarmupLimits: React.Dispatch<React.SetStateAction<Record<string, string>>>
  pendingWarmupReplyLimits: Record<string, string>
  setPendingWarmupReplyLimits: React.Dispatch<React.SetStateAction<Record<string, string>>>

  pendingTrulyInboxApiKeys: Record<string, string>
  setPendingTrulyInboxApiKeys: React.Dispatch<React.SetStateAction<Record<string, string>>>
  showTrulyInboxApiKeys: Record<string, boolean>
  setShowTrulyInboxApiKeys: React.Dispatch<React.SetStateAction<Record<string, boolean>>>

  trulyInboxConnecting: Record<string, boolean>
  trulyInboxStarting: Record<string, boolean>

  handleUpdateMailDailyLimit: (id: string) => void
  handleUpdateMailWarmupLimit: (id: string) => void
  handleUpdateMailWarmupReplyLimit: (id: string) => void
  handleWarmupStatusChange: (id: string, status: MailAccount['warmupStatus']) => void
  handleWarmupProviderPreferenceChange: (
    id: string,
    preference: MailAccount['warmupProviderPreference']
  ) => void
  handleWarmupAutoToggle: (id: string, current: boolean) => void
  handleToggleMailActive: (id: string, current: boolean, warmupStatus: MailAccount['warmupStatus']) => void
  handleConnectTrulyInbox: (id: string) => void
  handleStartTrulyInboxWarmup: (id: string) => void
  handleOpenMailboxFolder: (mailAccountId: string, folderKind: 'INBOX' | 'SPAM' | 'SENT') => void
  handleRunMailboxSyncNow: (id: string) => void
  handleDeleteMail: (id: string, email: string) => void
  handleMailboxAction: (
    mailAccountId: string,
    mailboxMessageId: string,
    action: 'mark-read' | 'rescue-to-inbox' | 'reply'
  ) => void

  activeMailboxAccountId: string | null
  activeMailboxFolder: 'INBOX' | 'SPAM' | 'SENT'
  mailboxMessages: MailboxMessage[]
  mailboxLoading: boolean
}

type DrawerTab = 'all' | 'limits' | 'trulyinbox' | 'diagnostics' | 'folders'

export function MailboxSettingsDrawer({
  account,
  isOpen,
  onClose,
  isLoadingDetail,
  loadMailAccountDetail,
  pendingDailyLimits,
  setPendingDailyLimits,
  pendingWarmupLimits,
  setPendingWarmupLimits,
  pendingWarmupReplyLimits,
  setPendingWarmupReplyLimits,
  pendingTrulyInboxApiKeys,
  setPendingTrulyInboxApiKeys,
  showTrulyInboxApiKeys,
  setShowTrulyInboxApiKeys,
  trulyInboxConnecting,
  trulyInboxStarting,
  handleUpdateMailDailyLimit,
  handleUpdateMailWarmupLimit,
  handleUpdateMailWarmupReplyLimit,
  handleWarmupStatusChange,
  handleWarmupProviderPreferenceChange,
  handleWarmupAutoToggle,
  handleToggleMailActive,
  handleConnectTrulyInbox,
  handleStartTrulyInboxWarmup,
  handleOpenMailboxFolder,
  handleRunMailboxSyncNow,
  handleDeleteMail,
  handleMailboxAction,
  activeMailboxAccountId,
  activeMailboxFolder,
  mailboxMessages,
  mailboxLoading,
}: MailboxSettingsDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>('all')
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Listen for Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent background body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      setConfirmDelete(false)
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen || !account) return null

  const providerType = getMailboxProvider(account)
  const providerLabel =
    providerType === 'gmail'
      ? 'Gmail'
      : providerType === 'zoho'
      ? 'Zoho Mail'
      : providerType === 'outlook'
      ? 'Outlook'
      : 'Custom SMTP'

  const copyEmailToClipboard = () => {
    if (!account.email) return
    navigator.clipboard.writeText(account.email)
    setCopiedEmail(true)
    setTimeout(() => setCopiedEmail(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Semi-transparent blur backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Panel */}
      <div className="relative w-full max-w-2xl bg-white shadow-2xl border-l border-gray-200 flex flex-col z-10 h-full overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Top Header */}
        <div className="p-6 border-b border-gray-100 bg-white shrink-0">
          <div className="flex items-start justify-between gap-4">
            {/* Account Info */}
            <div className="flex items-center gap-4 min-w-0">
              <MailboxAvatar account={account} size="lg" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-gray-900 truncate">
                    {account.email}
                  </h3>
                  <button
                    type="button"
                    onClick={copyEmailToClipboard}
                    className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
                    title="Copy Email"
                  >
                    {copiedEmail ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-gray-500">
                  <span className="font-semibold text-gray-700">{providerLabel}</span>
                  {account.displayName && (
                    <>
                      <span>•</span>
                      <span className="truncate">{account.displayName}</span>
                    </>
                  )}
                  <span>•</span>
                  <span
                    className={`inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full text-[10px] ${
                      account.isActive
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        account.isActive ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                    {account.isActive ? 'Active' : 'Disabled'}
                  </span>
                  {account.trulyInboxConnected && (
                    <span className="inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Sparkles className="h-2.5 w-2.5 text-emerald-600" />
                      TrulyInbox
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions & Close */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  handleToggleMailActive(account.id, account.isActive, account.warmupStatus)
                }
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs ${
                  account.isActive
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
                title={account.isActive ? 'Disable mailbox' : 'Enable mailbox'}
              >
                <Power className="h-3.5 w-3.5" />
                <span>{account.isActive ? 'Disable' : 'Enable'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                title="Close (ESC)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Section Filter Pills */}
          <div className="flex items-center gap-2 mt-5 overflow-x-auto pb-1 scrollbar-hide">
            {(
              [
                { id: 'all', label: 'All Settings' },
                { id: 'limits', label: 'Limits & Warmup' },
                { id: 'trulyinbox', label: 'TrulyInbox AI' },
                { id: 'folders', label: 'Mailbox Sync' },
                { id: 'diagnostics', label: 'Health' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-gray-900 text-white shadow-2xs'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {!account.detailsLoaded && isLoadingDetail ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#10B981]" />
              <p className="text-sm font-medium text-gray-600">
                Loading diagnostics and mailbox controls...
              </p>
            </div>
          ) : (
            <>
              {/* SECTION: TrulyInbox Integration Banner */}
              {(activeTab === 'all' || activeTab === 'trulyinbox') && (
                <div className="p-5 rounded-2xl border border-emerald-100 bg-linear-to-br from-emerald-50/50 via-white to-white shadow-xs">
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-[#10B981] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900 tracking-wide uppercase">
                            TrulyInbox Deliverability Engine
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-800 border border-green-200">
                            AI Warmup & Spam Rescue
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 bg-white px-2.5 py-1 rounded-full font-medium border border-gray-200 shadow-2xs">
                          {account.trulyInboxConnected
                            ? `Connected ${
                                account.trulyInboxEmailAccountId
                                  ? `(#${account.trulyInboxEmailAccountId})`
                                  : ''
                              }`
                            : 'Not Connected'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                        Autonomous inbox rotation, spam folder rescue, and email reputation warming to maximize delivery straight to primary inboxes.
                      </p>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <input
                            className="w-full pl-3 pr-16 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-gray-900 font-mono focus:outline-hidden bg-white"
                            placeholder={
                              account.trulyInboxHasApiKey
                                ? '•••••••••••••••• (Key Saved)'
                                : 'Enter TrulyInbox API Key (e.g. ti_...)'
                            }
                            type={showTrulyInboxApiKeys[account.id] ? 'text' : 'password'}
                            value={pendingTrulyInboxApiKeys[account.id] ?? ''}
                            onChange={(e) =>
                              setPendingTrulyInboxApiKeys((prev) => ({
                                ...prev,
                                [account.id]: e.target.value,
                              }))
                            }
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowTrulyInboxApiKeys((prev) => ({
                                ...prev,
                                [account.id]: !prev[account.id],
                              }))
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#10B981] hover:text-emerald-700 cursor-pointer"
                          >
                            {showTrulyInboxApiKeys[account.id] ? 'HIDE' : 'SHOW'}
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={!!trulyInboxConnecting[account.id]}
                          onClick={() => handleConnectTrulyInbox(account.id)}
                          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors shrink-0 cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          {trulyInboxConnecting[account.id] ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Connecting...</span>
                            </>
                          ) : (
                            <span>
                              {account.trulyInboxConnected ? 'Update API Key' : 'Connect API Key'}
                            </span>
                          )}
                        </button>

                        {account.trulyInboxConnected && (
                          <button
                            type="button"
                            disabled={!!trulyInboxStarting[account.id]}
                            onClick={() => handleStartTrulyInboxWarmup(account.id)}
                            className="px-4 py-2 bg-[#10B981] text-white text-sm font-medium rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors shrink-0 cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                          >
                            {trulyInboxStarting[account.id] ? (
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
                </div>
              )}

              {/* SECTION: Limits & Sending Configuration */}
              {(activeTab === 'all' || activeTab === 'limits') && (
                <div className="p-5 rounded-2xl border border-gray-200/80 bg-white shadow-xs">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-5 flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-gray-500" />
                    Sending & Warmup Limits
                  </h4>

                  <div className="space-y-4">
                    {/* Daily Send Limit */}
                    <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          Campaign Daily Limit
                        </div>
                        <div className="text-xs text-gray-500">
                          Maximum cold campaign outreach emails allowed per day
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          className="w-20 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#10B981] text-center text-gray-900 font-mono bg-white focus:outline-hidden"
                          type="number"
                          min={1}
                          max={500}
                          value={pendingDailyLimits[account.id] ?? String(account.dailyLimit)}
                          onChange={(e) =>
                            setPendingDailyLimits((prev) => ({
                              ...prev,
                              [account.id]: e.target.value,
                            }))
                          }
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateMailDailyLimit(account.id)}
                          className="px-3 py-1.5 bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shadow-2xs"
                        >
                          Save
                        </button>
                      </div>
                    </div>

                    {/* Warmup Daily Limit */}
                    <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          Warmup Daily Send Limit
                        </div>
                        <div className="text-xs text-gray-500">
                          Maximum peer warmup emails dispatched per 24 hours
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          className="w-20 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#10B981] text-center text-gray-900 font-mono bg-white focus:outline-hidden"
                          type="number"
                          min={1}
                          max={500}
                          value={
                            pendingWarmupLimits[account.id] ?? String(account.warmupDailyLimit)
                          }
                          onChange={(e) =>
                            setPendingWarmupLimits((prev) => ({
                              ...prev,
                              [account.id]: e.target.value,
                            }))
                          }
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateMailWarmupLimit(account.id)}
                          className="px-3 py-1.5 bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shadow-2xs"
                        >
                          Save
                        </button>
                      </div>
                    </div>

                    {/* Warmup Reply Limit */}
                    <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          Warmup Reply Daily Limit
                        </div>
                        <div className="text-xs text-gray-500">
                          Maximum automated replies generated for peer warming threads
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          className="w-20 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#10B981] text-center text-gray-900 font-mono bg-white focus:outline-hidden"
                          type="number"
                          min={1}
                          max={500}
                          value={
                            pendingWarmupReplyLimits[account.id] ??
                            String(account.warmupReplyDailyLimit)
                          }
                          onChange={(e) =>
                            setPendingWarmupReplyLimits((prev) => ({
                              ...prev,
                              [account.id]: e.target.value,
                            }))
                          }
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateMailWarmupReplyLimit(account.id)}
                          className="px-3 py-1.5 bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shadow-2xs"
                        >
                          Save
                        </button>
                      </div>
                    </div>

                    {/* Warmup Options & Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          Warmup Lifecycle Status
                        </label>
                        <select
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#10B981] text-gray-700 bg-white focus:outline-hidden"
                          value={account.warmupStatus}
                          onChange={(e) =>
                            handleWarmupStatusChange(
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
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          Warmup Partner Preference
                        </label>
                        <select
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#10B981] text-gray-700 bg-white focus:outline-hidden"
                          value={account.warmupProviderPreference}
                          onChange={(e) =>
                            handleWarmupProviderPreferenceChange(
                              account.id,
                              e.target.value as MailAccount['warmupProviderPreference']
                            )
                          }
                        >
                          <option value="random">Warmup Partner: Random</option>
                          <option value="gmail">Warmup Partner: Gmail</option>
                          <option value="zoho">Warmup Partner: Zoho</option>
                          <option value="outlook">Warmup Partner: Outlook</option>
                        </select>
                      </div>
                    </div>

                    {/* Master Warmup Toggle Switch */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame
                          className={`h-4 w-4 ${
                            account.warmupAutoEnabled ? 'text-orange-500' : 'text-gray-400'
                          }`}
                        />
                        <span className="text-sm font-semibold text-gray-800">
                          Automated Warmup System
                        </span>
                      </div>
                      <label
                        onClick={() =>
                          handleWarmupAutoToggle(account.id, account.warmupAutoEnabled)
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
                        <span className="text-xs font-bold text-gray-700">
                          {account.warmupAutoEnabled ? 'RUNNING' : 'PAUSED'}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: Performance & Health Diagnostics */}
              {(activeTab === 'all' || activeTab === 'diagnostics') && (
                <div className="p-5 rounded-2xl border border-gray-200/80 bg-white shadow-xs">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-5 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-gray-500" />
                    Performance & Health Diagnostics
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-4">
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Warmup 7D
                      </p>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        {account.warmupStats7d?.successRate ?? 0}%
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">
                        {account.warmupStats7d?.sent ?? 0}/{account.warmupStats7d?.total ?? 0} sent
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Campaign Sending
                      </p>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        {account.sentToday}/{account.dailyLimit}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">Dispatched today</p>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Warmup Sending
                      </p>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        {account.warmupSentToday}/{account.warmupDailyLimit}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">Warmup sent today</p>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Warmup Replies
                      </p>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        {account.warmupRepliesToday}/{account.warmupReplyDailyLimit}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">Replies today</p>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p
                        className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                          account.mailboxSyncStatus === 'error' ? 'text-red-500' : 'text-gray-400'
                        }`}
                      >
                        {account.mailboxSyncStatus === 'error' && (
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                        )}
                        Mailbox Sync
                      </p>
                      <p
                        className={`text-lg font-bold capitalize mt-1 ${
                          account.mailboxSyncStatus === 'error' ? 'text-red-600' : 'text-gray-900'
                        }`}
                      >
                        {account.mailboxSyncStatus}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">
                        {account.mailboxSyncAvailable ? 'Sync active' : 'Sync unavailable'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                        Health Score
                      </p>
                      <p className="text-lg font-bold text-emerald-700 mt-1">
                        {account.mailboxHealthScore}/100
                      </p>
                      <p className="text-xs text-emerald-600 font-semibold mt-0.5 capitalize">
                        {account.mailboxHealthStatus}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: Synced Mailbox Folders & Messages */}
              {(activeTab === 'all' || activeTab === 'folders') && (
                <div className="p-5 rounded-2xl border border-gray-200/80 bg-white shadow-xs">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <Inbox className="h-4 w-4 text-gray-500" />
                      Live Mailbox Sync
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleRunMailboxSyncNow(account.id)}
                      disabled={!account.mailboxSyncAvailable}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className="h-3.5 w-3.5 text-gray-500" />
                      <span>Sync Now</span>
                    </button>
                  </div>

                  {/* Folder Switcher */}
                  <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-200 shadow-2xs mb-4">
                    <button
                      type="button"
                      onClick={() => handleOpenMailboxFolder(account.id, 'INBOX')}
                      disabled={!account.mailboxSyncAvailable}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        activeMailboxAccountId === account.id && activeMailboxFolder === 'INBOX'
                          ? 'text-gray-900 bg-white shadow-sm border border-gray-100'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <Inbox
                        className={`h-3.5 w-3.5 ${
                          activeMailboxAccountId === account.id && activeMailboxFolder === 'INBOX'
                            ? 'text-[#10B981]'
                            : 'text-gray-400'
                        }`}
                      />
                      <span>Inbox</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenMailboxFolder(account.id, 'SPAM')}
                      disabled={!account.mailboxSyncAvailable}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        activeMailboxAccountId === account.id && activeMailboxFolder === 'SPAM'
                          ? 'text-gray-900 bg-white shadow-sm border border-gray-100'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <ShieldAlert
                        className={`h-3.5 w-3.5 ${
                          activeMailboxAccountId === account.id && activeMailboxFolder === 'SPAM'
                            ? 'text-amber-500'
                            : 'text-gray-400'
                        }`}
                      />
                      <span>Spam Rescue</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenMailboxFolder(account.id, 'SENT')}
                      disabled={!account.mailboxSyncAvailable}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        activeMailboxAccountId === account.id && activeMailboxFolder === 'SENT'
                          ? 'text-gray-900 bg-white shadow-sm border border-gray-100'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <Send
                        className={`h-3.5 w-3.5 ${
                          activeMailboxAccountId === account.id && activeMailboxFolder === 'SENT'
                            ? 'text-blue-500'
                            : 'text-gray-400'
                        }`}
                      />
                      <span>Sent</span>
                    </button>
                  </div>

                  {/* Folder Messages Feed */}
                  {activeMailboxAccountId === account.id ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                        <span className="font-semibold uppercase text-gray-700">
                          {activeMailboxFolder}
                        </span>
                        <span>
                          {mailboxLoading
                            ? 'Loading messages...'
                            : `${mailboxMessages.length} messages found`}
                        </span>
                      </div>

                      {mailboxMessages.length === 0 && !mailboxLoading ? (
                        <div className="text-xs text-gray-400 italic py-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                          No messages synced in this folder.
                        </div>
                      ) : (
                        mailboxMessages.map((message) => (
                          <div
                            key={message.id}
                            className="p-3 rounded-xl bg-gray-50/80 hover:bg-gray-100/80 border border-gray-100 shadow-2xs text-xs flex items-center justify-between gap-3 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-gray-900 truncate">
                                {message.subject || '(no subject)'}
                              </div>
                              <div className="text-[11px] text-gray-500 mt-0.5 truncate">
                                From {message.fromEmail} •{' '}
                                {message.receivedAt
                                  ? new Date(message.receivedAt).toLocaleDateString()
                                  : ''}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {!message.isRead && (
                                <button
                                  type="button"
                                  className="px-2.5 py-1 rounded-md bg-white border border-gray-200 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer shadow-2xs"
                                  onClick={() =>
                                    handleMailboxAction(account.id, message.id, 'mark-read')
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
                  ) : (
                    <div className="p-4 rounded-xl bg-gray-50 text-center text-xs text-gray-500 border border-dashed border-gray-200">
                      Click any folder tab above to load and preview synced messages.
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: Danger Zone (Remove Mailbox) */}
              <div className="p-5 rounded-2xl border border-red-100 bg-red-50/30">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h4 className="text-sm font-bold text-red-900">Disconnect & Remove Mailbox</h4>
                    <p className="text-xs text-red-700/80 mt-0.5">
                      Stops active campaigns, disconnects sync, and deletes credentials.
                    </p>
                  </div>

                  {!confirmDelete ? (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="px-4 py-2 bg-white text-red-600 border border-red-200 text-xs font-semibold rounded-lg hover:bg-red-50 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove Mailbox</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          handleDeleteMail(account.id, account.email)
                          onClose()
                        }}
                        className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors shadow-xs cursor-pointer"
                      >
                        Confirm Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="px-3 py-2 bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
