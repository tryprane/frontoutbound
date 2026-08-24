'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  Megaphone,
  Pause,
  Play,
  Trash2,
} from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'

type CampaignChannel = 'EMAIL' | 'WHATSAPP' | 'GDRIVE'

interface SequenceStepDraft {
  stepNumber: number
  subjectTemplate: string
  bodyTemplate: string
  delayDays: number
}

interface CampaignDetail {
  id: string
  name: string
  type: string
  channel: CampaignChannel
  status: 'draft' | 'active' | 'paused' | 'completed' | 'failed'
  guardrailReason: string | null
  createdAt: string
  gradualSendingEnabled: boolean
  senderAccountPreference: 'random' | 'gmail' | 'zoho'
  sequenceEnabled?: boolean
  sequenceSteps?: SequenceStepDraft[]
  subjectTemplate: string | null
  bodyTemplate: string | null
  messageTemplate: string | null
  sendFormat?: 'html' | 'text_only'
  openTrackingEnabled?: boolean
  progress: number
  csvFile: { originalName: string; rowCount: number; id: string }
  mailAccounts: {
    mailAccount: {
      id: string
      displayName: string
      email: string
      type: string
      isActive: boolean
      warmupStatus: 'COLD' | 'WARMING' | 'WARMED' | 'PAUSED'
      mailboxHealthStatus: string
      mailboxHealthScore: number
      mailboxSyncStatus: string
      sentToday: number
      lastMailSentAt: string | null
    }
  }[]
  whatsappAccounts: {
    whatsappAccount: {
      id: string
      displayName: string
      phoneNumber: string | null
      isActive: boolean
      connectionStatus: 'DISCONNECTED' | 'QR_PENDING' | 'CONNECTED' | 'ERROR'
      sentToday: number
      lastMessageSentAt: string | null
    }
  }[]
  driveAccounts?: {
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
  }[]
  senderPoolMeta?: {
    mode: 'preview' | 'all'
    showing: number
    totalAvailable: number
    hasMore: boolean
  }
  upcomingSchedule: {
    nextRunAt: string | null
    slots: {
      position: number
      scheduledAt: string
      mailAccountId: string
      senderEmail: string
      senderDisplayName: string
      senderType: string
    }[]
  }
  recentSent: Array<{
    id: string
    status: 'sent' | 'failed' | 'bounced'
    sentAt: string
    openedAt?: string | null
    lastOpenedAt?: string | null
    openCount?: number
    openStatus?: 'opened' | 'unopened' | 'No tracking'
    trackingStatus?: 'tracked' | 'no_tracking'
    repliedAt?: string | null
    replyCount?: number
    errorMessage?: string | null
    toEmail?: string
    subject?: string
    mailAccount?: { email: string }
    toPhone?: string
    message?: string
    whatsappAccount?: { displayName: string; phoneNumber: string | null }
  }>
  emailOpenStats?: {
    sent: number
    opened: number | null
    unopened: number | null
    openRate: number | null
    replied: number
    unreplied: number
    replyRate: number
  } | null
  stats: {
    sent: number
    failed: number
    bounced: number
    replies: number
    remaining: number
    processed: number
    todaySent: number
    todayFailed: number
    todayAllowance: number
    rampPercent: number
    senderPoolCount: number
  }
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isNoTracking(log: CampaignDetail['recentSent'][number]) {
  return log.trackingStatus === 'no_tracking' || log.openStatus === 'No tracking'
}

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [sequenceSaving, setSequenceSaving] = useState(false)
  const [sequenceError, setSequenceError] = useState<string | null>(null)
  const [sequenceSuccess, setSequenceSuccess] = useState<string | null>(null)
  const [sequenceEnabledDraft, setSequenceEnabledDraft] = useState(false)
  const [sequenceStepsDraft, setSequenceStepsDraft] = useState<SequenceStepDraft[]>([
    {
      stepNumber: 1,
      subjectTemplate: '',
      bodyTemplate: '',
      delayDays: 0,
    },
  ])
  const [sequenceDirty, setSequenceDirty] = useState(false)
  const [showAllSenderPool, setShowAllSenderPool] = useState(false)

