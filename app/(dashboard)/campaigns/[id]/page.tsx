'use client'

import { useState, useEffect, useMemo } from 'react'
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
  RefreshCw,
  TrendingUp,
  BarChart3,
  Sliders,
  Users,
  Clock,
  Sparkles,
  CheckCircle2,
  Mail,
  HardDrive,
  MessageCircle,
  ShieldCheck,
  Flame,
  AlertTriangle,
  Send,
  Calendar,
  Layers,
  AtSign,
} from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { CampaignPerformanceFunnel } from '@/components/campaigns/CampaignPerformanceFunnel'
import { CampaignVelocityChart } from '@/components/campaigns/CampaignVelocityChart'
import { CampaignSequenceTree } from '@/components/campaigns/CampaignSequenceTree'
import { CampaignSenderFleet } from '@/components/campaigns/CampaignSenderFleet'

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
  senderAccountPreference: 'random' | 'gmail' | 'zoho' | 'outlook'
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
      warmupStatus: 'COLD' | 'WARMING' | 'WARMED' | 'PAUSED' | string
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
      connectionStatus: string
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

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Active workspace tab
  const [activeTab, setActiveTab] = useState<'overview' | 'sequence' | 'fleet' | 'schedule' | 'logs'>('overview')

  // Sequence editor draft states
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

    const currentSteps =
      Array.isArray(data.sequenceSteps) && data.sequenceSteps.length > 0
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

  const fetchCampaign = (
    view: 'full' | 'summary' = 'full',
    senderPoolMode: 'preview' | 'all' = showAllSenderPool ? 'all' : 'preview',
    isManualRefresh = false
  ) => {
    if (isManualRefresh) setRefreshing(true)
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
        setRefreshing(false)
      })
      .catch(() => {
        setLoading(false)
        setRefreshing(false)
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
    await fetchCampaign('full', showAllSenderPool ? 'all' : 'preview')
    setActionLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) return
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
      current.map((step, stepIndex) =>
        stepIndex === index
          ? {
              ...step,
              [field]: field === 'delayDays' ? Math.max(0, Number(value) || 0) : value,
            }
          : step
      )
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

  const insertVariableToken = (index: number, token: string) => {
    setSequenceDirty(true)
    setSequenceStepsDraft((current) =>
      current.map((step, stepIndex) =>
        stepIndex === index
          ? {
              ...step,
              bodyTemplate: `${step.bodyTemplate} {{${token}}}`,
            }
          : step
      )
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
      const invalidStep = normalizedSteps.find(
        (step) => !step.bodyTemplate || (step.stepNumber === 1 && !step.subjectTemplate)
      )
      if (invalidStep) {
        setSequenceError(
          invalidStep.stepNumber === 1
            ? 'Step 1 needs both subject and body template.'
            : `Step ${invalidStep.stepNumber} needs a body template.`
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
          : 'Sequence cadence settings saved successfully.'
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
      <div className="flex h-72 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#121316] text-white shadow-xs animate-pulse">
            <Megaphone className="h-6 w-6" />
          </div>
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#62605c]">
            Loading campaign workspace...
          </div>
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

  const activeSenders = campaign.stats.senderPoolCount || 0
  const totalSent = campaign.stats.sent || 0
  const rowCount = campaign.csvFile?.rowCount || 0
  const failedCount = (campaign.stats?.failed || 0) + (campaign.stats?.bounced || 0)
  const deliveredCount = Math.max(0, totalSent - failedCount)
  const deliveryRate = totalSent > 0 ? Math.min(100, Math.round((deliveredCount / totalSent) * 100)) : 100

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* ── Main Hero Header ────────────────────────────────────────── */}
      <header className="uneevo-card p-6 md:p-7 rounded-[28px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] shadow-xs ${
                isWhatsApp
                  ? 'bg-[#0f8a5f] text-white'
                  : isDrive
                  ? 'bg-[#fde9b0] text-[#5c4211]'
                  : 'bg-[#121316] text-white'
              }`}
            >
              {isWhatsApp ? (
                <MessageCircle className="h-7 w-7" />
              ) : isDrive ? (
                <HardDrive className="h-7 w-7" />
              ) : (
                <Mail className="h-7 w-7" />
              )}
            </div>

            <div>
              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <Link
                  href="/campaigns"
                  className="text-xs font-bold text-[#62605c] hover:text-[#121316] uppercase tracking-wider flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" />
                  CAMPAIGNS
                </Link>
                <span className="text-[#8a8780]">/</span>
                <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase">
                  {isDrive ? 'GDRIVE SEQUENCE' : isWhatsApp ? 'WHATSAPP CADENCE' : 'EMAIL CADENCE'}
                </span>
              </div>

              {/* Title & Status */}
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="zoho-puvi-headline text-2xl sm:text-3xl font-bold tracking-tight text-[#121316]">
                  {campaign.name}
                </h1>
                <StatusBadge status={campaign.status} />
              </div>

              {/* Dataset & Creation Meta */}
              <div className="flex items-center gap-4 mt-2 text-xs text-[#62605c] flex-wrap">
                <Link
                  href={`/csv/${campaign.csvFile?.id}`}
                  className="inline-flex items-center gap-1.5 hover:text-[#121316] transition-colors"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-[#ee382b]" />
                  <span className="font-semibold underline decoration-[#121316]/20">
                    {campaign.csvFile?.originalName || 'Dataset'}
                  </span>
                  <span className="font-mono text-[#8a8780]">
                    ({rowCount.toLocaleString()} leads)
                  </span>
                </Link>
                <span>•</span>
                <span>Created {formatDateTime(campaign.createdAt)}</span>
                <span>•</span>
                <span className="capitalize font-mono font-semibold">
                  {campaign.senderAccountPreference} rotation
                </span>
              </div>
            </div>
          </div>

          {/* Action Control Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => fetchCampaign('full', showAllSenderPool ? 'all' : 'preview', true)}
              disabled={refreshing}
              title="Refresh Metrics"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#121316]/12 bg-white text-[#121316] transition-all hover:bg-[#faf8f4] shadow-2xs"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-[#ee382b]' : ''}`} />
            </button>

            {campaign.status === 'active' ? (
              <button
                type="button"
                onClick={() => handleStatusChange('pause')}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-full border border-[#121316]/12 bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#121316] hover:bg-[#faf8f4] transition shadow-xs"
              >
                <Pause className="h-4 w-4 text-[#8a8780]" />
                <span>Pause Dispatch</span>
              </button>
            ) : campaign.status !== 'completed' ? (
              <button
                type="button"
                onClick={() => handleStatusChange('start')}
                disabled={actionLoading || activeSenders === 0}
                className="inline-flex items-center gap-2 rounded-full bg-[#0f8a5f] px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-[0_4px_16px_rgba(15,138,95,0.22)] hover:bg-[#0c724e] transition"
              >
                <Play className="h-4 w-4" />
                <span>Resume Dispatch</span>
              </button>
            ) : null}

            <Link
              href={`/campaigns/${campaign.id}/logs`}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#121316]/12 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#121316] hover:bg-[#faf8f4] transition shadow-2xs"
            >
              <FileText className="h-4 w-4 text-[#62605c]" />
              <span>Audit Logs</span>
            </Link>

            <button
              type="button"
              onClick={handleDelete}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#c2414c]/20 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#c2414c] hover:bg-[#c2414c]/08 transition shadow-2xs"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Guardrail Warning Banner */}
        {campaign.guardrailReason && (
          <div className="rounded-[16px] border border-[#b7791f]/20 bg-[#fde9b0]/35 p-3.5 text-xs text-[#5c4211] font-medium flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-[#8a5c0a] shrink-0" />
            <span>{campaign.guardrailReason}</span>
          </div>
        )}

        {/* ── KPI Summary Ribbon ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 border-t border-[#121316]/08">
          {/* 1. Progress */}
          <div className="p-3.5 rounded-[16px] bg-[#faf8f4] border border-[#121316]/06">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#8a8780]">Completion</div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-[#121316] mt-0.5 tabular-nums">
              {campaign.progress}%
            </div>
            <div className="text-[10px] text-[#62605c] mt-0.5 truncate">
              {totalSent} / {rowCount} sent
            </div>
          </div>

          {/* 2. Today's Sent */}
          <div className="p-3.5 rounded-[16px] bg-[#faf8f4] border border-[#121316]/06">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#8a8780]">Sent Today</div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-[#121316] mt-0.5 tabular-nums">
              {isDrive ? campaign.stats.sent : campaign.stats.todaySent}
            </div>
            <div className="text-[10px] text-[#62605c] mt-0.5 truncate">
              Cap: {campaign.stats.todayAllowance}/day
            </div>
          </div>

          {/* 3. Delivery Rate */}
          <div className="p-3.5 rounded-[16px] bg-[#faf8f4] border border-[#121316]/06">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#8a8780]">Delivery Rate</div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-[#0f8a5f] mt-0.5 tabular-nums">
              {deliveryRate}%
            </div>
            <div className="text-[10px] text-[#0f8a5f] mt-0.5 truncate">
              {deliveredCount} clean
            </div>
          </div>

          {/* 4. Open Rate */}
          <div className="p-3.5 rounded-[16px] bg-[#faf8f4] border border-[#121316]/06">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#8a8780]">Open Rate</div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-[#ee382b] mt-0.5 tabular-nums">
              {isTrackedCampaign && campaign.emailOpenStats?.openRate != null
                ? `${campaign.emailOpenStats.openRate}%`
                : isTrackedCampaign
                ? '0%'
                : 'N/A'}
            </div>
            <div className="text-[10px] text-[#62605c] mt-0.5 truncate">
              {isTrackedCampaign ? `${campaign.emailOpenStats?.opened ?? 0} opened` : 'Pixel tracking off'}
            </div>
          </div>

          {/* 5. Replies */}
          <div className="p-3.5 rounded-[16px] bg-[#0f8a5f]/08 border border-[#0f8a5f]/15">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#0f8a5f]">Replies</div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-[#0f8a5f] mt-0.5 tabular-nums">
              {campaign.stats.replies}
            </div>
            <div className="text-[10px] text-[#0f8a5f] mt-0.5 truncate">
              {campaign.emailOpenStats?.replyRate ?? 0}% reply rate
            </div>
          </div>

          {/* 6. Active Senders */}
          <div className="p-3.5 rounded-[16px] bg-[#faf8f4] border border-[#121316]/06">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#8a8780]">Active Senders</div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-[#121316] mt-0.5 tabular-nums">
              {activeSenders}
            </div>
            <div className="text-[10px] text-[#62605c] mt-0.5 truncate">
              {campaign.stats.rampPercent}% ramp pace
            </div>
          </div>
        </div>
      </header>

      {/* ── Segmented Navigation Tabs ─────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#121316]/08">
        {(
          [
            { id: 'overview', label: 'Performance & Analytics', icon: BarChart3 },
            { id: 'sequence', label: 'Cadence & Sequence', icon: Layers },
            { id: 'fleet', label: 'Sender Fleet & Health', icon: AtSign },
            { id: 'schedule', label: 'Queue Schedule', icon: Clock },
            { id: 'logs', label: 'Live Activity Stream', icon: FileText },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon
          const isSelected = activeTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-[#121316] text-white shadow-xs'
                  : 'text-[#62605c] hover:text-[#121316] hover:bg-[#121316]/06'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── Tab 1: Overview & Analytics ─────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Graph 1: Conversion & Delivery Pipeline Funnel */}
          <CampaignPerformanceFunnel
            stats={{
              totalLeads: rowCount,
              processed: campaign.stats.processed,
              sent: campaign.stats.sent,
              failed: campaign.stats.failed,
              bounced: campaign.stats.bounced,
              replies: campaign.stats.replies,
              remaining: campaign.stats.remaining,
              opened: campaign.emailOpenStats?.opened,
              openRate: campaign.emailOpenStats?.openRate,
              replyRate: campaign.emailOpenStats?.replyRate,
              isTracked: isTrackedCampaign,
              channel: campaign.channel,
            }}
          />

          {/* Graph 2: Dispatch Pacing & Intraday Velocity */}
          <CampaignVelocityChart
            todaySent={campaign.stats.todaySent}
            todayAllowance={campaign.stats.todayAllowance}
            rampPercent={campaign.stats.rampPercent}
            channel={campaign.channel}
          />

          {/* Sequence Roadmap Preview */}
          <CampaignSequenceTree
            channel={campaign.channel}
            sequenceEnabled={campaign.sequenceEnabled}
            steps={campaign.sequenceSteps as any}
            subjectTemplate={campaign.subjectTemplate}
            bodyTemplate={campaign.bodyTemplate}
            messageTemplate={campaign.messageTemplate}
            onEditSequence={() => setActiveTab('sequence')}
          />

          {/* Grid: Upcoming Schedule & Recent Logs stream */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Queue Preview */}
            <div className="uneevo-card p-6 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-[#ee382b]">
                  UPCOMING QUEUE SLOTS
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('schedule')}
                  className="text-xs text-[#ee382b] font-bold hover:underline"
                >
                  View full schedule ({campaign.upcomingSchedule?.slots?.length || 0})
                </button>
              </div>

              {campaign.upcomingSchedule?.slots?.length ? (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {campaign.upcomingSchedule.slots.slice(0, 5).map((slot) => (
                    <div
                      key={`${slot.position}-${slot.scheduledAt}`}
                      className="flex items-center justify-between p-3.5 rounded-[14px] bg-[#faf8f4] border border-[#121316]/06 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[#8a8780] font-bold">#{slot.position}</span>
                        <div>
                          <div className="font-bold text-[#121316] truncate max-w-[200px]">
                            {slot.senderEmail}
                          </div>
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
                  No pending queue slots. Senders will cycle next available batch.
                </div>
              )}
            </div>

            {/* Recent Activity Logs */}
            <div className="uneevo-card p-6 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-[#ee382b]">
                  RECENT LIVE ACTIVITY
                </span>
                <Link
                  href={`/campaigns/${campaign.id}/logs`}
                  className="text-xs text-[#ee382b] font-bold hover:underline"
                >
                  View all logs
                </Link>
              </div>

              {campaign.recentSent?.length ? (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {campaign.recentSent.slice(0, 5).map((log) => (
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
                            ? log.whatsappAccount?.displayName || 'WhatsApp'
                            : log.mailAccount?.email || 'Mailbox'}
                        </span>
                        <span className="font-mono">{formatDateTime(log.sentAt)}</span>
                      </div>
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
        </div>
      )}

      {/* ── Tab 2: Sequence & Templates ─────────────────────────────── */}
      {activeTab === 'sequence' && (
        <div className="space-y-6">
          <div className="uneevo-card p-6 md:p-8 rounded-[28px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#121316]/08 pb-5">
              <div>
                <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase block mb-1">
                  SEQUENCE ARCHITECTURE
                </span>
                <h2 className="zoho-puvi-headline text-xl sm:text-2xl font-bold text-[#121316]">
                  Multi-Step Cadence & Message Templates
                </h2>
                <p className="text-xs text-[#62605c] mt-0.5">
                  Configure automated multi-step cadences, delay triggers, and personalized variables.
                </p>
              </div>

              {!isWhatsApp && !isDrive && (
                <label className="flex items-center gap-3 p-2.5 rounded-[14px] bg-[#faf8f4] border border-[#121316]/08 cursor-pointer hover:bg-[#faf8f4]/80">
                  <input
                    type="checkbox"
                    checked={sequenceEnabledDraft}
                    onChange={(event) => {
                      setSequenceDirty(true)
                      setSequenceEnabledDraft(event.target.checked)
                      setSequenceError(null)
                      setSequenceSuccess(null)
                    }}
                    className="h-4 w-4 rounded text-[#ee382b]"
                  />
                  <span className="text-xs font-bold text-[#121316]">
                    Enable Multi-Step Sequence
                  </span>
                </label>
              )}
            </div>

            {/* Variable Tokens helper bar */}
            <div className="p-4 rounded-[16px] bg-[#faf8f4] border border-[#121316]/06 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#121316] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#ee382b]" />
                  Available Personalization Tokens
                </span>
                <span className="text-[10px] text-[#62605c]">
                  Click token to insert into active step body
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {['FirstName', 'LastName', 'Email', 'Company', 'Title', 'City', 'CustomField'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => insertVariableToken(0, t)}
                    className="px-2.5 py-1 rounded-full bg-white border border-[#121316]/10 text-xs font-mono font-semibold text-[#121316] hover:border-[#ee382b] hover:text-[#ee382b] transition-all shadow-2xs"
                  >
                    {`{{${t}}}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Editor depending on channel */}
            {isWhatsApp ? (
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#62605c]">
                  WhatsApp Message Template
                </div>
                <div className="p-4 rounded-[16px] bg-[#faf8f4] border border-[#121316]/08 text-xs leading-relaxed text-[#121316] whitespace-pre-wrap max-h-80 overflow-y-auto">
                  {campaign.messageTemplate || 'No message template configured.'}
                </div>
              </div>
            ) : isDrive ? (
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#62605c]">
                  GDrive Share Note Message
                </div>
                <div className="p-4 rounded-[16px] bg-[#faf8f4] border border-[#121316]/08 text-xs leading-relaxed text-[#121316] whitespace-pre-wrap max-h-80 overflow-y-auto">
                  {campaign.bodyTemplate || 'No share note configured.'}
                </div>
              </div>
            ) : sequenceEnabledDraft ? (
              <div className="space-y-5">
                {sequenceStepsDraft.map((step, index) => (
                  <div
                    key={`${step.stepNumber}-${index}`}
                    className="p-5 sm:p-6 rounded-[22px] bg-[#faf8f4] border border-[#121316]/08 text-xs space-y-4 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#121316] text-white font-bold text-xs shadow-xs">
                          {step.stepNumber}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-[#121316]">
                            {index === 0 ? 'Step 1: Initial Pitch' : `Step ${index + 1}: Automated Follow-up`}
                          </div>
                          <div className="text-[11px] text-[#62605c]">
                            {index === 0 ? 'Sent on initial cadence trigger' : 'Triggered only if no reply received'}
                          </div>
                        </div>
                      </div>

                      {index > 0 && (
                        <div className="flex items-center gap-2 bg-white border border-[#121316]/10 px-3 py-1.5 rounded-full">
                          <Clock className="h-3.5 w-3.5 text-[#ee382b]" />
                          <span className="text-[11px] font-bold text-[#62605c]">Delay:</span>
                          <input
                            type="number"
                            min={1}
                            max={30}
                            value={step.delayDays}
                            onChange={(event) => handleSequenceStepChange(index, 'delayDays', event.target.value)}
                            className="w-12 rounded-[6px] border border-[#121316]/12 bg-[#faf8f4] px-1.5 py-0.5 text-center font-mono font-bold text-[#121316]"
                          />
                          <span className="text-[11px] font-bold text-[#62605c]">days</span>
                        </div>
                      )}
                    </div>

                    {index === 0 && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[#62605c]">
                          Subject Line
                        </label>
                        <input
                          type="text"
                          value={step.subjectTemplate}
                          onChange={(event) => handleSequenceStepChange(index, 'subjectTemplate', event.target.value)}
                          placeholder="e.g. Quick question regarding {{Company}} growth..."
                          className="w-full rounded-[12px] border border-[#121316]/12 bg-white px-4 py-2.5 text-xs text-[#121316] focus:outline-none focus:ring-2 focus:ring-[#121316]/15 font-medium"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[#62605c]">
                          Email Body Template
                        </label>
                        <div className="flex items-center gap-1 text-[11px] text-[#8a8780]">
                          <span>Insert:</span>
                          <button
                            type="button"
                            onClick={() => insertVariableToken(index, 'FirstName')}
                            className="underline hover:text-[#ee382b]"
                          >
                            FirstName
                          </button>
                          <span>·</span>
                          <button
                            type="button"
                            onClick={() => insertVariableToken(index, 'Company')}
                            className="underline hover:text-[#ee382b]"
                          >
                            Company
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={step.bodyTemplate}
                        onChange={(event) => handleSequenceStepChange(index, 'bodyTemplate', event.target.value)}
                        placeholder={`Write Step ${index + 1} message...`}
                        rows={5}
                        className="w-full rounded-[14px] border border-[#121316]/12 bg-white p-4 text-xs text-[#121316] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#121316]/15 font-sans"
                      />
                    </div>
                  </div>
                ))}

                {/* Actions & Save */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#121316]/08">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={addSequenceStep}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#121316]/12 bg-white px-4 py-2 text-xs font-bold text-[#121316] hover:bg-[#faf8f4] transition shadow-2xs"
                    >
                      + Add Follow-up Step
                    </button>
                    {sequenceStepsDraft.length > 1 && (
                      <button
                        type="button"
                        onClick={removeSequenceStep}
                        className="text-xs text-[#c2414c] font-semibold hover:underline"
                      >
                        Remove Step
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleSequenceSave}
                    disabled={sequenceSaving}
                    className="inline-flex items-center gap-2 rounded-full bg-[#ee382b] px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-[0_6px_20px_rgba(238,56,43,0.22)] hover:bg-[#d92b1f] transition disabled:opacity-50"
                  >
                    {sequenceSaving ? 'Saving Sequence...' : 'Save Sequence Changes'}
                  </button>
                </div>

                {sequenceError && (
                  <div className="p-3 rounded-[12px] bg-[#c2414c]/08 border border-[#c2414c]/20 text-xs text-[#c2414c] font-semibold">
                    {sequenceError}
                  </div>
                )}
                {sequenceSuccess && (
                  <div className="p-3 rounded-[12px] bg-[#0f8a5f]/10 border border-[#0f8a5f]/20 text-xs text-[#0f8a5f] font-semibold">
                    {sequenceSuccess}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-[16px] bg-[#faf8f4] border border-[#121316]/06 space-y-2">
                  <div className="text-[10px] font-bold text-[#8a8780] uppercase tracking-wider">
                    Subject Line
                  </div>
                  <div className="text-xs font-bold text-[#121316]">
                    {campaign.subjectTemplate || 'No subject set'}
                  </div>
                </div>

                <div className="p-5 rounded-[18px] bg-[#faf8f4] border border-[#121316]/06 text-xs text-[#121316] leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
                  {campaign.bodyTemplate || 'No template saved'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab 3: Sender Fleet & Health ────────────────────────────── */}
      {activeTab === 'fleet' && (
        <CampaignSenderFleet
          channel={campaign.channel}
          preference={campaign.senderAccountPreference}
          mailAccounts={campaign.mailAccounts}
          whatsappAccounts={campaign.whatsappAccounts}
          driveAccounts={campaign.driveAccounts}
          totalAvailable={campaign.senderPoolMeta?.totalAvailable}
          hasMore={campaign.senderPoolMeta?.hasMore}
          onShowAll={() => setShowAllSenderPool(true)}
        />
      )}

      {/* ── Tab 4: Queue Schedule ──────────────────────────────────── */}
      {activeTab === 'schedule' && (
        <div className="uneevo-card p-6 md:p-8 rounded-[28px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#121316]/08 pb-4">
            <div>
              <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase block mb-1">
                DISPATCH QUEUE TIMELINE
              </span>
              <h2 className="zoho-puvi-headline text-xl sm:text-2xl font-bold text-[#121316]">
                Upcoming Scheduled Delivery Slots
              </h2>
            </div>
            <div className="text-xs font-mono font-bold text-[#8a8780]">
              Next Run: {campaign.upcomingSchedule?.nextRunAt ? formatDateTime(campaign.upcomingSchedule.nextRunAt) : 'Pending Cycle'}
            </div>
          </div>

          {campaign.upcomingSchedule?.slots?.length ? (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {campaign.upcomingSchedule.slots.map((slot) => (
                <div
                  key={`${slot.position}-${slot.scheduledAt}`}
                  className="flex items-center justify-between p-4 rounded-[16px] bg-[#faf8f4] border border-[#121316]/06 text-xs hover:border-[#121316]/20 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#121316] text-white font-mono font-bold text-xs">
                      #{slot.position}
                    </div>
                    <div>
                      <div className="font-bold text-[#121316] text-xs sm:text-sm">
                        {slot.senderEmail}
                      </div>
                      <div className="text-[11px] text-[#62605c]">
                        {slot.senderDisplayName} · <span className="uppercase font-mono">{slot.senderType}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-xs font-bold text-[#ee382b]">
                      {formatDateTime(slot.scheduledAt)}
                    </div>
                    <div className="text-[10px] text-[#0f8a5f] font-semibold">
                      Paced Dispatch
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-[#62605c] bg-[#faf8f4] rounded-[20px] border border-[#121316]/06 space-y-2">
              <div className="font-bold text-sm text-[#121316]">No Scheduled Queue Slots Active</div>
              <p>Senders will cycle slots once new batches are scheduled or queues resume.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 5: Live Activity Logs ───────────────────────────────── */}
      {activeTab === 'logs' && (
        <div className="uneevo-card p-6 md:p-8 rounded-[28px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#121316]/08 pb-4">
            <div>
              <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase block mb-1">
                DISPATCH AUDIT
              </span>
              <h2 className="zoho-puvi-headline text-xl sm:text-2xl font-bold text-[#121316]">
                Recent Outbound Log Stream
              </h2>
            </div>
            <Link
              href={`/campaigns/${campaign.id}/logs`}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#121316]/12 bg-white px-4 py-2 text-xs font-semibold text-[#121316] hover:bg-[#faf8f4] transition shadow-2xs"
            >
              <span>Full Audit Logs Page</span>
              <ArrowLeft className="h-3 w-3 rotate-180" />
            </Link>
          </div>

          {campaign.recentSent?.length ? (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {campaign.recentSent.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-[18px] bg-[#faf8f4] border border-[#121316]/06 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-[#121316] text-xs sm:text-sm">
                      {isWhatsApp ? log.toPhone : log.toEmail}
                    </div>
                    <StatusBadge status={log.status} />
                  </div>

                  {log.subject && (
                    <div className="text-[11px] text-[#62605c] font-medium truncate">
                      Subject: {log.subject}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-[#8a8780] pt-1 border-t border-[#121316]/06 gap-2">
                    <span>
                      Sender:{' '}
                      <strong className="text-[#121316]">
                        {isWhatsApp
                          ? log.whatsappAccount?.displayName || 'WhatsApp Pool'
                          : log.mailAccount?.email || 'Mailbox Pool'}
                      </strong>
                    </span>
                    <span className="font-mono">{formatDateTime(log.sentAt)}</span>
                  </div>

                  {log.errorMessage && (
                    <div className="p-2.5 rounded-[10px] bg-[#c2414c]/08 text-[#c2414c] font-medium text-[11px]">
                      {log.errorMessage}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-[#62605c] bg-[#faf8f4] rounded-[20px] border border-[#121316]/06">
              No activity logs recorded yet for this sequence.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
