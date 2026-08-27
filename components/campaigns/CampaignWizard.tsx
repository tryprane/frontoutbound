'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  FileSpreadsheet,
  Flame,
  HardDrive,
  Layers,
  Mail,
  Plus,
  Rocket,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Trash2,
  AlertTriangle,
  AlertCircle,
  ExternalLink,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getGradualSendingPercent,
  type CampaignSenderAccountPreference,
} from '@/lib/campaignScheduling'
import {
  ColumnMapping,
  TemplateVariableOption,
  getAvailableTemplateVariables,
  getMappedPredefinedField,
  normalizeColumnMapping,
} from '@/lib/csv-parser/column-detector'
import { CampaignModeSelector, type CampaignMode } from './CampaignModeSelector'
import { GDriveAccountSelector, type DriveAccountSelection } from './GDriveAccountSelector'
import { TemplateEditor } from './TemplateEditor'

interface CsvFile {
  id: string
  originalName: string
  rowCount: number
  columnMap?: ColumnMapping
}

interface CsvDetailResponse {
  rows: Array<{ rawData: Record<string, string> }>
  columnMap: ColumnMapping
}

interface PaginatedResponse<T> {
  items?: T[]
}

interface SequenceStepDraft {
  stepNumber: number
  subjectTemplate: string
  bodyTemplate: string
  delayDays: number
  stopOnReply: boolean
}

interface PreviewResult {
  subject?: string
  body?: string
  message?: string
  usedRow: Record<string, string | null>
}

const DEFAULT_EMAIL_SUBJECT = 'Quick idea for {{companyName}}'
const DEFAULT_EMAIL_BODY = `Hi {{firstName}},

I was checking out {{companyName}} and wanted to share one quick outreach idea that could fit your current positioning.

{{Personalization}}

If it makes sense, I can send over a short breakdown.

Best regards,`

const DEFAULT_SEQUENCE_STEPS: SequenceStepDraft[] = [
  {
    stepNumber: 1,
    subjectTemplate: DEFAULT_EMAIL_SUBJECT,
    bodyTemplate: DEFAULT_EMAIL_BODY,
    delayDays: 0,
    stopOnReply: true,
  },
  {
    stepNumber: 2,
    subjectTemplate: '',
    bodyTemplate: `Hi {{firstName}},

Wanted to bump this once in case it got buried.

Happy to share the short breakdown if useful.`,
    delayDays: 2,
    stopOnReply: true,
  },
]

function extractItems<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (payload && typeof payload === 'object' && Array.isArray((payload as PaginatedResponse<T>).items)) {
    return (payload as PaginatedResponse<T>).items || []
  }
  return []
}