  const syncSequenceDraftFromCampaign = (data: CampaignDetail) => {
    if (data.channel !== 'EMAIL' || sequenceDirty) return

    const currentSteps = Array.isArray(data.sequenceSteps) && data.sequenceSteps.length > 0
      ? data.sequenceSteps.map((step: SequenceStepDraft, index: number) => ({
          stepNumber: index + 1,
          subjectTemplate: index === 0 ? step.subjectTemplate || '' : '',
          bodyTemplate: step.bodyTemplate || '',
          delayDays: step.delayDays || 0,
        }))
      : [
          {
            stepNumber: 1,
            subjectTemplate: data.subjectTemplate || '',
            bodyTemplate: data.bodyTemplate || '',
            delayDays: 0,
          },
          {
            stepNumber: 2,
            subjectTemplate: '',
            bodyTemplate: 'Wanted to follow up once in case this is still relevant.',
            delayDays: 2,
          },
        ]

    setSequenceEnabledDraft(Boolean(data.sequenceEnabled))
    setSequenceStepsDraft(currentSteps)
  }

  const fetchCampaign = (view: 'full' | 'summary' = 'full', senderPoolMode: 'preview' | 'all' = showAllSenderPool ? 'all' : 'preview') => {
    const searchParams = new URLSearchParams()
    if (view === 'summary') searchParams.set('view', 'summary')
    searchParams.set('senderPool', senderPoolMode)
    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
    fetch(`/api/campaigns/${params.id}${query}`)
      .then((r) => {
        if (!r.ok) throw new Error('not found')
        return r.json()
      })
      .then((data) => {
        setCampaign((current) => {
          if (!current || view === 'full') return data
          return {
            ...current,
            ...data,
            sequenceEnabled: current.sequenceEnabled,
            sequenceSteps: current.sequenceSteps,
            subjectTemplate: current.subjectTemplate,
            bodyTemplate: current.bodyTemplate,
            messageTemplate: current.messageTemplate,
          }
        })
        if (view === 'full') {
          syncSequenceDraftFromCampaign(data)
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
        router.push('/campaigns')
      })
  }

  useEffect(() => {
    fetchCampaign('full', showAllSenderPool ? 'all' : 'preview')
    const timer = setInterval(() => fetchCampaign('summary', showAllSenderPool ? 'all' : 'preview'), 45_000)
    return () => clearInterval(timer)
  }, [params.id, showAllSenderPool]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = async (action: 'start' | 'pause') => {
    setActionLoading(true)
    await fetch(`/api/campaigns/${params.id}/${action}`, { method: 'POST' })
    await fetchCampaign()
    setActionLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this campaign? This cannot be undone.')) return
    setActionLoading(true)
    await fetch(`/api/campaigns/${params.id}`, { method: 'DELETE' })
    router.push('/campaigns')
  }

  const handleSequenceStepChange = (
    index: number,
    field: keyof SequenceStepDraft,
    value: string | number
  ) => {
    setSequenceDirty(true)
    setSequenceStepsDraft((current) =>
      current.map((step, stepIndex) => (
        stepIndex === index
          ? {
              ...step,
              [field]: field === 'delayDays' ? Math.max(0, Number(value) || 0) : value,
            }
          : step
      ))
    )
  }

  const addSequenceStep = () => {
    setSequenceDirty(true)
    setSequenceStepsDraft((current) => [
      ...current,
      {
        stepNumber: current.length + 1,
        subjectTemplate: '',
        bodyTemplate: 'Wanted to follow up once more in case this is still relevant.',
        delayDays: 3,
      },
    ])
  }

  const removeSequenceStep = () => {
    setSequenceDirty(true)
    setSequenceStepsDraft((current) =>
      current.slice(0, -1).map((step, index) => ({
        ...step,
        stepNumber: index + 1,
      }))
    )
  }

  const handleSequenceSave = async () => {
    if (!campaign || campaign.channel !== 'EMAIL') return
    setSequenceSaving(true)
    setSequenceError(null)
    setSequenceSuccess(null)

    const normalizedSteps = sequenceStepsDraft.map((step, index) => ({
      stepNumber: index + 1,
      subjectTemplate: index === 0 ? step.subjectTemplate.trim() : '',
      bodyTemplate: step.bodyTemplate.trim(),
      delayDays: index === 0 ? 0 : Math.max(0, step.delayDays),
    }))

    if (sequenceEnabledDraft) {
      if (normalizedSteps.length === 0) {
        setSequenceError('Add at least one sequence step.')
        setSequenceSaving(false)
        return
      }
      const invalidStep = normalizedSteps.find((step) =>
        !step.bodyTemplate || (step.stepNumber === 1 && !step.subjectTemplate)
      )
      if (invalidStep) {
        setSequenceError(
          invalidStep.stepNumber === 1
            ? 'Step 1 needs both subject and body.'
            : `Step ${invalidStep.stepNumber} needs a body.`
        )
        setSequenceSaving(false)
        return
      }
    }

    try {
      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sequenceEnabled: sequenceEnabledDraft,
          sequenceSteps: sequenceEnabledDraft ? normalizedSteps : [],
        }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update sequence')
      }
      setSequenceDirty(false)
      setSequenceSuccess(
        campaign.status === 'completed' && sequenceEnabledDraft
          ? 'Sequence saved. The campaign will reopen only for leads that still have runnable follow-ups.'
          : 'Sequence settings saved.'
      )
      await fetchCampaign('full')
    } catch (error) {
      setSequenceError(error instanceof Error ? error.message : 'Failed to update sequence')
    } finally {
      setSequenceSaving(false)
    }
  }

