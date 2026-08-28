'use client'

import { useState } from 'react'
import {
  Users,
  Send,
  CheckCircle2,
  MailOpen,
  MessageSquareReply,
  AlertTriangle,
  Info,
} from 'lucide-react'

export interface FunnelStats {
  totalLeads: number
  processed: number
  sent: number
  failed: number
  bounced?: number
  replies: number
  remaining: number
  opened?: number | null
  openRate?: number | null
  replyRate?: number
  isTracked?: boolean
  channel: 'EMAIL' | 'WHATSAPP' | 'GDRIVE'
}

export function CampaignPerformanceFunnel({ stats }: { stats: FunnelStats }) {
  const [activeStage, setActiveStage] = useState<string | null>(null)

  const isEmail = stats.channel === 'EMAIL'
  const isWhatsApp = stats.channel === 'WHATSAPP'
  const isDrive = stats.channel === 'GDRIVE'

  const total = Math.max(stats.totalLeads, 1)
  const sent = stats.sent
  const failed = stats.failed + (stats.bounced || 0)
  const delivered = Math.max(0, sent - failed)
  const opened = stats.opened ?? 0
  const replies = stats.replies

  const dispatchedRate = Math.min(100, Math.round((sent / total) * 100))
  const deliveryRate = sent > 0 ? Math.min(100, Math.round((delivered / sent) * 100)) : 100
  const openRate = stats.openRate ?? (sent > 0 && stats.isTracked ? Math.round((opened / sent) * 100) : null)
  const replyRate = stats.replyRate ?? (sent > 0 ? Math.round((replies / sent) * 100) : 0)

  const stages = [
    {
      id: 'total',
      label: 'Prospect List',
      count: stats.totalLeads,
      rateText: '100% of list',
      percentOfTotal: 100,
      icon: Users,
      color: 'bg-[#121316] text-white',
      badgeBg: 'bg-[#121316]/06 text-[#121316]',
      border: 'border-[#121316]/10',
      description: 'Total verified contacts loaded from your source dataset.',
    },
    {
      id: 'sent',
      label: isDrive ? 'Shares Dispatched' : isWhatsApp ? 'Messages Sent' : 'Emails Dispatched',
      count: sent,
      rateText: `${dispatchedRate}% dispatched`,
      percentOfTotal: dispatchedRate,
      icon: Send,
      color: 'bg-[#121316] text-white',
      badgeBg: 'bg-[#121316]/08 text-[#121316]',
      border: 'border-[#121316]/12',
      description: `${sent.toLocaleString()} out of ${total.toLocaleString()} leads sent through pooled senders.`,
    },
    {
      id: 'delivered',
      label: 'Clean Delivery',
      count: delivered,
      rateText: `${deliveryRate}% success`,
      percentOfTotal: Math.min(100, Math.round((delivered / total) * 100)),
      icon: CheckCircle2,
      color: 'bg-[#0f8a5f] text-white',
      badgeBg: 'bg-[#0f8a5f]/10 text-[#0f8a5f]',
      border: 'border-[#0f8a5f]/20',
      description: `${delivered.toLocaleString()} delivered with zero bounce or SMTP reject errors.`,
    },
    ...(isEmail && stats.isTracked
      ? [
          {
            id: 'opened',
            label: 'Emails Opened',
            count: opened,
            rateText: openRate !== null ? `${openRate}% open rate` : 'N/A',
            percentOfTotal: openRate !== null ? Math.min(100, openRate) : 0,
            icon: MailOpen,
            color: 'bg-[#ee382b] text-white',
            badgeBg: 'bg-[#ee382b]/10 text-[#ee382b]',
            border: 'border-[#ee382b]/20',
            description: 'Recipients who opened the initial email or sequence step.',
          },
        ]
      : []),
    {
      id: 'replies',
      label: 'Prospect Replies',
      count: replies,
      rateText: `${replyRate}% response`,
      percentOfTotal: Math.min(100, Math.max(1, replyRate)),
      icon: MessageSquareReply,
      color: 'bg-[#0f8a5f] text-white',
      badgeBg: 'bg-[#0f8a5f]/15 text-[#0f8a5f]',
      border: 'border-[#0f8a5f]/25',
      description: 'Direct inbound replies received. Automatically halts further follow-up cadences.',
    },
  ]

  return (
    <div className="uneevo-card p-6 md:p-7 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase block">
              PERFORMANCE FUNNEL
            </span>
            <span className="text-[11px] font-bold text-[#0f8a5f] bg-[#0f8a5f]/10 px-2.5 py-0.5 rounded-full border border-[#0f8a5f]/20">
              End-to-End Pipeline
            </span>
          </div>
          <h3 className="zoho-puvi-headline text-lg sm:text-xl font-bold text-[#121316]">
            Conversion & Delivery Drop-off
          </h3>
        </div>

        {/* Failed / Bounce Warning pill if any */}
        {failed > 0 ? (
          <div className="inline-flex items-center gap-2 bg-[#c2414c]/08 border border-[#c2414c]/20 px-3.5 py-1.5 rounded-full text-xs text-[#c2414c] font-semibold">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>
              {failed} bounced / failed ({Math.round((failed / Math.max(1, sent)) * 100)}%)
            </span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 bg-[#0f8a5f]/08 border border-[#0f8a5f]/20 px-3.5 py-1.5 rounded-full text-xs text-[#0f8a5f] font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>100% Clean Deliverability</span>
          </div>
        )}
      </div>

      {/* Funnel Stage Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {stages.map((stage) => {
          const Icon = stage.icon
          const isHovered = activeStage === stage.id

          return (
            <div
              key={stage.id}
              onMouseEnter={() => setActiveStage(stage.id)}
              onMouseLeave={() => setActiveStage(null)}
              className={`relative rounded-[20px] p-4 sm:p-5 border transition-all duration-300 cursor-pointer ${
                isHovered
                  ? `${stage.border} bg-[#faf8f4] shadow-md -translate-y-1`
                  : 'border-[#121316]/08 bg-[#faf8f4]/60 hover:bg-[#faf8f4]'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-[12px] shadow-xs ${stage.color}`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <span
                  className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full ${stage.badgeBg}`}
                >
                  {stage.rateText}
                </span>
              </div>

              <div className="text-[11px] font-bold uppercase tracking-wider text-[#62605c] mb-1">
                {stage.label}
              </div>

              <div className="font-mono text-2xl sm:text-3xl font-extrabold text-[#121316] tabular-nums">
                {stage.count.toLocaleString()}
              </div>

              {/* Progress bar representing ratio */}
              <div className="mt-3 h-1.5 w-full bg-[#121316]/08 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    stage.id === 'replies'
                      ? 'bg-[#0f8a5f]'
                      : stage.id === 'opened'
                      ? 'bg-[#ee382b]'
                      : 'bg-[#121316]'
                  }`}
                  style={{ width: `${Math.max(4, Math.min(100, stage.percentOfTotal))}%` }}
                />
              </div>

              <p className="mt-2.5 text-[11px] text-[#62605c] leading-relaxed line-clamp-2">
                {stage.description}
              </p>
            </div>
          )
        })}
      </div>

      {/* Visual Pipeline Bar */}
      <div className="rounded-[18px] bg-[#faf8f4] border border-[#121316]/06 p-4 sm:p-5">
        <div className="flex items-center justify-between text-xs font-semibold text-[#121316] mb-2.5">
          <div className="flex items-center gap-2">
            <Info className="h-3.5 w-3.5 text-[#8a8780]" />
            <span>Campaign Progression Ratio</span>
          </div>
          <span className="font-mono text-[#62605c]">
            {stats.remaining.toLocaleString()} remaining in queue
          </span>
        </div>

        <div className="flex h-4 w-full rounded-full overflow-hidden bg-[#121316]/06 p-0.5 gap-0.5">
          {/* Delivered segment */}
          <div
            className="h-full rounded-l-full bg-[#121316] transition-all duration-500"
            style={{ width: `${dispatchedRate}%` }}
            title={`${sent} Dispatched`}
          />
          {/* Remaining segment */}
          <div
            className="h-full rounded-r-full bg-[#121316]/15 transition-all duration-500"
            style={{ width: `${100 - dispatchedRate}%` }}
            title={`${stats.remaining} Remaining`}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mt-3 text-[11px] text-[#62605c] font-medium">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#121316]" />
            <span>{sent.toLocaleString()} Dispatched ({dispatchedRate}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#0f8a5f]" />
            <span>{replies} Replies ({replyRate}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#121316]/25" />
            <span>{stats.remaining.toLocaleString()} Pending in Queue</span>
          </div>
        </div>
      </div>
    </div>
  )
}