function renderSelectablePanel(options: Array<{
  key: string
  label: string
  desc: string
  selected: boolean
  icon?: ReactNode
  onClick: () => void
}>) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
      {options.map((option) => {
        return (
          <button
            key={option.key}
            type="button"
            onClick={option.onClick}
            aria-pressed={option.selected}
            className={`p-4 rounded-[18px] text-left border transition-all duration-200 ${
              option.selected
                ? 'border-[#ee382b] bg-white shadow-[0_8px_24px_rgba(238,56,43,0.08)] ring-1 ring-[#ee382b]/30'
                : 'border-[#121316]/08 bg-[#faf8f4] hover:bg-white hover:border-[#121316]/16'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#121316]">
                {option.icon}
                <span>{option.label}</span>
              </div>
              {option.selected && <CheckCircle2 className="h-4 w-4 text-[#ee382b] shrink-0" />}
            </div>
            <div className="text-xs text-[#62605c] leading-relaxed">{option.desc}</div>
          </button>
        )
      })}
    </div>
  )
}

const DEFAULT_GDRIVE_NOTE = `Hi {{firstName}},

I put together a short breakdown for {{companyName}} and shared it here so you can take a look whenever it suits.

{{Personalization}}

Happy to walk you through it if useful.`

export function CampaignWizard({ initialMode = 'email' }: { initialMode?: CampaignMode } = {}) {
  const router = useRouter()

  const [mode, setMode] = useState<CampaignMode>(initialMode)
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Validation feedback states
  const [attemptedProceed, setAttemptedProceed] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const [name, setName] = useState('')
  const [csvFileId, setCsvFileId] = useState('')
  const [csvFiles, setCsvFiles] = useState<CsvFile[]>([])
  const [csvLoading, setCsvLoading] = useState(true)
  const [columnMap, setColumnMap] = useState<ColumnMapping>({})

  const [gradualSendingEnabled, setGradualSendingEnabled] = useState(true)
  const [senderAccountPreference, setSenderAccountPreference] =
    useState<CampaignSenderAccountPreference>('random')

  const [subjectTemplate, setSubjectTemplate] = useState(DEFAULT_EMAIL_SUBJECT)
  const [bodyTemplate, setBodyTemplate] = useState(
    initialMode === 'gdrive' ? DEFAULT_GDRIVE_NOTE : DEFAULT_EMAIL_BODY
  )
  const [messageTemplate, setMessageTemplate] = useState('')
  const [sequenceEnabled, setSequenceEnabled] = useState(false)
  const [sequenceSteps, setSequenceSteps] = useState<SequenceStepDraft[]>(DEFAULT_SEQUENCE_STEPS)
  const [sequencePreviewResults, setSequencePreviewResults] = useState<Record<number, PreviewResult | null>>({})
  const [sequencePreviewErrors, setSequencePreviewErrors] = useState<Record<number, string | null>>({})
  const [sequencePreviewLoading, setSequencePreviewLoading] = useState<Record<number, boolean>>({})
  const [sequencePreviewRowIndexes, setSequencePreviewRowIndexes] = useState<Record<number, number>>({})

  const [schedulingMode, setSchedulingMode] = useState<'ANYTIME' | 'BUSINESS_HOURS'>('ANYTIME')
  const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [businessHoursStart, setBusinessHoursStart] = useState('09:00')
  const [businessHoursEnd, setBusinessHoursEnd] = useState('17:00')
  const [isCustomTimezone, setIsCustomTimezone] = useState(false)

  const [sendFormat, setSendFormat] = useState<'html' | 'text_only'>('html')
  const [openTrackingEnabled, setOpenTrackingEnabled] = useState(true)

  const [driveSelections, setDriveSelections] = useState<Record<string, DriveAccountSelection>>({})
  const isGDrive = mode === 'gdrive'

  const steps = [
    { key: 1, label: 'Configuration & Target' },
    { key: 2, label: 'Message & Sequence' },
    { key: 3, label: 'Pacing & Launch' },
  ]

  useEffect(() => {
    fetch('/api/csv/upload')
      .then((res) => res.json())
      .then((data) => {
        setCsvFiles(extractItems<CsvFile>(data))
        setCsvLoading(false)
      })
      .catch(() => setCsvLoading(false))

    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.emailDefaults) {
          const fmt = data.emailDefaults.defaultSendFormat
          if (fmt === 'html' || fmt === 'text_only') {
            setSendFormat(fmt)
            if (fmt === 'text_only') setOpenTrackingEnabled(false)
          }
          if (typeof data.emailDefaults.defaultOpenTrackingEnabled === 'boolean') {
            setOpenTrackingEnabled(data.emailDefaults.defaultOpenTrackingEnabled)
          }
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!csvFileId) {
      setColumnMap({})
      return
    }

    fetch(`/api/csv/${csvFileId}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((csvData: CsvDetailResponse | null) => {
        const firstRow = csvData?.rows?.[0]?.rawData || {}
        const headers = Object.keys(firstRow)
        setColumnMap(normalizeColumnMapping(csvData?.columnMap || {}, headers))
      })
      .catch(() => setColumnMap({}))
  }, [csvFileId])

  const maxStep = steps.length

  const modeChanged = useRef(mode)
  useEffect(() => {
    if (modeChanged.current === mode) return
    modeChanged.current = mode
    if (mode === 'gdrive') {
      if (bodyTemplate === DEFAULT_EMAIL_BODY) setBodyTemplate(DEFAULT_GDRIVE_NOTE)
      setSequenceEnabled(false)
    } else if (mode === 'email') {
      if (bodyTemplate === DEFAULT_GDRIVE_NOTE) setBodyTemplate(DEFAULT_EMAIL_BODY)
    }
  }, [mode, bodyTemplate])

  const variables = useMemo<TemplateVariableOption[]>(
    () => getAvailableTemplateVariables(columnMap),
    [columnMap]
  )
  const hasEmailMapping = Boolean(getMappedPredefinedField(columnMap, 'email'))
  const selectedCsv = useMemo(() => csvFiles.find((f) => f.id === csvFileId), [csvFiles, csvFileId])

  // Clear validation errors on state changes if valid
  useEffect(() => {
    if (attemptedProceed) {
      const errors = getStepValidationErrors(step)
      setValidationErrors(errors)
    }
  }, [name, csvFileId, hasEmailMapping, driveSelections, bodyTemplate, subjectTemplate, sequenceSteps, sequenceEnabled, step]) // eslint-disable-line react-hooks/exhaustive-deps

  const getStepValidationErrors = (stepNum: number): string[] => {
    const errs: string[] = []

    if (stepNum === 1) {
      if (!name.trim()) {
        errs.push('Please enter a Campaign Identifier Name.')
      }
      if (!csvFileId) {
        errs.push('Please select a Source Contact Dataset (CSV).')
      } else if (!hasEmailMapping) {
        errs.push(
          `The selected CSV dataset ("${selectedCsv?.originalName || 'file'}") does not have an Email column mapped. Click "Edit Mapping" to assign an email column.`
        )
      }
      if (isGDrive) {
        const selected = Object.entries(driveSelections)
        if (selected.length === 0) {
          errs.push('Please connect or select at least one Google Drive sender account.')
        } else {
          const missingFile = selected.some(([, sel]) => !sel.driveFileId)
          if (missingFile) {
            errs.push('Please choose a Google Drive file to share for all connected accounts.')
          }
        }
      }
    }

    if (stepNum === 2) {
      if (isGDrive) {
        if (!bodyTemplate.trim()) {
          errs.push('Please enter the GDrive share note message content.')
        }
      } else if (sequenceEnabled) {
        if (sequenceSteps.length === 0) {
          errs.push('Please add at least one sequence step.')
        }
        if (!sequenceSteps[0]?.subjectTemplate?.trim()) {
          errs.push('Step 1 requires an Email Subject Line.')
        }
        sequenceSteps.forEach((s) => {
          if (!s.bodyTemplate?.trim()) {
            errs.push(`Step ${s.stepNumber} is missing message body content.`)
          }
        })
      } else {
        if (!subjectTemplate.trim()) {
          errs.push('Please enter an Email Subject Line.')
        }
        if (!bodyTemplate.trim()) {
          errs.push('Please enter an Email Message Body.')
        }
      }
    }

    return errs
  }

  const canGoNext = () => {
    return getStepValidationErrors(step).length === 0
  }

  const handleNextClick = () => {
    const errors = getStepValidationErrors(step)
    if (errors.length > 0) {
      setValidationErrors(errors)
      setAttemptedProceed(true)
      toast.error(errors[0], {
        description: errors.length > 1 ? `Plus ${errors.length - 1} other issue(s)` : undefined,
      })
      // Smooth scroll to top of wizard to see the highlighted missing fields
      window.scrollTo({ top: 100, behavior: 'smooth' })
      return
    }

    setValidationErrors([])
    setAttemptedProceed(false)
    setStep((prev) => Math.min(maxStep, prev + 1))
  }

  const handleLaunchClick = () => {
    const allErrors = [
      ...getStepValidationErrors(1),
      ...getStepValidationErrors(2),
      ...getStepValidationErrors(3),
    ]

    if (allErrors.length > 0) {
      setValidationErrors(allErrors)
      setAttemptedProceed(true)
      toast.error(allErrors[0])
      return
    }

    handleLaunch()
  }

  const handleSequencePreview = async (stepNumber: number, offset = 0) => {
    const currentRowIndex = sequencePreviewRowIndexes[stepNumber] ?? 0
    const nextRowIndex = Math.max(0, currentRowIndex + offset)
    const currentStep = sequenceSteps.find((stepItem) => stepItem.stepNumber === stepNumber)
    if (!currentStep) return

    setSequencePreviewLoading((current) => ({ ...current, [stepNumber]: true }))
    setSequencePreviewErrors((current) => ({ ...current, [stepNumber]: null }))
    setSequencePreviewRowIndexes((current) => ({ ...current, [stepNumber]: nextRowIndex }))

    try {
      const res = await fetch('/api/campaigns/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvFileId,
          channel: 'email',
          subjectTemplate:
            currentStep.stepNumber === 1
              ? currentStep.subjectTemplate
              : `Re: ${sequenceSteps[0]?.subjectTemplate || ''}`,
          bodyTemplate: currentStep.bodyTemplate,
          messageTemplate: '',
          rowIndex: nextRowIndex,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Preview failed')
      setSequencePreviewResults((current) => ({ ...current, [stepNumber]: data }))
    } catch (err) {
      setSequencePreviewErrors((current) => ({
        ...current,
        [stepNumber]: err instanceof Error ? err.message : 'Preview failed',
      }))
    } finally {
      setSequencePreviewLoading((current) => ({ ...current, [stepNumber]: false }))
    }
  }

  const handleLaunch = async () => {
    setSaving(true)
    setError(null)

    try {
      const schedulingPayload = {
        schedulingMode,
        timezone: schedulingMode === 'BUSINESS_HOURS' ? timezone : null,
        businessHoursStart: schedulingMode === 'BUSINESS_HOURS' ? businessHoursStart : null,
        businessHoursEnd: schedulingMode === 'BUSINESS_HOURS' ? businessHoursEnd : null,
      }

      const payload = {
        channel: mode,
        name,
        csvFileId,
        gradualSendingEnabled: isGDrive ? false : gradualSendingEnabled,
        senderAccountPreference,
        sequenceEnabled,
        sequenceSteps:
          !isGDrive && sequenceEnabled
            ? sequenceSteps.map((stepItem) => ({
                stepNumber: stepItem.stepNumber,
                subjectTemplate: stepItem.stepNumber === 1 ? stepItem.subjectTemplate : null,
                bodyTemplate: stepItem.bodyTemplate,
                delayDays: stepItem.delayDays,
                stopOnReply: stepItem.stopOnReply,
                sendFormat: sendFormat,
                openTrackingEnabled: sendFormat === 'text_only' ? false : openTrackingEnabled,
              }))
            : [],
        subjectTemplate,
        bodyTemplate,
        sendFormat,
        openTrackingEnabled: sendFormat === 'text_only' ? false : openTrackingEnabled,
        ...(isGDrive
          ? {
              driveAccounts: Object.entries(driveSelections).map(([driveAccountId, selection]) => ({
                driveAccountId,
                driveFileId: selection.driveFileId,
                driveFileName: selection.driveFileName,
                driveFileMimeType: selection.driveFileMimeType,
              })),
            }
          : {}),
        ...schedulingPayload,
      }

      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create campaign')

      const startRes = await fetch(`/api/campaigns/${data.id}/start`, { method: 'POST' })
      if (!startRes.ok) {
        const startData = await startRes.json().catch(() => null)
        throw new Error(startData?.error || 'Campaign created but failed to start')
      }

      toast.success('Campaign created and launched successfully!')
      router.push('/campaigns')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      setSaving(false)
    }
  }

  const renderCsvSelector = () => {
    const isMissingCsv = attemptedProceed && !csvFileId
    const isMissingEmailCol = attemptedProceed && csvFileId && !hasEmailMapping

    return (
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-[#ee382b] flex items-center justify-between">
          <span>SOURCE CONTACT DATASET (CSV)</span>
          {csvFileId && hasEmailMapping && (
            <span className="text-[11px] font-mono font-bold text-[#0f8a5f] flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Email Column Mapped
            </span>
          )}
        </label>

        {csvLoading ? (
          <div className="p-4 text-center text-xs text-[#62605c] bg-[#faf8f4] rounded-[16px] border border-[#121316]/08">
            Loading contact datasets...
          </div>
        ) : csvFiles.length === 0 ? (
          <div className="p-4 bg-[#ee382b]/05 border border-dashed border-[#ee382b]/30 rounded-[16px] text-xs text-[#ee382b]">
            No CSV files found in workspace.{' '}
            <Link href="/csv/upload" className="font-bold underline text-[#121316]">
              Upload a CSV first
            </Link>.
          </div>
        ) : (
          <select
            value={csvFileId}
            onChange={(event) => {
              setCsvFileId(event.target.value)
              if (validationErrors.length > 0) setValidationErrors([])
            }}
            className={`w-full rounded-[14px] border px-4 py-3 text-sm text-[#121316] transition focus:bg-white focus:outline-none ${
              isMissingCsv || isMissingEmailCol
                ? 'border-[#ee382b] bg-[#ee382b]/05 ring-2 ring-[#ee382b]/15'
                : 'border-[#121316]/12 bg-[#faf8f4] focus:border-[#ee382b]'
            }`}
          >
            <option value="" disabled>
              Select a prospect dataset...
            </option>
            {csvFiles.map((csv) => (
              <option key={csv.id} value={csv.id}>
                {csv.originalName} ({csv.rowCount.toLocaleString()} contacts)
              </option>
            ))}
          </select>
        )}

        {isMissingCsv && (
          <p className="text-[11px] font-semibold text-[#ee382b]">
            Please select a prospect CSV dataset to proceed.
          </p>
        )}

        {/* Prominent Missing Email Mapping Callout */}
        {csvFileId && !hasEmailMapping && (
          <div className="rounded-[16px] border-2 border-[#ee382b]/30 bg-[#ee382b]/08 p-4 text-xs text-[#121316] space-y-2.5 shadow-xs animate-shake">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 text-[#ee382b] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-[#ee382b] text-xs uppercase tracking-wider">
                  Action Required: Missing Email Column Mapping
                </div>
                <p className="text-[11px] text-[#5c1d19] leading-relaxed">
                  This CSV has not mapped an <strong>Email Address</strong> column yet. Campaigns require an email column to know where to deliver messages.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Link
                href={`/csv/${csvFileId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#121316] px-4 py-1.5 text-xs font-bold text-white hover:bg-black transition shadow-xs"
              >
                <span>Edit CSV Column Mapping</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
              <span className="text-[10px] text-[#62605c]">
                (Opens in new tab so you don't lose this draft)
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }

  const rampPercent = getGradualSendingPercent(
    gradualSendingEnabled,
    new Date(),
    new Date(),
    timezone
  )

  const renderSendingSettings = () => {
    const TIMEZONE_PRESETS = [
      { label: 'IST - India Standard Time', value: 'Asia/Kolkata', hours: '09:00-18:00' },
      { label: 'EST - Eastern Standard Time', value: 'America/New_York', hours: '09:00-17:00' },
      { label: 'PST - Pacific Standard Time', value: 'America/Los_Angeles', hours: '09:00-17:00' },
      { label: 'CST - Central Standard Time', value: 'America/Chicago', hours: '09:00-17:00' },
      { label: 'MST - Mountain Standard Time', value: 'America/Denver', hours: '09:00-17:00' },
      { label: 'GMT - Greenwich Mean Time', value: 'Etc/GMT', hours: '09:00-17:00' },
      { label: 'CET - Central European Time', value: 'Europe/Paris', hours: '09:00-18:00' },
      { label: 'SGT - Singapore Time', value: 'Asia/Singapore', hours: '09:00-18:00' },
      { label: 'AEST - Australian Eastern Time', value: 'Australia/Sydney', hours: '09:00-17:00' },
      { label: 'Custom timezone', value: '__custom__', hours: '' },
    ]

    const handleTimezonePreset = (value: string) => {
      if (value === '__custom__') {
        setIsCustomTimezone(true)
        return
      }
      setIsCustomTimezone(false)
      setTimezone(value)
      const preset = TIMEZONE_PRESETS.find((presetItem) => presetItem.value === value)
      if (preset && preset.hours) {
        const [start, end] = preset.hours.split('-')
        if (start) setBusinessHoursStart(start)
        if (end) setBusinessHoursEnd(end)
      }
    }

    return (
      <div className="space-y-4">
        {/* Scheduling Mode Card */}
        <div className="uneevo-card p-6 rounded-[22px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#ee382b]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#121316]">
              Dispatch Schedule & Timezone
            </span>
          </div>

          {renderSelectablePanel([
            {
              key: 'anytime',
              label: 'Continuous 24/7',
              desc: 'Send whenever sender quotas and queue slots are available.',
              selected: schedulingMode === 'ANYTIME',
              icon: <Sparkles className="h-4 w-4 text-[#ee382b]" />,
              onClick: () => setSchedulingMode('ANYTIME'),
            },
            {
              key: 'business',
              label: 'Business Hours Only',
              desc: 'Restrict delivery to recipient working hours in selected timezone.',
              selected: schedulingMode === 'BUSINESS_HOURS',
              icon: <Flame className="h-4 w-4 text-[#ee382b]" />,
              onClick: () => setSchedulingMode('BUSINESS_HOURS'),
            },
          ])}

          {schedulingMode === 'BUSINESS_HOURS' && (
            <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-[#121316]/08">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-[#8a8780] uppercase tracking-wider mb-1 block">
                  Target Timezone
                </label>
                <select
                  value={isCustomTimezone ? '__custom__' : timezone}
                  onChange={(event) => handleTimezonePreset(event.target.value)}
                  className="w-full rounded-[12px] border border-[#121316]/12 bg-[#faf8f4] px-3.5 py-2.5 text-xs text-[#121316]"
                >
                  {TIMEZONE_PRESETS.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>

              {isCustomTimezone && (
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={timezone}
                    onChange={(event) => setTimezone(event.target.value)}
                    placeholder="e.g. Asia/Kolkata"
                    className="w-full rounded-[12px] border border-[#121316]/12 bg-[#faf8f4] px-3.5 py-2.5 text-xs text-[#121316]"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-[#8a8780] uppercase tracking-wider mb-1 block">
                  Start Window
                </label>
                <input
                  type="time"
                  value={businessHoursStart}
                  onChange={(event) => setBusinessHoursStart(event.target.value)}
                  className="w-full rounded-[12px] border border-[#121316]/12 bg-[#faf8f4] px-3.5 py-2.5 text-xs text-[#121316]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#8a8780] uppercase tracking-wider mb-1 block">
                  End Window
                </label>
                <input
                  type="time"
                  value={businessHoursEnd}
                  onChange={(event) => setBusinessHoursEnd(event.target.value)}
                  className="w-full rounded-[12px] border border-[#121316]/12 bg-[#faf8f4] px-3.5 py-2.5 text-xs text-[#121316]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Sender Pool & Pacing Card */}
        <div className="uneevo-card p-6 rounded-[22px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-[#ee382b]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#121316]">
              Sender Pool Preferences & Deliverability Guardrails
            </span>
          </div>

          {isGDrive ? (
            <div className="text-xs text-[#62605c] leading-relaxed">
              Google Drive sharing utilizes official Google Drive protocol notifications with built-in daily account limits.
            </div>
          ) : (
            <>
              {renderSelectablePanel([
                {
                  key: 'random',
                  label: 'Random Mailbox Pool',
                  desc: 'Evenly distribute dispatch load across all connected and healthy accounts.',
                  selected: senderAccountPreference === 'random',
                  icon: <Shuffle className="h-4 w-4" />,
                  onClick: () => setSenderAccountPreference('random'),
                },
                {
                  key: 'gmail',
                  label: 'Google Workspace Only',
                  desc: 'Route specifically through Gmail/Google sender accounts.',
                  selected: senderAccountPreference === 'gmail',
                  onClick: () => setSenderAccountPreference('gmail'),
                },
                {
                  key: 'zoho',
                  label: 'Zoho Mail Only',
                  desc: 'Route specifically through Zoho mail infrastructure.',
                  selected: senderAccountPreference === 'zoho',
                  onClick: () => setSenderAccountPreference('zoho'),
                },
              ])}

              <label className="flex items-center gap-3 pt-2 text-xs text-[#62605c] cursor-pointer">
                <input
                  type="checkbox"
                  checked={gradualSendingEnabled}
                  onChange={(event) => setGradualSendingEnabled(event.target.checked)}
                  className="h-4 w-4 rounded text-[#ee382b] focus:ring-[#ee382b]"
                />
                <span>
                  Enable gradual volume ramp-up ({rampPercent}% day-1 pace for domain reputation protection)
                </span>
              </label>
            </>
          )}
        </div>

        {/* Format Card (Email only) */}
        {!isGDrive && (
          <div className="uneevo-card p-6 rounded-[22px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[#121316]">
              Email Rendering Format & Tracking
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setSendFormat('html')
                  setOpenTrackingEnabled(true)
                }}
                className={`p-3.5 rounded-[14px] text-xs font-bold border transition-all ${
                  sendFormat === 'html'
                    ? 'border-[#ee382b] bg-[#ee382b]/08 text-[#ee382b]'
                    : 'border-[#121316]/10 bg-[#faf8f4] text-[#62605c]'
                }`}
              >
                Rich HTML Format
              </button>
              <button
                type="button"
                onClick={() => {
                  setSendFormat('text_only')
                  setOpenTrackingEnabled(false)
                }}
                className={`p-3.5 rounded-[14px] text-xs font-bold border transition-all ${
                  sendFormat === 'text_only'
                    ? 'border-[#ee382b] bg-[#ee382b]/08 text-[#ee382b]'
                    : 'border-[#121316]/10 bg-[#faf8f4] text-[#62605c]'
                }`}
              >
                Plain Text (No HTML)
              </button>
            </div>

            {sendFormat !== 'text_only' && (
              <label className="flex items-center gap-3 pt-1 text-xs text-[#62605c] cursor-pointer">
                <input
                  type="checkbox"
                  checked={openTrackingEnabled}
                  onChange={(event) => setOpenTrackingEnabled(event.target.checked)}
                  className="h-4 w-4 rounded text-[#ee382b] focus:ring-[#ee382b]"
                />
                <span>Embed invisible open-tracking pixel in messages</span>
              </label>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderStep = () => {
    if (step === 1) {
      const isMissingName = attemptedProceed && !name.trim()

      return (
        <div className="space-y-6">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#ee382b] mb-2 block">
              CAMPAIGN CHANNEL PROTOCOL
            </label>
            <CampaignModeSelector value={mode} onChange={setMode} />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#ee382b]">
              CAMPAIGN IDENTIFIER NAME
            </label>
            <input
              type="text"
              placeholder={isGDrive ? 'e.g. Q3 Founders Drive Outreach' : 'e.g. Q3 SaaS Sales Executives'}
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                if (validationErrors.length > 0) setValidationErrors([])
              }}
              className={`w-full rounded-[14px] border px-4 py-3 text-sm text-[#121316] transition focus:bg-white focus:outline-none ${
                isMissingName
                  ? 'border-[#ee382b] bg-[#ee382b]/05 ring-2 ring-[#ee382b]/15'
                  : 'border-[#121316]/12 bg-[#faf8f4] focus:border-[#ee382b]'
              }`}
            />
            {isMissingName && (
              <p className="text-[11px] font-semibold text-[#ee382b]">
                Please enter a campaign name to continue.
              </p>
            )}
          </div>

          {renderCsvSelector()}

          {isGDrive && (
            <GDriveAccountSelector selections={driveSelections} onChange={setDriveSelections} />
          )}

          {renderSendingSettings()}
        </div>
      )
    }

    if (step === 2) {
      if (isGDrive) {
        return (
          <div className="space-y-6">
            <TemplateEditor
              mode="gdrive"
              csvFileId={csvFileId}
              subjectTemplate={subjectTemplate}
              bodyTemplate={bodyTemplate}
              messageTemplate={messageTemplate}
              onSubjectTemplateChange={setSubjectTemplate}
              onBodyTemplateChange={setBodyTemplate}
              onMessageTemplateChange={setMessageTemplate}
              variables={variables}
            />
          </div>
        )
      }

      if (sequenceEnabled) {
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 text-xs font-bold text-[#121316] cursor-pointer">
                <input
                  type="checkbox"
                  checked={sequenceEnabled}
                  onChange={(event) => setSequenceEnabled(event.target.checked)}
                  className="h-4 w-4 rounded text-[#ee382b] focus:ring-[#ee382b]"
                />
                <span>Multi-step cadence sequence enabled</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setSequenceSteps((current) => [
                    ...current,
                    {
                      stepNumber: current.length + 1,
                      subjectTemplate: '',
                      bodyTemplate: `Hi {{firstName}},\n\nWanted to follow up once more in case this is still relevant.`,
                      delayDays: 3,
                      stopOnReply: true,
                    },
                  ])
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#121316]/12 bg-white px-3.5 py-1.5 text-xs font-bold text-[#121316] hover:bg-[#faf8f4] transition shadow-2xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Step {sequenceSteps.length + 1}</span>
              </button>
            </div>

            <div className="space-y-6">
              {sequenceSteps.map((stepItem, index) => (
                <div
                  key={stepItem.stepNumber}
                  className="uneevo-card p-6 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#121316] text-white font-bold text-xs">
                        {stepItem.stepNumber}
                      </div>
                      <span className="font-bold text-sm text-[#121316]">
                        {index === 0 ? 'Step 1 (Initial Message)' : `Step ${stepItem.stepNumber} (Follow-up)`}
                      </span>
                    </div>

                    {index > 0 && (
                      <div className="flex items-center gap-2 bg-[#faf8f4] border border-[#121316]/08 px-3 py-1.5 rounded-full">
                        <Clock className="h-3.5 w-3.5 text-[#ee382b]" />
                        <span className="text-[11px] font-bold text-[#62605c]">Delay:</span>
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={stepItem.delayDays}
                          onChange={(event) => {
                            const val = Math.max(1, Number(event.target.value) || 1)
                            setSequenceSteps((current) =>
                              current.map((s, idx) =>
                                idx === index ? { ...s, delayDays: val } : s
                              )
                            )
                          }}
                          className="w-12 rounded-[6px] border border-[#121316]/12 bg-white px-1.5 py-0.5 text-center font-mono font-bold text-[#121316]"
                        />
                        <span className="text-[11px] font-bold text-[#62605c]">days</span>
                      </div>
                    )}
                  </div>

                  <TemplateEditor
                    mode="email"
                    csvFileId={csvFileId}
                    subjectTemplate={stepItem.subjectTemplate}
                    bodyTemplate={stepItem.bodyTemplate}
                    messageTemplate=""
                    onSubjectTemplateChange={(val) => {
                      setSequenceSteps((current) =>
                        current.map((s, idx) =>
                          idx === index ? { ...s, subjectTemplate: val } : s
                        )
                      )
                    }}
                    onBodyTemplateChange={(val) => {
                      setSequenceSteps((current) =>
                        current.map((s, idx) =>
                          idx === index ? { ...s, bodyTemplate: val } : s
                        )
                      )
                    }}
                    onMessageTemplateChange={() => {}}
                    variables={variables}
                  />

                  <div className="flex items-center justify-between pt-2 border-t border-[#121316]/06">
                    <button
                      type="button"
                      onClick={() => handleSequencePreview(stepItem.stepNumber, 0)}
                      disabled={sequencePreviewLoading[stepItem.stepNumber]}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ee382b] hover:underline"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>
                        {sequencePreviewLoading[stepItem.stepNumber] ? 'Rendering...' : 'Test Row Preview'}
                      </span>
                    </button>

                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setSequenceSteps((current) =>
                            current.filter((_, idx) => idx !== index).map((entry, idx) => ({
                              ...entry,
                              stepNumber: idx + 1,
                            }))
                          )
                        }
                        className="text-xs text-[#c2414c] hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete step</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }

      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2.5 text-xs font-bold text-[#121316] cursor-pointer">
              <input
                type="checkbox"
                checked={sequenceEnabled}
                onChange={(event) => setSequenceEnabled(event.target.checked)}
                className="h-4 w-4 rounded text-[#ee382b] focus:ring-[#ee382b]"
              />
              <span>Enable multi-step follow-up sequence</span>
            </label>
          </div>

          <TemplateEditor
            mode="email"
            csvFileId={csvFileId}
            subjectTemplate={subjectTemplate}
            bodyTemplate={bodyTemplate}
            messageTemplate={messageTemplate}
            onSubjectTemplateChange={setSubjectTemplate}
            onBodyTemplateChange={setBodyTemplate}
            onMessageTemplateChange={setMessageTemplate}
            variables={variables}
          />
        </div>
      )
    }

    if (isGDrive) {
      const selectedCount = Object.keys(driveSelections).length
      return (
        <div className="uneevo-card p-8 rounded-[28px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] text-center space-y-4 max-w-2xl mx-auto">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-[#ee382b]/10 text-[#ee382b]">
            <Rocket className="h-8 w-8" />
          </div>
          <h2 className="zoho-puvi-headline text-2xl font-bold text-[#121316]">
            Ready to Launch GDrive Campaign
          </h2>
          <p className="text-xs sm:text-sm text-[#62605c] leading-relaxed">
            Campaign <strong className="text-[#121316]">{name}</strong> will share assets across{' '}
            <strong className="text-[#121316]">{selectedCount}</strong> connected Google Drive account{selectedCount !== 1 ? 's' : ''}.
          </p>

          <div className="pt-3 pb-2">
            <div className="p-4 rounded-[16px] bg-[#faf8f4] border border-[#121316]/08 text-left space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#ee382b]">
                ASSET DISTRIBUTION MAPPING
              </div>
              {Object.entries(driveSelections).map(([accountId, selection]) => (
                <div key={accountId} className="text-xs text-[#121316] flex items-center justify-between">
                  <span className="font-mono text-[#62605c] truncate max-w-xs">{accountId}</span>
                  <span className="font-bold text-[#121316]">{selection.driveFileName || 'Attached Asset'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="uneevo-card p-8 rounded-[28px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] text-center space-y-5 max-w-2xl mx-auto">
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-[#ee382b]/10 text-[#ee382b]">
          <Rocket className="h-8 w-8" />
        </div>
        <h2 className="zoho-puvi-headline text-2xl font-bold text-[#121316]">
          Ready to Launch Sequence
        </h2>
        <p className="text-xs sm:text-sm text-[#62605c] leading-relaxed">
          Campaign <strong className="text-[#121316]">{name}</strong> will dispatch through{' '}
          <strong className="text-[#121316]">{senderAccountPreference}</strong> sender accounts at{' '}
          <strong className="text-[#121316]">
            {gradualSendingEnabled ? `${rampPercent}% day-1 warm pace` : 'full unthrottled capacity'}
          </strong>.
        </p>

        <div className="p-4 rounded-[16px] bg-[#faf8f4] border border-[#121316]/08 text-left grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-[10px] font-bold text-[#8a8780] uppercase tracking-wider">Format</div>
            <div className="font-bold text-[#121316] mt-0.5">
              {sendFormat === 'text_only' ? 'Plain Text' : 'Rich HTML'}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#8a8780] uppercase tracking-wider">Open Tracking</div>
            <div className="font-bold text-[#121316] mt-0.5">
              {sendFormat === 'text_only' ? 'Disabled' : openTrackingEnabled ? 'Active' : 'Disabled'}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#8a8780] uppercase tracking-wider">Schedule Mode</div>
            <div className="font-bold text-[#121316] mt-0.5">
              {schedulingMode === 'BUSINESS_HOURS' ? `Business (${timezone})` : 'Continuous 24/7'}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#8a8780] uppercase tracking-wider">Cadence Steps</div>
            <div className="font-bold text-[#121316] mt-0.5">
              {sequenceEnabled ? `${sequenceSteps.length} Steps` : '1 Single Step'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isValid = canGoNext()

  return (
    <div className="space-y-6">
      {/* 3-Step Pill Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {steps.map((s, i) => {
          const isActive = s.key === step
          const isDone = step > s.key
          return (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#121316] text-white border-[#121316] shadow-xs'
                    : isDone
                    ? 'bg-[#0f8a5f]/10 text-[#0f8a5f] border-[#0f8a5f]/20'
                    : 'bg-[#faf8f4] text-[#62605c] border-[#121316]/08'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#0f8a5f]" />
                ) : (
                  <span className="font-mono text-[11px]">{s.key}</span>
                )}
                <span>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <ChevronRight className="h-4 w-4 text-[#8a8780] shrink-0" />
              )}
            </div>
          )
        })}
      </div>

      {/* Main Form Container */}
      <div className="uneevo-card p-6 md:p-8 rounded-[28px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-6">
        {renderStep()}

        {/* Dynamic Validation Errors Warning Box */}
        {validationErrors.length > 0 && (
          <div className="p-4 rounded-[18px] bg-[#ee382b]/08 border-2 border-[#ee382b]/30 text-xs text-[#121316] space-y-2 animate-shake shadow-xs">
            <div className="flex items-center gap-2 font-bold text-sm text-[#ee382b]">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Please resolve the following required item{validationErrors.length > 1 ? 's' : ''} to proceed:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 pl-1 text-[#5c1d19] font-medium">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-[16px] bg-[#ee382b]/08 border border-[#ee382b]/20 text-xs text-[#ee382b] font-medium">
            {error}
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-[#121316]/08">
          <button
            type="button"
            onClick={() => {
              setValidationErrors([])
              setAttemptedProceed(false)
              setStep((prev) => Math.max(1, prev - 1))
            }}
            className={`inline-flex items-center gap-1.5 rounded-full border border-[#121316]/12 bg-white px-5 py-2.5 text-xs font-bold text-[#121316] hover:bg-[#faf8f4] transition ${
              step === 1 ? 'invisible' : 'visible'
            }`}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </button>

          {step < maxStep ? (
            <button
              type="button"
              onClick={handleNextClick}
              className={`inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                isValid
                  ? 'bg-[#ee382b] text-white shadow-[0_6px_20px_rgba(238,56,43,0.22)] hover:bg-[#d92b1f] hover:shadow-[0_10px_28px_rgba(238,56,43,0.32)]'
                  : 'bg-[#ee382b]/80 text-white/90 hover:bg-[#ee382b] hover:shadow-xs ring-1 ring-[#121316]/10'
              }`}
            >
              <span>Next: {steps[step]?.label || 'Continue'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLaunchClick}
              disabled={saving}
              className={`inline-flex items-center gap-2 rounded-full px-7 py-2.5 text-xs sm:text-sm font-bold text-white transition-all cursor-pointer disabled:opacity-50 ${
                isValid
                  ? 'bg-[#0f8a5f] shadow-[0_6px_20px_rgba(15,138,95,0.22)] hover:bg-[#0c724e] hover:shadow-[0_10px_28px_rgba(15,138,95,0.32)]'
                  : 'bg-[#0f8a5f]/80 hover:bg-[#0f8a5f]'
              }`}
            >
              <Rocket className="h-4 w-4" />
              <span>{saving ? 'Launching Sequence...' : 'Launch Outbound Campaign'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
