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
  Sliders,
  Check,
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
    bodyTemplate: `Hi {{firstName}},\n\nWanted to bump this once in case it got buried.\n\nHappy to share the short breakdown if useful.`,
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
      {options.map((option) => {
        return (
          <button
            key={option.key}
            type="button"
            onClick={option.onClick}
            aria-pressed={option.selected}
            className={`p-4 sm:p-5 rounded-[20px] text-left border transition-all duration-200 cursor-pointer ${
              option.selected
                ? 'border-[#ee382b] bg-white shadow-[0_8px_24px_rgba(238,56,43,0.08)] ring-1 ring-[#ee382b]/30'
                : 'border-[#121316]/08 bg-[#faf8f4] hover:bg-white hover:border-[#121316]/16 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#121316]">
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
  const [stepIndex, setStepIndex] = useState(1)
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

  // Dynamic step descriptors based on mode
  const wizardSteps = useMemo(() => {
    if (isGDrive) {
      return [
        { key: 'channel', number: 1, label: 'Protocol', title: 'Choose Campaign Protocol', icon: HardDrive },
        { key: 'name', number: 2, label: 'Name', title: 'Campaign Identifier Name', icon: Layers },
        { key: 'csv', number: 3, label: 'Contact Dataset', title: 'Source Contact Dataset (CSV)', icon: FileSpreadsheet },
        { key: 'gdrive_accounts', number: 4, label: 'Drive Assets', title: 'Google Drive Accounts & Shared File', icon: HardDrive },
        { key: 'schedule', number: 5, label: 'Schedule', title: 'Dispatch Schedule & Timezone', icon: Clock },
        { key: 'gdrive_message', number: 6, label: 'Share Note', title: 'Personalized Share Note Composer', icon: Mail },
        { key: 'launch', number: 7, label: 'Review & Launch', title: 'Review & Launch Campaign', icon: Rocket },
      ]
    }
    return [
      { key: 'channel', number: 1, label: 'Protocol', title: 'Choose Campaign Protocol', icon: Mail },
      { key: 'name', number: 2, label: 'Name', title: 'Campaign Identifier Name', icon: Layers },
      { key: 'csv', number: 3, label: 'Contact Dataset', title: 'Source Contact Dataset (CSV)', icon: FileSpreadsheet },
      { key: 'sender_pool', number: 4, label: 'Sender Mailboxes', title: 'Sender Pool & Pacing', icon: Shuffle },
      { key: 'schedule', number: 5, label: 'Schedule', title: 'Dispatch Schedule & Timezone', icon: Clock },
      { key: 'format', number: 6, label: 'Format & Tracking', title: 'Email Format & Tracking', icon: Eye },
      { key: 'sequence', number: 7, label: 'Message & Cadence', title: 'Message & Cadence Sequence', icon: Sparkles },
      { key: 'launch', number: 8, label: 'Review & Launch', title: 'Review & Launch Sequence', icon: Rocket },
    ]
  }, [isGDrive])

  const totalSteps = wizardSteps.length
  const currentStepDef = wizardSteps[Math.min(stepIndex - 1, totalSteps - 1)] || wizardSteps[0]

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
    // Adjust step index if switching mode
    setStepIndex((prev) => Math.min(prev, isGDrive ? 7 : 8))
  }, [mode, bodyTemplate, isGDrive])

  const variables = useMemo<TemplateVariableOption[]>(
    () => getAvailableTemplateVariables(columnMap),
    [columnMap]
  )
  const hasEmailMapping = Boolean(getMappedPredefinedField(columnMap, 'email'))
  const selectedCsv = useMemo(() => csvFiles.find((f) => f.id === csvFileId), [csvFiles, csvFileId])

  // Step-level validation
  const getValidationErrorsForStepKey = (key: string): string[] => {
    const errs: string[] = []

    if (key === 'name') {
      if (!name.trim()) {
        errs.push('Please enter a Campaign Identifier Name.')
      }
    }

    if (key === 'csv') {
      if (!csvFileId) {
        errs.push('Please select a Source Contact Dataset (CSV).')
      } else if (!hasEmailMapping) {
        errs.push(
          `The selected CSV dataset ("${selectedCsv?.originalName || 'file'}") does not have an Email column mapped. Click "Edit CSV Column Mapping" to assign an email column.`
        )
      }
    }

    if (key === 'gdrive_accounts') {
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

    if (key === 'gdrive_message') {
      if (!bodyTemplate.trim()) {
        errs.push('Please enter the GDrive share note message content.')
      }
    }

    if (key === 'sequence') {
      if (sequenceEnabled) {
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

  // Clear validation errors on state change if valid
  useEffect(() => {
    if (attemptedProceed) {
      const errors = getValidationErrorsForStepKey(currentStepDef.key)
      setValidationErrors(errors)
    }
  }, [name, csvFileId, hasEmailMapping, driveSelections, bodyTemplate, subjectTemplate, sequenceSteps, sequenceEnabled, currentStepDef.key]) // eslint-disable-line react-hooks/exhaustive-deps

  const isCurrentStepValid = () => {
    return getValidationErrorsForStepKey(currentStepDef.key).length === 0
  }

  const handleNextClick = () => {
    const errors = getValidationErrorsForStepKey(currentStepDef.key)
    if (errors.length > 0) {
      setValidationErrors(errors)
      setAttemptedProceed(true)
      toast.error(errors[0], {
        description: errors.length > 1 ? `Plus ${errors.length - 1} other issue(s)` : undefined,
      })
      return
    }

    setValidationErrors([])
    setAttemptedProceed(false)
    setStepIndex((prev) => Math.min(totalSteps, prev + 1))
  }

  const handleStepJump = (targetStepNumber: number) => {
    // Allow jumping backwards anytime, or jumping to next step if current is valid
    if (targetStepNumber <= stepIndex) {
      setValidationErrors([])
      setAttemptedProceed(false)
      setStepIndex(targetStepNumber)
      return
    }

    const errors = getValidationErrorsForStepKey(currentStepDef.key)
    if (errors.length > 0) {
      setValidationErrors(errors)
      setAttemptedProceed(true)
      toast.error(errors[0])
      return
    }

    setValidationErrors([])
    setAttemptedProceed(false)
    setStepIndex(targetStepNumber)
  }

  const handleLaunchClick = () => {
    const allErrors: string[] = []
    wizardSteps.forEach((s) => {
      allErrors.push(...getValidationErrorsForStepKey(s.key))
    })

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

  const rampPercent = getGradualSendingPercent(
    gradualSendingEnabled,
    new Date(),
    new Date(),
    timezone
  )

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

  // Render individual step content (One field / concept per step)
  const renderCurrentStepContent = () => {
    const key = currentStepDef.key

    switch (key) {
      case 'channel':
        return (
          <div className="space-y-6">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#ee382b] block">
                STEP 1 OF {totalSteps} • PROTOCOL
              </span>
              <h2 className="zoho-puvi-headline text-2xl sm:text-3xl font-bold text-[#121316]">
                Select Campaign Protocol
              </h2>
              <p className="text-xs sm:text-sm text-[#62605c]">
                Choose how your sequence will be delivered to prospect leads.
              </p>
            </div>
            <CampaignModeSelector value={mode} onChange={setMode} />
          </div>
        )

      case 'name':
        return (
          <div className="space-y-6">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#ee382b] block">
                STEP 2 OF {totalSteps} • IDENTIFIER
              </span>
              <h2 className="zoho-puvi-headline text-2xl sm:text-3xl font-bold text-[#121316]">
                Name Your Campaign
              </h2>
              <p className="text-xs sm:text-sm text-[#62605c]">
                Give this sequence a descriptive identifier to easily track analytics and performance.
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                autoFocus
                placeholder={isGDrive ? 'e.g., Q3 Founders Drive Outreach' : 'e.g., Q3 SaaS Founders Outreach'}
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (validationErrors.length > 0) setValidationErrors([])
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && name.trim()) {
                    e.preventDefault()
                    handleNextClick()
                  }
                }}
                className={`w-full rounded-[18px] border px-5 py-4 text-base sm:text-lg font-medium text-[#121316] placeholder:text-[#8a8780] shadow-sm transition focus:bg-white focus:outline-none ${
                  attemptedProceed && !name.trim()
                    ? 'border-[#ee382b] bg-[#ee382b]/05 ring-2 ring-[#ee382b]/20'
                    : 'border-[#121316]/12 bg-[#faf8f4] focus:border-[#ee382b]'
                }`}
              />

              {/* Quick Suggestion Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-semibold text-[#8a8780]">Quick suggestions:</span>
                {[
                  isGDrive ? 'Q3 Deck Sharing' : 'Founder Cold Outreach',
                  isGDrive ? 'Product Demo Drive' : 'Enterprise SaaS Leads',
                  'Inbound Follow-up Q4',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setName(suggestion)}
                    className="rounded-full border border-[#121316]/10 bg-white px-3 py-1 text-xs font-semibold text-[#121316] hover:bg-[#faf8f4] hover:border-[#121316]/20 transition"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>

              {attemptedProceed && !name.trim() && (
                <p className="text-xs font-semibold text-[#ee382b] flex items-center gap-1.5 pt-1">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Please enter a campaign name to proceed.</span>
                </p>
              )}
            </div>
          </div>
        )

      case 'csv': {
        const isMissingCsv = attemptedProceed && !csvFileId
        const isMissingEmailCol = attemptedProceed && csvFileId && !hasEmailMapping

        return (
          <div className="space-y-6">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#ee382b] block">
                STEP 3 OF {totalSteps} • TARGET AUDIENCE
              </span>
              <h2 className="zoho-puvi-headline text-2xl sm:text-3xl font-bold text-[#121316]">
                Select Prospect Dataset
              </h2>
              <p className="text-xs sm:text-sm text-[#62605c]">
                Choose the verified contact CSV list to target in this outbound cadence.
              </p>
            </div>

            <div className="space-y-4">
              {csvLoading ? (
                <div className="p-8 text-center text-xs text-[#62605c] bg-[#faf8f4] rounded-[20px] border border-[#121316]/08 animate-pulse">
                  Loading contact datasets...
                </div>
              ) : csvFiles.length === 0 ? (
                <div className="p-6 bg-[#ee382b]/05 border-2 border-dashed border-[#ee382b]/30 rounded-[22px] text-center space-y-3">
                  <FileSpreadsheet className="h-10 w-10 text-[#ee382b] mx-auto" />
                  <div className="text-sm font-bold text-[#121316]">No CSV Datasets Found</div>
                  <p className="text-xs text-[#62605c] max-w-sm mx-auto">
                    You need to upload at least one prospect CSV contact file before launching a sequence.
                  </p>
                  <Link
                    href="/csv/upload"
                    target="_blank"
                    className="inline-flex items-center gap-2 rounded-full bg-[#121316] px-5 py-2.5 text-xs font-bold text-white hover:bg-black transition shadow-xs"
                  >
                    <span>Upload CSV Dataset</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <select
                    value={csvFileId}
                    onChange={(event) => {
                      setCsvFileId(event.target.value)
                      if (validationErrors.length > 0) setValidationErrors([])
                    }}
                    className={`w-full rounded-[18px] border px-5 py-4 text-sm sm:text-base font-medium text-[#121316] transition focus:bg-white focus:outline-none ${
                      isMissingCsv || isMissingEmailCol
                        ? 'border-[#ee382b] bg-[#ee382b]/05 ring-2 ring-[#ee382b]/20'
                        : 'border-[#121316]/12 bg-[#faf8f4] focus:border-[#ee382b]'
                    }`}
                  >
                    <option value="" disabled>
                      Select a prospect dataset...
                    </option>
                    {csvFiles.map((csv) => (
                      <option key={csv.id} value={csv.id}>
                        {csv.originalName} ({csv.rowCount.toLocaleString()} verified contacts)
                      </option>
                    ))}
                  </select>

                  {/* Selected CSV summary badge */}
                  {selectedCsv && (
                    <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-[18px] bg-[#faf8f4] border border-[#121316]/08">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#121316] text-white">
                          <FileSpreadsheet className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#121316]">{selectedCsv.originalName}</div>
                          <div className="text-[11px] text-[#62605c]">
                            {selectedCsv.rowCount.toLocaleString()} total rows
                          </div>
                        </div>
                      </div>

                      {hasEmailMapping ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0f8a5f]/10 text-[#0f8a5f] border border-[#0f8a5f]/20 text-xs font-bold">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Email Column Mapped</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ee382b]/10 text-[#ee382b] border border-[#ee382b]/20 text-xs font-bold">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>Missing Email Mapping</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Missing Email Mapping Callout */}
                  {csvFileId && !hasEmailMapping && (
                    <div className="rounded-[20px] border-2 border-[#ee382b]/30 bg-[#ee382b]/08 p-5 text-xs text-[#121316] space-y-3 shadow-xs">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-[#ee382b] shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <div className="font-bold text-[#ee382b] text-xs uppercase tracking-wider">
                            Action Required: Missing Email Column Mapping
                          </div>
                          <p className="text-xs text-[#5c1d19] leading-relaxed">
                            This CSV has not mapped an <strong>Email Address</strong> column yet. Campaigns require an email column to know where to deliver messages.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-1">
                        <Link
                          href={`/csv/${csvFileId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#121316] px-4 py-2 text-xs font-bold text-white hover:bg-black transition shadow-xs"
                        >
                          <span>Edit CSV Column Mapping</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                        <span className="text-[11px] text-[#62605c]">
                          (Opens in new tab so you don't lose your progress)
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <Link
                      href="/csv/upload"
                      target="_blank"
                      className="text-xs font-bold text-[#62605c] hover:text-[#121316] inline-flex items-center gap-1 transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Upload another dataset</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      }

      case 'sender_pool':
        return (
          <div className="space-y-6">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#ee382b] block">
                STEP 4 OF {totalSteps} • SENDER INFRASTRUCTURE
              </span>
              <h2 className="zoho-puvi-headline text-2xl sm:text-3xl font-bold text-[#121316]">
                Sender Mailboxes & Deliverability
              </h2>
              <p className="text-xs sm:text-sm text-[#62605c]">
                Configure mailbox selection preferences and volume ramp-up for inbox reputation protection.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#8a8780] mb-2.5 block">
                  MAILBOX ROUTING PREFERENCE
                </label>
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
                    desc: 'Route specifically through Gmail and Google Workspace sender accounts.',
                    selected: senderAccountPreference === 'gmail',
                    onClick: () => setSenderAccountPreference('gmail'),
                  },
                  {
                    key: 'zoho',
                    label: 'Zoho Mail Only',
                    desc: 'Route specifically through Zoho mail sender infrastructure.',
                    selected: senderAccountPreference === 'zoho',
                    onClick: () => setSenderAccountPreference('zoho'),
                  },
                ])}
              </div>

              <div className="p-5 rounded-[20px] bg-[#faf8f4] border border-[#121316]/08 space-y-2">
                <label className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-[#121316] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gradualSendingEnabled}
                    onChange={(event) => setGradualSendingEnabled(event.target.checked)}
                    className="h-4 w-4 rounded text-[#ee382b] focus:ring-[#ee382b]"
                  />
                  <span>
                    Enable gradual sending volume ramp-up ({rampPercent}% day-1 pace)
                  </span>
                </label>
                <p className="text-xs text-[#62605c] pl-7 leading-relaxed">
                  Gradual ramp protects domain reputation by slowly scaling daily sending volume before reaching maximum capacity.
                </p>
              </div>
            </div>
          </div>
        )

      case 'gdrive_accounts':
        return (
          <div className="space-y-6">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#ee382b] block">
                STEP 4 OF {totalSteps} • GOOGLE DRIVE ASSET
              </span>
              <h2 className="zoho-puvi-headline text-2xl sm:text-3xl font-bold text-[#121316]">
                Connected Drive Accounts & Shared File
              </h2>
              <p className="text-xs sm:text-sm text-[#62605c]">
                Select connected Google Drive accounts and choose the file to share with each lead.
              </p>
            </div>
            <GDriveAccountSelector selections={driveSelections} onChange={setDriveSelections} />
          </div>
        )

      case 'schedule':
        return (
          <div className="space-y-6">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#ee382b] block">
                STEP {isGDrive ? 5 : 5} OF {totalSteps} • TIMING & TIMEZONE
              </span>
              <h2 className="zoho-puvi-headline text-2xl sm:text-3xl font-bold text-[#121316]">
                Dispatch Schedule & Timezone
              </h2>
              <p className="text-xs sm:text-sm text-[#62605c]">
                Define when sequence messages should be dispatched to fit recipient working hours.
              </p>
            </div>

            <div className="space-y-5">
              {renderSelectablePanel([
                {
                  key: 'anytime',
                  label: 'Continuous 24/7',
                  desc: 'Send whenever sender quotas and queue slots are open.',
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
                <div className="p-6 rounded-[22px] bg-[#faf8f4] border border-[#121316]/08 space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-[#8a8780] uppercase tracking-wider mb-1.5 block">
                      Target Timezone
                    </label>
                    <select
                      value={isCustomTimezone ? '__custom__' : timezone}
                      onChange={(event) => handleTimezonePreset(event.target.value)}
                      className="w-full rounded-[14px] border border-[#121316]/12 bg-white px-4 py-3 text-xs sm:text-sm font-medium text-[#121316]"
                    >
                      {TIMEZONE_PRESETS.map((preset) => (
                        <option key={preset.value} value={preset.value}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {isCustomTimezone && (
                    <div>
                      <input
                        type="text"
                        value={timezone}
                        onChange={(event) => setTimezone(event.target.value)}
                        placeholder="e.g. Asia/Kolkata"
                        className="w-full rounded-[14px] border border-[#121316]/12 bg-white px-4 py-3 text-xs sm:text-sm text-[#121316]"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-[#8a8780] uppercase tracking-wider mb-1.5 block">
                        Start Window
                      </label>
                      <input
                        type="time"
                        value={businessHoursStart}
                        onChange={(event) => setBusinessHoursStart(event.target.value)}
                        className="w-full rounded-[14px] border border-[#121316]/12 bg-white px-4 py-2.5 text-xs sm:text-sm text-[#121316]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#8a8780] uppercase tracking-wider mb-1.5 block">
                        End Window
                      </label>
                      <input
                        type="time"
                        value={businessHoursEnd}
                        onChange={(event) => setBusinessHoursEnd(event.target.value)}
                        className="w-full rounded-[14px] border border-[#121316]/12 bg-white px-4 py-2.5 text-xs sm:text-sm text-[#121316]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case 'format':
        return (
          <div className="space-y-6">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#ee382b] block">
                STEP 6 OF {totalSteps} • FORMATTING & TRACKING
              </span>
              <h2 className="zoho-puvi-headline text-2xl sm:text-3xl font-bold text-[#121316]">
                Email Format & Open Tracking
              </h2>
              <p className="text-xs sm:text-sm text-[#62605c]">
                Choose how your email messages are rendered and whether open-rate tracking is active.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setSendFormat('html')
                    setOpenTrackingEnabled(true)
                  }}
                  className={`p-5 rounded-[20px] text-left border transition-all cursor-pointer ${
                    sendFormat === 'html'
                      ? 'border-[#ee382b] bg-white shadow-[0_8px_24px_rgba(238,56,43,0.08)] ring-1 ring-[#ee382b]/30'
                      : 'border-[#121316]/08 bg-[#faf8f4] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-bold text-[#121316]">Rich HTML Format</div>
                    {sendFormat === 'html' && <CheckCircle2 className="h-4 w-4 text-[#ee382b]" />}
                  </div>
                  <div className="text-xs text-[#62605c] leading-relaxed">
                    Standard email formatting supporting styled links, formatting, and invisible open pixel tracking.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSendFormat('text_only')
                    setOpenTrackingEnabled(false)
                  }}
                  className={`p-5 rounded-[20px] text-left border transition-all cursor-pointer ${
                    sendFormat === 'text_only'
                      ? 'border-[#ee382b] bg-white shadow-[0_8px_24px_rgba(238,56,43,0.08)] ring-1 ring-[#ee382b]/30'
                      : 'border-[#121316]/08 bg-[#faf8f4] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-bold text-[#121316]">Plain Text Only</div>
                    {sendFormat === 'text_only' && <CheckCircle2 className="h-4 w-4 text-[#ee382b]" />}
                  </div>
                  <div className="text-xs text-[#62605c] leading-relaxed">
                    Pure plain text without any HTML tags or tracking pixels. Maximizes deliverability for spam filters.
                  </div>
                </button>
              </div>

              {sendFormat !== 'text_only' && (
                <div className="p-5 rounded-[20px] bg-[#faf8f4] border border-[#121316]/08">
                  <label className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-[#121316] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={openTrackingEnabled}
                      onChange={(event) => setOpenTrackingEnabled(event.target.checked)}
                      className="h-4 w-4 rounded text-[#ee382b] focus:ring-[#ee382b]"
                    />
                    <span>Embed invisible open-tracking pixel in messages</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        )

      case 'gdrive_message':
        return (
          <div className="space-y-6">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#ee382b] block">
                STEP 6 OF {totalSteps} • SHARE NOTE COMPOSER
              </span>
              <h2 className="zoho-puvi-headline text-2xl sm:text-3xl font-bold text-[#121316]">
                Compose GDrive Share Note
              </h2>
              <p className="text-xs sm:text-sm text-[#62605c]">
                Craft the personalized message attached to Google Drive's official file share notification.
              </p>
            </div>

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

      case 'sequence':
        return (
          <div className="space-y-6">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#ee382b] block">
                STEP 7 OF {totalSteps} • CONTENT COMPOSER
              </span>
              <h2 className="zoho-puvi-headline text-2xl sm:text-3xl font-bold text-[#121316]">
                Compose Message & Cadence
              </h2>
              <p className="text-xs sm:text-sm text-[#62605c]">
                Draft your initial outreach message and optionally enable multi-step automatic follow-ups.
              </p>
            </div>

            {sequenceEnabled ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-[18px] bg-[#faf8f4] border border-[#121316]/08">
                  <label className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-[#121316] cursor-pointer">
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
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#121316]/12 bg-white px-4 py-2 text-xs font-bold text-[#121316] hover:bg-[#faf8f4] transition shadow-xs cursor-pointer"
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
                            {index === 0 ? 'Step 1 (Initial Outreach)' : `Step ${stepItem.stepNumber} (Follow-up Cadence)`}
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
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ee382b] hover:underline cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>
                            {sequencePreviewLoading[stepItem.stepNumber] ? 'Rendering preview...' : 'Test Row Preview'}
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
                            className="text-xs text-[#c2414c] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
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
            ) : (
              <div className="space-y-6">
                <div className="p-4 rounded-[18px] bg-[#faf8f4] border border-[#121316]/08 flex items-center justify-between">
                  <label className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-[#121316] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sequenceEnabled}
                      onChange={(event) => setSequenceEnabled(event.target.checked)}
                      className="h-4 w-4 rounded text-[#ee382b] focus:ring-[#ee382b]"
                    />
                    <span>Enable multi-step follow-up sequence</span>
                  </label>
                  <span className="text-xs text-[#62605c]">Single email mode</span>
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
            )}
          </div>
        )

      case 'launch': {
        const rowCount = selectedCsv?.rowCount || 0
        const driveCount = Object.keys(driveSelections).length

        return (
          <div className="space-y-6">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#ee382b] block">
                FINAL STEP • REVIEW & LAUNCH
              </span>
              <h2 className="zoho-puvi-headline text-2xl sm:text-3xl font-bold text-[#121316]">
                Review Campaign Configuration
              </h2>
              <p className="text-xs sm:text-sm text-[#62605c]">
                Confirm the details below. Once launched, outbound sequences will begin processing according to your schedule.
              </p>
            </div>

            {/* Overview Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-[22px] bg-[#faf8f4] border border-[#121316]/08 space-y-3">
                <div className="text-[10px] font-bold text-[#8a8780] uppercase tracking-wider">
                  Campaign Overview
                </div>
                <div>
                  <div className="text-base font-bold text-[#121316]">{name}</div>
                  <div className="text-xs text-[#62605c] mt-0.5">
                    Protocol: <strong className="text-[#121316]">{isGDrive ? 'Google Drive Share Outreach' : 'Direct Email Sequence'}</strong>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-[#121316]/06 text-xs text-[#121316]">
                  <FileSpreadsheet className="h-4 w-4 text-[#8a8780]" />
                  <span>{selectedCsv?.originalName || 'No file selected'}</span>
                  <span className="font-mono font-bold text-[#0f8a5f] ml-auto">
                    {rowCount.toLocaleString()} contacts
                  </span>
                </div>
              </div>

              <div className="p-5 rounded-[22px] bg-[#faf8f4] border border-[#121316]/08 space-y-3">
                <div className="text-[10px] font-bold text-[#8a8780] uppercase tracking-wider">
                  Delivery & Timing Settings
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#8a8780] block text-[10px]">Schedule</span>
                    <strong className="text-[#121316]">
                      {schedulingMode === 'BUSINESS_HOURS' ? `Business (${timezone})` : 'Continuous 24/7'}
                    </strong>
                  </div>
                  {!isGDrive ? (
                    <div>
                      <span className="text-[#8a8780] block text-[10px]">Sender Pool</span>
                      <strong className="text-[#121316] capitalize">{senderAccountPreference}</strong>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[#8a8780] block text-[10px]">Drive Accounts</span>
                      <strong className="text-[#121316]">{driveCount} connected</strong>
                    </div>
                  )}
                  {!isGDrive && (
                    <>
                      <div>
                        <span className="text-[#8a8780] block text-[10px]">Format</span>
                        <strong className="text-[#121316]">
                          {sendFormat === 'text_only' ? 'Plain Text' : 'Rich HTML'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[#8a8780] block text-[10px]">Steps</span>
                        <strong className="text-[#121316]">
                          {sequenceEnabled ? `${sequenceSteps.length} Sequence Steps` : '1 Single Email'}
                        </strong>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Launch Banner Card */}
            <div className="p-6 sm:p-8 rounded-[24px] bg-gradient-to-br from-[#121316] to-[#252830] text-white text-center space-y-4 shadow-md">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white mx-auto backdrop-blur-sm">
                <Rocket className="h-7 w-7 text-[#ee382b]" />
              </div>
              <h3 className="zoho-puvi-headline text-xl sm:text-2xl font-bold">
                Ready to Launch Sequence
              </h3>
              <p className="text-xs sm:text-sm text-white/80 max-w-md mx-auto">
                Your campaign is fully configured and ready for automated delivery dispatch.
              </p>
            </div>
          </div>
        )
      }

      default:
        return null
    }
  }

  const progressPercent = Math.round((stepIndex / totalSteps) * 100)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Stepper Breadcrumbs & Progress Indicator */}
      <div className="uneevo-card p-4 sm:p-5 rounded-[22px] border border-[#121316]/08 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.02)] space-y-3.5">
        {/* Progress Bar & Counter */}
        <div className="flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-[#121316] text-white text-[10px] font-mono">
              {stepIndex}
            </span>
            <span className="text-[#121316]">{currentStepDef.title}</span>
          </div>
          <span className="text-[#62605c] font-mono">
            {stepIndex} of {totalSteps} ({progressPercent}%)
          </span>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="h-2 w-full rounded-full bg-[#121316]/08 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#ee382b] transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Clickable Step Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5">
          {wizardSteps.map((s) => {
            const isActive = s.number === stepIndex
            const isCompleted = s.number < stepIndex

            return (
              <button
                key={s.key}
                type="button"
                onClick={() => handleStepJump(s.number)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#121316] text-white shadow-xs'
                    : isCompleted
                    ? 'bg-[#0f8a5f]/10 text-[#0f8a5f] hover:bg-[#0f8a5f]/20'
                    : 'bg-[#faf8f4] text-[#8a8780] hover:text-[#121316] hover:bg-[#121316]/06'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-3 w-3 text-[#0f8a5f]" />
                ) : (
                  <span className="font-mono text-[10px]">{s.number}</span>
                )}
                <span>{s.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Step Card Container */}
      <div className="uneevo-card p-6 sm:p-8 md:p-10 rounded-[28px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-6">
        {renderCurrentStepContent()}

        {/* Dynamic Validation Errors Warning Box */}
        {validationErrors.length > 0 && (
          <div className="p-4 rounded-[18px] bg-[#ee382b]/08 border-2 border-[#ee382b]/30 text-xs text-[#121316] space-y-2 animate-shake shadow-xs">
            <div className="flex items-center gap-2 font-bold text-sm text-[#ee382b]">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Please resolve the following required item{validationErrors.length > 1 ? 's' : ''}:</span>
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

        {/* Wizard Bottom Controls (Back & Next / Launch) */}
        <div className="flex items-center justify-between pt-6 border-t border-[#121316]/08">
          <button
            type="button"
            onClick={() => {
              setValidationErrors([])
              setAttemptedProceed(false)
              setStepIndex((prev) => Math.max(1, prev - 1))
            }}
            disabled={stepIndex === 1}
            className={`inline-flex items-center gap-1.5 rounded-full border border-[#121316]/12 bg-white px-5 py-2.5 text-xs font-bold text-[#121316] hover:bg-[#faf8f4] transition cursor-pointer disabled:opacity-0 disabled:pointer-events-none`}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </button>

          {stepIndex < totalSteps ? (
            <button
              type="button"
              onClick={handleNextClick}
              className={`inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                isCurrentStepValid()
                  ? 'bg-[#ee382b] text-white shadow-[0_6px_20px_rgba(238,56,43,0.22)] hover:bg-[#d92b1f] hover:shadow-[0_10px_28px_rgba(238,56,43,0.32)] active:scale-95'
                  : 'bg-[#ee382b]/80 text-white/90 hover:bg-[#ee382b]'
              }`}
            >
              <span>Next: {wizardSteps[stepIndex]?.label || 'Continue'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLaunchClick}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-[#0f8a5f] px-7 py-3 text-xs sm:text-sm font-bold text-white shadow-[0_6px_20px_rgba(15,138,95,0.22)] hover:bg-[#0c724e] hover:shadow-[0_10px_28px_rgba(15,138,95,0.32)] transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Rocket className="h-4 w-4" />
              <span>{saving ? 'Launching Sequence...' : isGDrive ? 'Launch GDrive Campaign' : 'Launch Outbound Campaign'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
