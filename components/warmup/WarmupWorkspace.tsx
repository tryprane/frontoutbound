'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Flame,
  Gauge,
  Minus,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import type { WarmupOverview } from '@/components/mail-accounts/types'
import { DEFAULT_WARMUP_SETTINGS } from '@/lib/warmupSettings'

interface WarmupSettingsResponse {
  globalEnabled: boolean
  stageCounts: number[]
  businessHoursStart: string
  businessHoursEnd: string
  weekdaysOnly: boolean
  timezone: string
  replyRateTarget: number
  threadContinuationRate: number
  maxThreadDepth: number
  recipientDailyInboundCap: number
  healthActionsEnabled: boolean
}

const TIMEZONE_OPTIONS = [
  { value: 'Asia/Kolkata', label: 'India', offset: 'UTC+05:30' },
  { value: 'Asia/Dubai', label: 'Dubai', offset: 'UTC+04:00' },
  { value: 'Asia/Singapore', label: 'Singapore', offset: 'UTC+08:00' },
  { value: 'Europe/London', label: 'London', offset: 'UTC+00:00 / +01:00' },
  { value: 'Europe/Berlin', label: 'Central Europe', offset: 'UTC+01:00 / +02:00' },
  { value: 'America/New_York', label: 'US Eastern', offset: 'UTC-05:00 / -04:00' },
  { value: 'America/Chicago', label: 'US Central', offset: 'UTC-06:00 / -05:00' },
  { value: 'America/Denver', label: 'US Mountain', offset: 'UTC-07:00 / -06:00' },
  { value: 'America/Los_Angeles', label: 'US Pacific', offset: 'UTC-08:00 / -07:00' },
  { value: 'Australia/Sydney', label: 'Sydney', offset: 'UTC+10:00 / +11:00' },
  { value: 'UTC', label: 'UTC', offset: 'UTC+00:00' },
]

const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hours = Math.floor(index / 2)
  const minutes = index % 2 === 0 ? '00' : '30'
  const value = `${String(hours).padStart(2, '0')}:${minutes}`
  const displayHour = hours % 12 || 12
  return {
    value,
    label: `${displayHour}:${minutes} ${hours < 12 ? 'AM' : 'PM'}`,
  }
})

const FALLBACK_STAGE_COUNTS = DEFAULT_WARMUP_SETTINGS.stageCounts

function withSettingsFallbacks(data: Partial<WarmupSettingsResponse>): WarmupSettingsResponse {
  return {
    globalEnabled: data.globalEnabled ?? DEFAULT_WARMUP_SETTINGS.globalEnabled,
    stageCounts: data.stageCounts?.length ? data.stageCounts : FALLBACK_STAGE_COUNTS,
    businessHoursStart: data.businessHoursStart || DEFAULT_WARMUP_SETTINGS.businessHoursStart,
    businessHoursEnd: data.businessHoursEnd || DEFAULT_WARMUP_SETTINGS.businessHoursEnd,
    weekdaysOnly: data.weekdaysOnly ?? DEFAULT_WARMUP_SETTINGS.weekdaysOnly,
    timezone: data.timezone || DEFAULT_WARMUP_SETTINGS.timezone,
    replyRateTarget: data.replyRateTarget ?? DEFAULT_WARMUP_SETTINGS.replyRateTarget,
    threadContinuationRate:
      data.threadContinuationRate ?? DEFAULT_WARMUP_SETTINGS.threadContinuationRate,
    maxThreadDepth: data.maxThreadDepth ?? DEFAULT_WARMUP_SETTINGS.maxThreadDepth,
    recipientDailyInboundCap:
      data.recipientDailyInboundCap ?? DEFAULT_WARMUP_SETTINGS.recipientDailyInboundCap,
    healthActionsEnabled:
      data.healthActionsEnabled ?? DEFAULT_WARMUP_SETTINGS.healthActionsEnabled,
  }
}