  if (loading || !campaign) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-xs font-mono text-[#8a8780] uppercase tracking-wider">
          Loading sequence details...
        </div>
      </div>
    )
  }

  const isWhatsApp = campaign.channel === 'WHATSAPP'
  const isDrive = campaign.channel === 'GDRIVE'
  const isTrackedCampaign =
    !isWhatsApp &&
    !isDrive &&
    campaign.sendFormat !== 'text_only' &&
    campaign.openTrackingEnabled === true
  const activeSenders = campaign.stats.senderPoolCount
  const totalSent = campaign.stats.sent
  const limitExplanation = isDrive
    ? 'Google delivers each share notification directly, paced by per-account daily limits set on the GDrive page.'
    : campaign.sequenceEnabled
    ? 'Initial emails use this campaign daily allowance. Automated follow-ups draw from mailbox quotas without consuming initial pool slots.'
    : 'Outbound dispatch balances across healthy senders adhering to daily quotas and ramp-up pace.'

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header Card */}
      <header className="uneevo-card p-6 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#121316] text-white shadow-xs">
            <Megaphone className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/campaigns"
                className="text-xs font-bold text-[#62605c] hover:text-[#121316] uppercase tracking-wider flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                CAMPAIGNS
              </Link>
              <span className="text-[#8a8780]">/</span>
              <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase">
                {isDrive ? 'GDRIVE SEQUENCE' : 'EMAIL SEQUENCE'}
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="zoho-puvi-headline text-2xl sm:text-3xl font-bold tracking-tight text-[#121316]">
                {campaign.name}
              </h1>
              <StatusBadge status={campaign.status} />
            </div>

            {campaign.guardrailReason && (
              <div className="mt-2 text-xs text-[#b7791f] bg-[#b7791f]/10 p-2.5 rounded-[10px] border border-[#b7791f]/20">
                {campaign.guardrailReason}
              </div>
            )}
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {campaign.status === 'active' ? (
            <button
              type="button"
              onClick={() => handleStatusChange('pause')}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#121316]/12 bg-white px-4 py-2 text-xs font-semibold text-[#121316] hover:bg-[#faf8f4] transition shadow-2xs"
            >
              <Pause className="h-3.5 w-3.5" />
              <span>Pause Campaign</span>
            </button>
          ) : campaign.status !== 'completed' ? (
            <button
              type="button"
              onClick={() => handleStatusChange('start')}
              disabled={actionLoading || activeSenders === 0}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#0f8a5f] px-5 py-2 text-xs font-bold text-white shadow-[0_4px_16px_rgba(15,138,95,0.22)] hover:bg-[#0c724e] transition"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Resume Dispatch</span>
            </button>
          ) : null}

          <Link
            href={`/campaigns/${campaign.id}/logs`}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#121316]/12 bg-white px-4 py-2 text-xs font-semibold text-[#121316] hover:bg-[#faf8f4] transition shadow-2xs"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Audit Logs</span>
          </Link>

          <button
            type="button"
            onClick={handleDelete}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#c2414c]/20 bg-white px-3.5 py-2 text-xs font-semibold text-[#c2414c] hover:bg-[#c2414c]/08 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </header>

      {/* Main Grid: Left Analytics & Activity (65%), Right Settings & Sender Pools (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6 items-start">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Progress & Ramp Card */}
          <div className="uneevo-card p-6 md:p-7 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#ee382b] block mb-1">
                  OVERALL COMPLETION
                </span>
                <div className="text-3xl sm:text-4xl font-bold font-mono text-[#121316] tabular-nums">
                  {campaign.progress}%
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-[#121316] tabular-nums">
                  {totalSent.toLocaleString()}
                </span>
                <span className="text-xs text-[#62605c]">
                  {' '}
                  / {campaign.csvFile.rowCount.toLocaleString()} prospects
                </span>
              </div>
            </div>

            {/* Continuous Progress Bar */}
            <div className="h-2.5 w-full bg-[#121316]/06 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#ee382b] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, campaign.progress))}%` }}
              />
            </div>

            {/* Metric Pills Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-[14px] bg-[#faf8f4] border border-[#121316]/06">
                <div className="text-[10px] font-bold text-[#8a8780] uppercase tracking-wider">Active Senders</div>
                <div className="text-base font-bold font-mono text-[#121316] mt-0.5">{activeSenders}</div>
              </div>
              <div className="p-3 rounded-[14px] bg-[#faf8f4] border border-[#121316]/06">
                <div className="text-[10px] font-bold text-[#8a8780] uppercase tracking-wider">Daily Allowance</div>
                <div className="text-base font-bold font-mono text-[#121316] mt-0.5">{campaign.stats.todayAllowance}/day</div>
              </div>
              {!isDrive && (
                <div className="p-3 rounded-[14px] bg-[#faf8f4] border border-[#121316]/06">
                  <div className="text-[10px] font-bold text-[#8a8780] uppercase tracking-wider">Warmup Pace</div>
                  <div className="text-base font-bold font-mono text-[#121316] mt-0.5">{campaign.stats.rampPercent}%</div>
                </div>
              )}
              <div className="p-3 rounded-[14px] bg-[#faf8f4] border border-[#121316]/06">
                <div className="text-[10px] font-bold text-[#8a8780] uppercase tracking-wider">Remaining</div>
                <div className="text-base font-bold font-mono text-[#121316] mt-0.5">{campaign.stats.remaining}</div>
              </div>
            </div>

            <div className="text-xs text-[#62605c] leading-relaxed pt-1">
              {limitExplanation}
            </div>
          </div>

          {/* Delivery & Engagement Metrics Grid */}
          <div className="uneevo-card p-6 md:p-7 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#ee382b] block mb-1">
              DISPATCH & ENGAGEMENT AUDIT
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-[16px] bg-[#faf8f4] border border-[#121316]/06">
                <div className="text-[10px] font-bold text-[#8a8780] uppercase tracking-wider">Processed</div>
                <div className="text-xl font-bold font-mono text-[#121316] mt-1">{campaign.stats.processed}</div>
              </div>
              <div className="p-3.5 rounded-[16px] bg-[#faf8f4] border border-[#121316]/06">
                <div className="text-[10px] font-bold text-[#8a8780] uppercase tracking-wider">Sent Today</div>
                <div className="text-xl font-bold font-mono text-[#121316] mt-1">
                  {isDrive ? campaign.stats.sent : campaign.stats.todaySent}
                </div>
              </div>
              {!isDrive ? (
                <div className="p-3.5 rounded-[16px] bg-[#faf8f4] border border-[#121316]/06">
                  <div className="text-[10px] font-bold text-[#8a8780] uppercase tracking-wider">Replies</div>
                  <div className="text-xl font-bold font-mono text-[#0f8a5f] mt-1">{campaign.stats.replies}</div>
                </div>
              ) : (
                <div className="p-3.5 rounded-[16px] bg-[#faf8f4] border border-[#121316]/06">
                  <div className="text-[10px] font-bold text-[#8a8780] uppercase tracking-wider">Shares Sent</div>
                  <div className="text-xl font-bold font-mono text-[#121316] mt-1">{campaign.stats.sent}</div>
                </div>
              )}
              <div className="p-3.5 rounded-[16px] bg-[#faf8f4] border border-[#121316]/06">
                <div className="text-[10px] font-bold text-[#8a8780] uppercase tracking-wider">Bounced / Failed</div>
                <div className="text-xl font-bold font-mono text-[#c2414c] mt-1">
                  {campaign.stats.failed + (campaign.stats.bounced || 0)}
                </div>
              </div>
            </div>

            {/* Email Open Stats if available */}
            {!isWhatsApp && !isDrive && campaign.emailOpenStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#121316]/08">
                <div className="p-3 rounded-[14px] bg-white border border-[#121316]/08">
                  <div className="text-[10px] font-bold text-[#8a8780] uppercase tracking-wider">Opened</div>
                  <div className="text-base font-bold font-mono text-[#0f8a5f] mt-0.5">
                    {isTrackedCampaign ? campaign.emailOpenStats.opened : 'N/A'}
                  </div>
                </div>
                <div className="p-3 rounded-[14px] bg-white border border-[#121316]/08">
                  <div className="text-[10px] font-bold text-[#8a8780] uppercase tracking-wider">Open Rate</div>
                  <div className="text-base font-bold font-mono text-[#ee382b] mt-0.5">
                    {isTrackedCampaign ? `${campaign.emailOpenStats.openRate}%` : 'N/A'}
                  </div>
                </div>
                <div className="p-3 rounded-[14px] bg-white border border-[#121316]/08">
                  <div className="text-[10px] font-bold text-[#8a8780] uppercase tracking-wider">Replied</div>
                  <div className="text-base font-bold font-mono text-[#0f8a5f] mt-0.5">
                    {campaign.emailOpenStats.replied}
                  </div>
                </div>
                <div className="p-3 rounded-[14px] bg-white border border-[#121316]/08">
                  <div className="text-[10px] font-bold text-[#8a8780] uppercase tracking-wider">Reply Rate</div>
                  <div className="text-base font-bold font-mono text-[#0f8a5f] mt-0.5">
                    {campaign.emailOpenStats.replyRate}%
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Upcoming Schedule Card */}
          <div className="uneevo-card p-6 md:p-7 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#ee382b]">
                UPCOMING QUEUE SCHEDULE
              </span>
              <span className="text-xs font-mono text-[#8a8780]">
                Next: {campaign.upcomingSchedule?.nextRunAt ? formatDateTime(campaign.upcomingSchedule.nextRunAt) : 'Pending'}
              </span>
            </div>

            {campaign.upcomingSchedule?.slots?.length ? (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {campaign.upcomingSchedule.slots.slice(0, 25).map((slot) => (
                  <div
                    key={`${slot.position}-${slot.scheduledAt}`}
                    className="flex items-center justify-between p-3 rounded-[14px] bg-[#faf8f4] border border-[#121316]/06 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[#8a8780] font-bold">#{slot.position}</span>
                      <div>
                        <div className="font-bold text-[#121316]">{slot.senderEmail}</div>
                        <div className="text-[11px] text-[#62605c]">{slot.senderDisplayName}</div>
                      </div>
                    </div>
                    <div className="font-mono text-xs text-[#ee382b] font-bold">
                      {formatDateTime(slot.scheduledAt)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[#62605c] bg-[#faf8f4] rounded-[16px] border border-[#121316]/06">
                No active upcoming queue slots. Senders will receive dispatches once queues cycle.
              </div>
            )}
          </div>

          {/* Recent Activity Card */}
          <div className="uneevo-card p-6 md:p-7 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#ee382b]">
                RECENT LOG ACTIVITY
              </span>
              <Link href={`/campaigns/${campaign.id}/logs`} className="text-xs text-[#ee382b] font-bold hover:underline">
                View all logs
              </Link>
            </div>

            {campaign.recentSent.length ? (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {campaign.recentSent.slice(0, 12).map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-[14px] bg-[#faf8f4] border border-[#121316]/06 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#121316]">
                        {isWhatsApp ? log.toPhone : log.toEmail}
                      </span>
                      <StatusBadge status={log.status} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#62605c]">
                      <span>
                        Sender:{' '}
                        {isWhatsApp
                          ? log.whatsappAccount?.phoneNumber || log.whatsappAccount?.displayName || 'WhatsApp Pool'
                          : log.mailAccount?.email || 'Mailbox Pool'}
                      </span>
                      <span className="font-mono">{formatDateTime(log.sentAt)}</span>
                    </div>
                    {log.errorMessage && (
                      <div className="text-[11px] text-[#c2414c] bg-[#c2414c]/08 p-2 rounded-[8px]">
                        {log.errorMessage}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[#62605c] bg-[#faf8f4] rounded-[16px] border border-[#121316]/06">
                No activity logs recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dataset & Sender Pool & Sequence Settings */}
        <div className="space-y-6">
          {/* Dataset Card */}
          <div className="uneevo-card p-6 rounded-[22px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#ee382b] block">
              CONTACT DATASET
            </span>
            <Link
              href={`/csv/${campaign.csvFile.id}`}
              className="flex items-center justify-between p-3.5 rounded-[14px] bg-[#ee382b]/08 border border-[#ee382b]/20 text-xs font-bold text-[#ee382b] hover:bg-[#ee382b]/12 transition"
            >
              <div className="flex items-center gap-2 truncate">
                <FileSpreadsheet className="h-4 w-4 shrink-0" />
                <span className="truncate">{campaign.csvFile.originalName}</span>
              </div>
              <span className="font-mono tabular-nums text-xs">{campaign.csvFile.rowCount.toLocaleString()} rows</span>
            </Link>
            <div className="text-xs text-[#62605c] flex items-center justify-between pt-1">
              <span>Pool Distribution:</span>
              <strong className="text-[#121316] uppercase font-mono">{campaign.senderAccountPreference}</strong>
            </div>
          </div>

          {/* Sender Pool Card */}
          <div className="uneevo-card p-6 rounded-[22px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#ee382b]">
                CONNECTED SENDER POOL
              </span>
              {campaign.senderPoolMeta?.hasMore && !showAllSenderPool && (
                <button
                  type="button"
                  onClick={() => setShowAllSenderPool(true)}
                  className="text-xs text-[#ee382b] font-bold hover:underline"
                >
                  Show all
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {isWhatsApp
                ? campaign.whatsappAccounts.map((a) => (
                    <div
                      key={a.whatsappAccount.id}
                      className="p-3 rounded-[12px] bg-[#faf8f4] border border-[#121316]/06 text-xs space-y-1"
                    >
                      <div className="font-bold text-[#121316]">{a.whatsappAccount.displayName}</div>
                      <div className="text-[11px] text-[#62605c]">{a.whatsappAccount.phoneNumber || 'No number'}</div>
                    </div>
                  ))
                : isDrive
                ? (campaign.driveAccounts || []).map((a) => (
                    <div
                      key={a.driveAccount.id}
                      className="p-3 rounded-[12px] bg-[#faf8f4] border border-[#121316]/06 text-xs space-y-1"
                    >
                      <div className="font-bold text-[#121316]">{a.driveAccount.email}</div>
                      <div className="text-[11px] text-[#62605c]">
                        Shares today: {a.driveAccount.sentToday}/{a.driveAccount.dailyLimit}
                      </div>
                      <div className="text-[11px] text-[#ee382b] truncate font-medium">
                        {a.driveFileName || a.driveFileId}
                      </div>
                    </div>
                  ))
                : campaign.mailAccounts.map((a) => (
                    <div
                      key={a.mailAccount.id}
                      className="p-3 rounded-[12px] bg-[#faf8f4] border border-[#121316]/06 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#121316] truncate max-w-[170px]">{a.mailAccount.email}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0f8a5f]/10 text-[#0f8a5f] font-bold">
                          {a.mailAccount.warmupStatus}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#62605c]">
                        Health Score: {a.mailAccount.mailboxHealthScore}/100 ({a.mailAccount.mailboxHealthStatus})
                      </div>
                    </div>
                  ))}
            </div>
          </div>

          {/* Template / Sequence Editor Card */}
          <div className="uneevo-card p-6 rounded-[22px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#ee382b]">
                {isWhatsApp ? 'WHATSAPP TEMPLATE' : isDrive ? 'GDRIVE SHARE NOTE' : 'EMAIL TEMPLATES & SEQUENCE'}
              </span>
              {!isWhatsApp && !isDrive && (
                <label className="flex items-center gap-2 text-xs text-[#62605c] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sequenceEnabledDraft}
                    onChange={(event) => {
                      setSequenceDirty(true)
                      setSequenceEnabledDraft(event.target.checked)
                      setSequenceError(null)
                      setSequenceSuccess(null)
                    }}
                    className="h-3.5 w-3.5 rounded text-[#ee382b]"
                  />
                  <span>Multi-step sequence</span>
                </label>
              )}
            </div>

            {isWhatsApp ? (
              <div className="p-3.5 rounded-[14px] bg-[#faf8f4] border border-[#121316]/06 text-xs leading-relaxed text-[#121316] whitespace-pre-wrap max-h-60 overflow-y-auto">
                {campaign.messageTemplate || 'No template saved'}
              </div>
            ) : isDrive ? (
              <div className="p-3.5 rounded-[14px] bg-[#faf8f4] border border-[#121316]/06 text-xs leading-relaxed text-[#121316] whitespace-pre-wrap max-h-60 overflow-y-auto">
                {campaign.bodyTemplate || 'No share note saved'}
              </div>
            ) : sequenceEnabledDraft ? (
              <div className="space-y-4">
                {sequenceStepsDraft.map((step, index) => (
                  <div
                    key={`${step.stepNumber}-${index}`}
                    className="p-4 rounded-[16px] bg-[#faf8f4] border border-[#121316]/08 text-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-[#121316]">
                        {index === 0 ? 'Step 1 (Initial)' : `Step ${index + 1} (Follow-up)`}
                      </div>
                      {index > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-[#8a8780]">Delay:</span>
                          <input
                            type="number"
                            min={1}
                            max={30}
                            value={step.delayDays}
                            onChange={(event) => handleSequenceStepChange(index, 'delayDays', event.target.value)}
                            className="w-12 rounded-[6px] border border-[#121316]/12 bg-white px-1.5 py-0.5 text-center font-mono font-bold"
                          />
                          <span className="text-[11px] text-[#8a8780]">days</span>
                        </div>
                      )}
                    </div>

                    {index === 0 && (
                      <input
                        type="text"
                        value={step.subjectTemplate}
                        onChange={(event) => handleSequenceStepChange(index, 'subjectTemplate', event.target.value)}
                        placeholder="Subject line"
                        className="w-full rounded-[10px] border border-[#121316]/12 bg-white px-3 py-2 text-xs text-[#121316]"
                      />
                    )}

                    <textarea
                      value={step.bodyTemplate}
                      onChange={(event) => handleSequenceStepChange(index, 'bodyTemplate', event.target.value)}
                      placeholder={`Step ${index + 1} message`}
                      rows={4}
                      className="w-full rounded-[10px] border border-[#121316]/12 bg-white p-3 text-xs text-[#121316] leading-relaxed"
                    />
                  </div>
                ))}

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={addSequenceStep}
                      className="text-xs font-bold text-[#121316] hover:text-[#ee382b]"
                    >
                      + Add Step
                    </button>
                    {sequenceStepsDraft.length > 1 && (
                      <button
                        type="button"
                        onClick={removeSequenceStep}
                        className="text-xs text-[#c2414c] hover:underline"
                      >
                        Remove Step
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleSequenceSave}
                    disabled={sequenceSaving}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#121316] px-4 py-1.5 text-xs font-bold text-white hover:bg-black transition"
                  >
                    {sequenceSaving ? 'Saving...' : 'Save Sequence'}
                  </button>
                </div>

                {sequenceError && <div className="text-xs text-[#c2414c]">{sequenceError}</div>}
                {sequenceSuccess && <div className="text-xs text-[#0f8a5f]">{sequenceSuccess}</div>}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-[12px] bg-[#faf8f4] border border-[#121316]/06">
                  <div className="text-[10px] font-bold text-[#8a8780] uppercase tracking-wider mb-0.5">Subject</div>
                  <div className="text-xs font-bold text-[#121316]">{campaign.subjectTemplate || 'No subject'}</div>
                </div>
                <div className="p-3.5 rounded-[12px] bg-[#faf8f4] border border-[#121316]/06 text-xs text-[#121316] leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {campaign.bodyTemplate || 'No template saved'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
