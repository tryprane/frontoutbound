'use client'

import { useState } from 'react'
import {
  AtSign,
  ShieldCheck,
  Flame,
  HardDrive,
  MessageCircle,
  Activity,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'

interface MailAccountItem {
  id: string
  email: string
  displayName: string
  type: string
  isActive: boolean
  warmupStatus: 'COLD' | 'WARMING' | 'WARMED' | 'PAUSED' | string
  mailboxHealthStatus: string
  mailboxHealthScore: number
  mailboxSyncStatus: string
  sentToday: number
  dailyLimit?: number
  warmupSentToday?: number
  lastMailSentAt?: string | null
}

interface WhatsAppAccountItem {
  id: string
  displayName: string
  phoneNumber: string | null
  isActive: boolean
  connectionStatus: string
  sentToday: number
  dailyLimit?: number
  lastMessageSentAt?: string | null
}

interface DriveAccountItem {
  driveAccount: {
    id: string
    email: string
    displayName: string | null
    isActive: boolean
    connectionStatus: string
    dailyLimit: number
    sentToday: number
    lastShareSentAt: string | null
  }
  driveFileId: string
  driveFileName: string | null
  driveFileMimeType: string | null
  sentCount: number
  lastSentAt: string | null
}

interface Props {
  channel: 'EMAIL' | 'WHATSAPP' | 'GDRIVE'
  preference: string
  mailAccounts?: { mailAccount: MailAccountItem }[]
  whatsappAccounts?: { whatsappAccount: WhatsAppAccountItem }[]
  driveAccounts?: DriveAccountItem[]
  totalAvailable?: number
  hasMore?: boolean
  onShowAll?: () => void
}

function formatTimeAgo(iso: string | null | undefined) {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function CampaignSenderFleet({
  channel,
  preference,
  mailAccounts = [],
  whatsappAccounts = [],
  driveAccounts = [],
  totalAvailable,
  hasMore,
  onShowAll,
}: Props) {
  const [filterQuery, setFilterQuery] = useState('')

  const isEmail = channel === 'EMAIL'
  const isWhatsApp = channel === 'WHATSAPP'
  const isDrive = channel === 'GDRIVE'

  const emailSenders = (mailAccounts || []).map((a) => a?.mailAccount).filter(Boolean)
  const whatsAppSenders = (whatsappAccounts || []).map((a) => a?.whatsappAccount).filter(Boolean)
  const driveSenders = (driveAccounts || []).filter(Boolean)

  const totalCount = isEmail
    ? totalAvailable || emailSenders.length
    : isWhatsApp
    ? whatsAppSenders.length
    : driveSenders.length

  const filteredEmailSenders = emailSenders.filter(
    (s) =>
      (s?.email || '').toLowerCase().includes(filterQuery.toLowerCase()) ||
      (s?.displayName || '').toLowerCase().includes(filterQuery.toLowerCase())
  )

  return (
    <div className="uneevo-card p-6 md:p-7 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase block">
              SENDER FLEET & HEALTH
            </span>
            <span className="text-[11px] font-bold text-[#0f8a5f] bg-[#0f8a5f]/10 px-2.5 py-0.5 rounded-full border border-[#0f8a5f]/20">
              {totalCount} Connected Sender{totalCount !== 1 ? 's' : ''}
            </span>
          </div>
          <h3 className="zoho-puvi-headline text-lg sm:text-xl font-bold text-[#121316]">
            Mailbox Reputation & Quota Allocation
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={isDrive ? '/gdrive' : isEmail ? '/mail-accounts' : '/settings'}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#ee382b] hover:underline"
          >
            <span>Manage Fleet</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Preference & Strategy Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-[16px] bg-[#faf8f4] border border-[#121316]/06 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[#62605c]">Rotation Strategy:</span>
          <span className="font-mono font-bold uppercase text-[#121316] bg-white border border-[#121316]/10 px-2.5 py-0.5 rounded-full">
            {preference}
          </span>
        </div>
        <div className="text-[11px] text-[#62605c]">
          {isEmail
            ? 'Mailboxes automatically rotate per lead to maintain 99%+ deliverability.'
            : isDrive
            ? 'Each Google Drive account paces shares via individual Google quotas.'
            : 'WhatsApp sender numbers cycle messages to stay under carrier velocity limits.'}
        </div>
      </div>

      {/* Senders Grid / List */}
      {isEmail ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-96 overflow-y-auto pr-1">
            {filteredEmailSenders.map((mailbox) => {
              const health = mailbox.mailboxHealthScore || 100
              const isWarmed = mailbox.warmupStatus === 'WARMED'
              const isWarming = mailbox.warmupStatus === 'WARMING'

              return (
                <div
                  key={mailbox.id}
                  className="p-4 rounded-[18px] bg-[#faf8f4] border border-[#121316]/08 hover:border-[#121316]/20 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#121316] text-white shadow-xs">
                        <AtSign className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#121316] truncate">
                          {mailbox.email}
                        </div>
                        <div className="text-[11px] text-[#62605c] truncate">
                          {mailbox.displayName || mailbox.email} · <span className="uppercase font-mono">{mailbox.type}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${
                        isWarmed
                          ? 'bg-[#0f8a5f]/10 text-[#0f8a5f] border border-[#0f8a5f]/20'
                          : isWarming
                          ? 'bg-[#fde9b0] text-[#5c4211] border border-[#b7791f]/20'
                          : 'bg-[#121316]/06 text-[#62605c]'
                      }`}
                    >
                      {isWarmed ? (
                        <ShieldCheck className="h-3 w-3" />
                      ) : isWarming ? (
                        <Flame className="h-3 w-3" />
                      ) : null}
                      {mailbox.warmupStatus}
                    </span>
                  </div>

                  {/* Quota & Health Meter */}
                  <div className="space-y-1.5 pt-1 border-t border-[#121316]/06 text-[11px]">
                    <div className="flex justify-between items-center text-[#62605c]">
                      <span>Health Score</span>
                      <span className="font-mono font-bold text-[#121316]">{health}/100</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#121316]/08 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          health >= 80 ? 'bg-[#0f8a5f]' : health >= 50 ? 'bg-[#ee382b]' : 'bg-[#c2414c]'
                        }`}
                        style={{ width: `${health}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-[#8a8780] pt-1">
                      <span>Sent today: <strong className="text-[#121316] font-mono">{mailbox.sentToday}</strong></span>
                      <span>Last sent: {formatTimeAgo(mailbox.lastMailSentAt)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {hasMore && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onShowAll}
                className="text-xs font-bold text-[#ee382b] hover:underline"
              >
                Show all {totalAvailable} connected senders
              </button>
            </div>
          )}
        </div>
      ) : isDrive ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-96 overflow-y-auto pr-1">
          {driveSenders.map((item) => (
            <div
              key={item.driveAccount.id}
              className="p-4 rounded-[18px] bg-[#faf8f4] border border-[#121316]/08 space-y-2.5"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#fde9b0] text-[#5c4211]">
                  <HardDrive className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#121316] truncate">{item.driveAccount.email}</div>
                  <div className="text-[11px] text-[#62605c] truncate">{item.driveAccount.displayName || 'Google Account'}</div>
                </div>
              </div>

              <div className="p-2.5 rounded-[12px] bg-white border border-[#121316]/06 text-[11px] text-[#121316] font-medium truncate">
                File: {item.driveFileName || item.driveFileId}
              </div>

              <div className="flex justify-between items-center text-[10px] text-[#62605c]">
                <span>Shares today: <strong className="text-[#121316] font-mono">{item.driveAccount.sentToday} / {item.driveAccount.dailyLimit}</strong></span>
                <span>Last shared: {formatTimeAgo(item.lastSentAt || item.driveAccount.lastShareSentAt)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-96 overflow-y-auto pr-1">
          {whatsAppSenders.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-[18px] bg-[#faf8f4] border border-[#121316]/08 space-y-2"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#0f8a5f]/15 text-[#0f8a5f]">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#121316]">{item.displayName}</div>
                  <div className="text-[11px] text-[#62605c]">{item.phoneNumber || 'No phone number'}</div>
                </div>
              </div>
              <div className="flex justify-between items-center text-[10px] text-[#62605c] pt-1">
                <span>Sent today: <strong className="text-[#121316] font-mono">{item.sentToday}</strong></span>
                <span>Status: <strong className="text-[#0f8a5f] uppercase">{item.connectionStatus}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