function SelectField({
  id,
  value,
  onChange,
  children,
  disabled = false,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full h-11 px-3.5 pr-10 rounded-xl border border-[#121316]/12 bg-[#faf8f4] text-xs sm:text-sm font-medium text-[#121316] appearance-none focus:outline-none focus:ring-2 focus:ring-[#ee382b]/20 focus:border-[#ee382b] focus:bg-white transition-all disabled:cursor-not-allowed disabled:opacity-60"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8780]" />
    </div>
  )
}

function Stepper({
  value,
  onChange,
  min,
  max,
  label,
}: {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  label: string
}) {
  return (
    <div className="grid h-9 grid-cols-[36px_minmax(48px,1fr)_36px] overflow-hidden rounded-xl border border-[#121316]/12 bg-[#faf8f4] shadow-2xs">
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        title={`Decrease ${label}`}
        className="flex items-center justify-center border-r border-[#121316]/08 text-[#62605c] hover:text-[#121316] transition hover:bg-[#121316]/05 disabled:opacity-35 cursor-pointer"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <Input
        aria-label={label}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Math.max(min, Math.min(max, Number(event.target.value || min))))}
        className="h-9 rounded-none border-0 bg-transparent px-1 text-center font-mono text-xs font-bold text-[#121316] shadow-none focus-visible:ring-0"
      />
      <button
        type="button"
        aria-label={`Increase ${label}`}
        title={`Increase ${label}`}
        className="flex items-center justify-center border-l border-[#121316]/08 text-[#62605c] hover:text-[#121316] transition hover:bg-[#121316]/05 disabled:opacity-35 cursor-pointer"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// Color palettes for different warmup ramp stages (from energetic coral-amber to vibrant deliverability gradient)
const STAGE_GRADIENTS = [
  'bg-gradient-to-r from-[#d97706] to-[#f59e0b]', // Stage 1 (Gentle start)
  'bg-gradient-to-r from-[#d97706] to-[#ea580c]', // Stage 2
  'bg-gradient-to-r from-[#ea580c] to-[#ee382b]', // Stage 3
  'bg-gradient-to-r from-[#ee382b] to-[#dc2626]', // Stage 4
  'bg-gradient-to-r from-[#ee382b] via-[#ea580c] to-[#0f8a5f]', // Stage 5
  'bg-gradient-to-r from-[#ee382b] to-[#0f8a5f]', // Stage 6
  'bg-gradient-to-r from-[#0f8a5f] to-[#10b981]', // Stage 7 (Peak deliverability)
]

export function WarmupWorkspace() {
  const [settings, setSettings] = useState<WarmupSettingsResponse>(
    withSettingsFallbacks(DEFAULT_WARMUP_SETTINGS)
  )
  const [savedSettings, setSavedSettings] = useState<WarmupSettingsResponse>(
    withSettingsFallbacks(DEFAULT_WARMUP_SETTINGS)
  )
  const [overview, setOverview] = useState<WarmupOverview | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const isDirty = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(savedSettings),
    [savedSettings, settings]
  )
  const windowIsValid = settings.businessHoursStart < settings.businessHoursEnd
  const totalMailboxes = overview?.total ?? 0
  const warmedPercent = totalMailboxes > 0 ? Math.round(((overview?.warmed ?? 0) / totalMailboxes) * 100) : 0

  const timezoneOptions = useMemo(() => {
    if (TIMEZONE_OPTIONS.some((option) => option.value === settings.timezone)) return TIMEZONE_OPTIONS
    return [
      { value: settings.timezone, label: settings.timezone, offset: 'Current setting' },
      ...TIMEZONE_OPTIONS,
    ]
  }, [settings.timezone])

  const persistSettings = async (
    nextSettings: WarmupSettingsResponse,
    successText = 'Warmup settings saved.'
  ) => {
    if (nextSettings.businessHoursStart >= nextSettings.businessHoursEnd) {
      setMessage({ type: 'error', text: 'Warmup end time must be later than the start time.' })
      return false
    }

    setMessage(null)
    setIsSaving(true)
    try {
      const response = await fetch('/api/warmup-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextSettings),
      })
      if (!response.ok) throw new Error('Failed to save')

      const data = withSettingsFallbacks((await response.json()) as WarmupSettingsResponse)
      setSettings(data)
      setSavedSettings(data)
      setMessage({ type: 'success', text: successText })
      return true
    } catch {
      setMessage({ type: 'error', text: 'Unable to save warmup settings.' })
      return false
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    const loadWorkspace = async () => {
      try {
        const [settingsResponse, overviewResponse] = await Promise.all([
          fetch('/api/warmup-settings'),
          fetch('/api/mail-accounts?resource=warmup-overview'),
        ])
        if (!settingsResponse.ok || !overviewResponse.ok) throw new Error('Failed to load')

        const [settingsData, overviewData] = await Promise.all([
          settingsResponse.json() as Promise<WarmupSettingsResponse>,
          overviewResponse.json() as Promise<WarmupOverview>,
        ])
        if (!isMounted) return

        const nextSettings = withSettingsFallbacks(settingsData)
        setSettings(nextSettings)
        setSavedSettings(nextSettings)
        setOverview(overviewData)
      } catch {
        if (isMounted) {
          setMessage({ type: 'error', text: 'Unable to load the warmup workspace right now.' })
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void loadWorkspace()
    return () => {
      isMounted = false
    }
  }, [])

  const updateStageCount = (index: number, value: number) => {
    setSettings((current) => {
      const stageCounts = [...current.stageCounts]
      stageCounts[index] = value
      return { ...current, stageCounts }
    })
  }

  const updateStartTime = (businessHoursStart: string) => {
    const nextEnd =
      settings.businessHoursEnd > businessHoursStart
        ? settings.businessHoursEnd
        : TIME_OPTIONS.find((option) => option.value > businessHoursStart)?.value || '23:30'
    setSettings((current) => ({ ...current, businessHoursStart, businessHoursEnd: nextEnd }))
  }

  return (
    <div className="animate-fade-in space-y-4 pb-10">
      {/* Top Floating Status & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2.5">
          <span
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm backdrop-blur-md ${
              settings.globalEnabled
                ? 'bg-white/90 text-[#0f8a5f] border border-[#0f8a5f]/25'
                : 'bg-white/90 text-[#d97706] border border-[#d97706]/25'
            }`}
          >
            <span
              className={`flex h-2 w-2 rounded-full ${
                settings.globalEnabled ? 'bg-[#0f8a5f] animate-pulse' : 'bg-[#d97706]'
              }`}
            />
            <span>{settings.globalEnabled ? 'Warmup Active' : 'Engine Paused'}</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 ml-auto">
          <div className="flex items-center gap-2.5 rounded-full border border-[#121316]/10 bg-white/90 backdrop-blur-md px-3.5 py-1.5 shadow-sm">
            <span className="text-xs font-semibold text-[#121316]">Warmup Engine</span>
            <Switch
              checked={settings.globalEnabled}
              disabled={isLoading || isSaving}
              onCheckedChange={async (globalEnabled) => {
                const previous = settings
                const nextSettings = { ...settings, globalEnabled }
                setSettings(nextSettings)
                const saved = await persistSettings(
                  nextSettings,
                  globalEnabled ? 'Warmup engine resumed.' : 'Warmup engine paused.'
                )
                if (!saved) setSettings(previous)
              }}
            />
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full border border-[#121316]/10 bg-white/90 backdrop-blur-md text-[#121316] hover:bg-white shadow-sm cursor-pointer"
            title="Reset to defaults"
            aria-label="Reset to defaults"
            disabled={isLoading || isSaving}
            onClick={() => setSettings(withSettingsFallbacks(DEFAULT_WARMUP_SETTINGS))}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-[#ee382b] px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow-[0_4px_16px_rgba(238,56,43,0.28)] transition-all hover:bg-[#d92b1f] hover:shadow-[0_8px_24px_rgba(238,56,43,0.38)] active:scale-95 disabled:opacity-50 cursor-pointer"
            disabled={isLoading || isSaving || !isDirty || !windowIsValid}
            onClick={() => void persistSettings(settings)}
          >
            {isSaving ? <Flame className="h-4 w-4 animate-pulse" /> : <Save className="h-4 w-4" />}
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {message ? (
        <div
          role="status"
          className={`flex items-center gap-2.5 rounded-[18px] border p-4 text-xs font-semibold shadow-xs ${
            message.type === 'success'
              ? 'border-[#0f8a5f]/20 bg-[#0f8a5f]/10 text-[#0f8a5f]'
              : 'border-[#ee382b]/20 bg-[#ee382b]/10 text-[#ee382b]'
          }`}
        >
          {message.type === 'success' ? <Check className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
          <span>{message.text}</span>
        </div>
      ) : null}

      {/* 4 Counter Stat Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ['Total Mailboxes', totalMailboxes, '#121316'],
          ['In Warmup Ramp', overview?.warming ?? 0, '#d97706'],
          ['Ready / Warmed', overview?.warmed ?? 0, '#0f8a5f'],
          ['Paused Accounts', overview?.paused ?? 0, '#62605c'],
        ].map(([label, value, color]) => (
          <div
            key={label as string}
            className="uneevo-card p-4 sm:p-5 rounded-2xl border border-[#121316]/10 bg-white shadow-2xs"
          >
            <div className="font-mono text-xl sm:text-2xl font-bold tabular-nums" style={{ color: color as string }}>
              {isLoading ? '—' : value}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#8a8780] mt-1">{label as string}</div>
          </div>
        ))}
      </section>

      {/* Main Form Grid */}
      <main className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
        {/* Left Column: Schedule & Ramp Plan */}
        <div className="space-y-4">
          {/* Warmup Schedule Card */}
          <section className="uneevo-card rounded-[22px] border border-[#121316]/12 bg-white shadow-2xs overflow-hidden">
            <div className="flex items-center gap-3 border-b border-[#121316]/08 px-5 py-4 bg-[#faf8f4]">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#121316]/10 flex items-center justify-center text-[#ee382b] shadow-2xs">
                <Clock3 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#121316]">Warmup Schedule</h2>
                <p className="text-xs text-[#62605c]">
                  {settings.businessHoursStart}–{settings.businessHoursEnd} in {settings.timezone}
                </p>
              </div>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="warmup-timezone" className="text-[11px] font-bold uppercase tracking-wider text-[#62605c]">
                  Timezone
                </Label>
                <SelectField
                  id="warmup-timezone"
                  value={settings.timezone}
                  disabled={isLoading}
                  onChange={(timezone) => setSettings((current) => ({ ...current, timezone }))}
                >
                  {timezoneOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} · {option.offset} · {option.value}
                    </option>
                  ))}
                </SelectField>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="warmup-window-start" className="text-[11px] font-bold uppercase tracking-wider text-[#62605c]">
                  Start Time
                </Label>
                <SelectField
                  id="warmup-window-start"
                  value={settings.businessHoursStart}
                  disabled={isLoading}
                  onChange={updateStartTime}
                >
                  {TIME_OPTIONS.slice(0, -1).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </SelectField>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="warmup-window-end" className="text-[11px] font-bold uppercase tracking-wider text-[#62605c]">
                  End Time
                </Label>
                <SelectField
                  id="warmup-window-end"
                  value={settings.businessHoursEnd}
                  disabled={isLoading}
                  onChange={(businessHoursEnd) =>
                    setSettings((current) => ({ ...current, businessHoursEnd }))
                  }
                >
                  {TIME_OPTIONS.filter((option) => option.value > settings.businessHoursStart).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </SelectField>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-[#62605c]">
                  Active Days
                </Label>
                <div className="grid grid-cols-2 rounded-xl bg-[#faf8f4] border border-[#121316]/08 p-1 gap-1" role="group" aria-label="Active days">
                  {[
                    { label: 'Monday–Friday', value: true, icon: CalendarDays },
                    { label: 'Every day', value: false, icon: Flame },
                  ].map((option) => {
                    const selected = settings.weekdaysOnly === option.value
                    const Icon = option.icon
                    return (
                      <button
                        key={option.label}
                        type="button"
                        aria-pressed={selected}
                        className={`flex min-h-9 items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold transition cursor-pointer ${
                          selected
                            ? 'bg-white text-[#121316] shadow-2xs border border-[#121316]/08'
                            : 'text-[#62605c] hover:text-[#121316]'
                        }`}
                        onClick={() => setSettings((current) => ({ ...current, weekdaysOnly: option.value }))}
                      >
                        <Icon className={`h-3.5 w-3.5 ${selected ? 'text-[#ee382b]' : 'text-[#8a8780]'}`} />
                        <span>{option.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Daily Ramp Plan Card */}
          <section className="uneevo-card rounded-[22px] border border-[#121316]/12 bg-white shadow-2xs overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-[#121316]/08 px-5 py-4 bg-[#faf8f4]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-[#121316]/10 flex items-center justify-center text-[#ee382b] shadow-2xs">
                  <Gauge className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-[#121316]">Daily Ramp Plan</h2>
                  <p className="text-xs text-[#62605c]">Emails per mailbox at each maturity stage</p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#ee382b] bg-[#ee382b]/10 border border-[#ee382b]/20 px-2.5 py-1 rounded-full font-mono">
                Peak {Math.max(...settings.stageCounts)}/day
              </span>
            </div>

            <div className="divide-y divide-[#121316]/08">
              {settings.stageCounts.map((count, index) => {
                const progress = Math.max(8, Math.round((count / Math.max(...settings.stageCounts, 1)) * 100))
                const gradientClass = STAGE_GRADIENTS[index] || STAGE_GRADIENTS[STAGE_GRADIENTS.length - 1]

                return (
                  <div
                    key={`stage-${index}`}
                    className="grid items-center gap-3 px-5 py-3 sm:grid-cols-[96px_minmax(120px,1fr)_140px] hover:bg-[#faf8f4]/50 transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#121316]">Stage {index + 1}</div>
                      <div className="text-[10px] text-[#8a8780] font-mono">Day {index + 1}+</div>
                    </div>
                    {/* Vibrant Stage Slider / Bar */}
                    <div className="h-2 overflow-hidden rounded-full bg-[#121316]/06 p-0.5">
                      <div
                        className={`h-full rounded-full ${gradientClass} transition-all duration-300 shadow-xs`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <Stepper
                      value={count}
                      min={1}
                      max={500}
                      label={`Stage ${index + 1} daily emails`}
                      onChange={(value) => updateStageCount(index, value)}
                    />
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        {/* Right Column: Conversation & Safety */}
        <section className="uneevo-card rounded-[22px] border border-[#121316]/12 bg-white shadow-2xs overflow-hidden xl:sticky xl:top-4">
          <div className="flex items-center gap-3 border-b border-[#121316]/08 px-5 py-4 bg-[#faf8f4]">
            <div className="w-8 h-8 rounded-lg bg-white border border-[#121316]/10 flex items-center justify-center text-[#0f8a5f] shadow-2xs">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#121316]">Conversation & Safety</h2>
              <p className="text-xs text-[#62605c]">Engagement targets and mailbox protection</p>
            </div>
          </div>

          <div className="space-y-5 p-5">
            {/* Reply Target */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="warmup-reply-rate-target" className="text-xs font-semibold text-[#121316]">
                  Reply Target
                </Label>
                <span className="font-mono text-xs font-bold text-[#0f8a5f] bg-[#0f8a5f]/10 border border-[#0f8a5f]/20 px-2 py-0.5 rounded-full">
                  {Math.round(settings.replyRateTarget * 100)}%
                </span>
              </div>
              <input
                id="warmup-reply-rate-target"
                type="range"
                min={0}
                max={100}
                step={5}
                value={Math.round(settings.replyRateTarget * 100)}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, replyRateTarget: Number(event.target.value) / 100 }))
                }
                className="h-2 w-full cursor-pointer accent-[#ee382b] bg-[#121316]/08 rounded-full"
              />
              <div className="flex justify-between text-[10px] text-[#8a8780] font-mono">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Continue Existing Threads */}
            <div className="space-y-2 border-t border-[#121316]/08 pt-4">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="warmup-thread-rate" className="text-xs font-semibold text-[#121316]">
                  Continue Existing Threads
                </Label>
                <span className="font-mono text-xs font-bold text-[#ee382b] bg-[#ee382b]/10 border border-[#ee382b]/20 px-2 py-0.5 rounded-full">
                  {Math.round(settings.threadContinuationRate * 100)}%
                </span>
              </div>
              <input
                id="warmup-thread-rate"
                type="range"
                min={0}
                max={100}
                step={5}
                value={Math.round(settings.threadContinuationRate * 100)}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    threadContinuationRate: Number(event.target.value) / 100,
                  }))
                }
                className="h-2 w-full cursor-pointer accent-[#ee382b] bg-[#121316]/08 rounded-full"
              />
              <div className="flex justify-between text-[10px] text-[#8a8780]">
                <span>New threads</span>
                <span>Existing threads</span>
              </div>
            </div>

            {/* Thread Depth & Inbound Cap */}
            <div className="grid gap-3 border-t border-[#121316]/08 pt-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-[#62605c]">
                  Max Thread Depth
                </Label>
                <Stepper
                  value={settings.maxThreadDepth}
                  min={1}
                  max={10}
                  label="Maximum thread depth"
                  onChange={(maxThreadDepth) => setSettings((current) => ({ ...current, maxThreadDepth }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-[#62605c]">
                  Mailbox Receiving Cap
                </Label>
                <Stepper
                  value={settings.recipientDailyInboundCap}
                  min={1}
                  max={500}
                  label="Mailbox receiving cap"
                  onChange={(recipientDailyInboundCap) =>
                    setSettings((current) => ({ ...current, recipientDailyInboundCap }))
                  }
                />
              </div>
            </div>

            {/* Automated Health Actions Toggle */}
            <div className="flex items-center justify-between gap-4 border-t border-[#121316]/08 pt-4">
              <div>
                <div className="text-xs font-bold text-[#121316]">Automated Health Actions</div>
                <div className="text-[11px] text-[#62605c]">Pause risky warmup activity automatically</div>
              </div>
              <Switch
                checked={settings.healthActionsEnabled}
                onCheckedChange={(healthActionsEnabled) =>
                  setSettings((current) => ({ ...current, healthActionsEnabled }))
                }
              />
            </div>

            {/* Mailbox Readiness Progress */}
            <div className="border-t border-[#121316]/08 pt-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#121316]">Mailbox Readiness</span>
                <span className="font-mono font-bold text-[#0f8a5f]">{warmedPercent}% warmed</span>
              </div>
              <div className="h-2 w-full bg-[#121316]/08 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#ee382b] to-[#0f8a5f] transition-all duration-500"
                  style={{ width: `${warmedPercent}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                {[
                  ['AUTO', overview?.autoEnabled ?? 0],
                  ['COLD', overview?.cold ?? 0],
                  ['ACTIVE', overview?.activeMailboxes ?? 0],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-[#faf8f4] border border-[#121316]/06 p-2.5">
                    <div className="text-base font-bold font-mono text-[#121316]">{isLoading ? '—' : value}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#8a8780] mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
