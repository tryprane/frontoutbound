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
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
        className="input-base h-11 appearance-none pr-10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
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
    <div className="grid h-10 grid-cols-[40px_minmax(54px,1fr)_40px] overflow-hidden rounded-lg border border-black/10 bg-white">
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        title={`Decrease ${label}`}
        className="flex items-center justify-center border-r border-black/8 text-[var(--text-secondary)] transition hover:bg-black/[0.03] disabled:opacity-35"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Minus className="h-4 w-4" />
      </button>
      <Input
        aria-label={label}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Math.max(min, Math.min(max, Number(event.target.value || min))))}
        className="h-10 rounded-none border-0 bg-transparent px-1 text-center shadow-none focus-visible:ring-0"
      />
      <button
        type="button"
        aria-label={`Increase ${label}`}
        title={`Increase ${label}`}
        className="flex items-center justify-center border-l border-black/8 text-[var(--text-secondary)] transition hover:bg-black/[0.03] disabled:opacity-35"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}

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
    const nextEnd = settings.businessHoursEnd > businessHoursStart
      ? settings.businessHoursEnd
      : TIME_OPTIONS.find((option) => option.value > businessHoursStart)?.value || '23:30'
    setSettings((current) => ({ ...current, businessHoursStart, businessHoursEnd: nextEnd }))
  }

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      {/* Top Floating Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2.5">
          <span
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold shadow-sm backdrop-blur-md ${
              settings.globalEnabled
                ? 'bg-[#0f8a5f]/10 text-[#0f8a5f] border border-[#0f8a5f]/20'
                : 'bg-[#b7791f]/10 text-[#b7791f] border border-[#b7791f]/20'
            }`}
          >
            <span className={`flex h-2 w-2 rounded-full ${settings.globalEnabled ? 'bg-[#0f8a5f] animate-pulse' : 'bg-[#b7791f]'}`} />
            <span>{settings.globalEnabled ? 'Warmup Active' : 'Engine Paused'}</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 ml-auto">
          <div className="flex items-center gap-2.5 rounded-full border border-[#121316]/10 bg-white/90 backdrop-blur-md px-4 py-2 shadow-sm">
            <span className="text-xs font-bold text-[#121316]">Warmup Engine</span>
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
            className="rounded-full border border-[#121316]/10 bg-white/90 backdrop-blur-md text-[#121316] hover:bg-white shadow-sm"
            title="Reset to defaults"
            aria-label="Reset to defaults"
            disabled={isLoading || isSaving}
            onClick={() => setSettings(withSettingsFallbacks(DEFAULT_WARMUP_SETTINGS))}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-[#ee382b] px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-[0_4px_16px_rgba(238,56,43,0.28)] transition-all hover:bg-[#d92b1f] hover:shadow-[0_8px_24px_rgba(238,56,43,0.38)] active:scale-95 disabled:opacity-50"
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
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          ['Total Mailboxes', totalMailboxes, '#121316'],
          ['In Warmup Ramp', overview?.warming ?? 0, '#b7791f'],
          ['Ready / Warmed', overview?.warmed ?? 0, '#0f8a5f'],
          ['Paused Accounts', overview?.paused ?? 0, '#62605c'],
        ].map(([label, value, color]) => (
          <div
            key={label as string}
            className="uneevo-card p-5 rounded-[22px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)]"
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#62605c]">{label as string}</div>
            <div className="mt-1 font-mono text-3xl font-bold tabular-nums" style={{ color: color as string }}>
              {isLoading ? '—' : value}
            </div>
          </div>
        ))}
      </section>

      <main className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
        <div className="space-y-5">
          <section className="overflow-hidden rounded-lg border border-black/10 bg-white">
            <div className="flex items-center gap-3 border-b border-black/8 px-5 py-4">
              <Clock3 className="h-5 w-5 text-[var(--text-secondary)]" />
              <div>
                <h2 className="text-base font-semibold text-[var(--text-primary)]">Warmup schedule</h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  {settings.businessHoursStart}–{settings.businessHoursEnd} in {settings.timezone}
                </p>
              </div>
            </div>

            <div className="grid gap-5 p-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="warmup-timezone">Timezone</Label>
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

              <div className="space-y-2">
                <Label htmlFor="warmup-window-start">Start time</Label>
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

              <div className="space-y-2">
                <Label htmlFor="warmup-window-end">End time</Label>
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

              <div className="space-y-2 md:col-span-2">
                <Label>Active days</Label>
                <div className="grid grid-cols-2 rounded-lg bg-black/[0.04] p-1" role="group" aria-label="Active days">
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
                        className={`flex min-h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition ${
                          selected
                            ? 'bg-white text-[var(--text-primary)] shadow-sm'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                        onClick={() => setSettings((current) => ({ ...current, weekdaysOnly: option.value }))}
                      >
                        <Icon className="h-4 w-4" />
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border border-black/10 bg-white">
            <div className="flex items-center justify-between gap-4 border-b border-black/8 px-5 py-4">
              <div className="flex items-center gap-3">
                <Gauge className="h-5 w-5 text-[var(--text-secondary)]" />
                <div>
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">Daily ramp plan</h2>
                  <p className="text-sm text-[var(--text-secondary)]">Emails per mailbox at each maturity stage</p>
                </div>
              </div>
              <span className="text-sm font-medium text-[var(--text-secondary)]">
                Peak {Math.max(...settings.stageCounts)}/day
              </span>
            </div>

            <div className="divide-y divide-black/8">
              {settings.stageCounts.map((count, index) => {
                const progress = Math.max(8, Math.round((count / Math.max(...settings.stageCounts, 1)) * 100))
                return (
                  <div key={`stage-${index}`} className="grid items-center gap-3 px-5 py-3 sm:grid-cols-[96px_minmax(120px,1fr)_160px]">
                    <div>
                      <div className="text-sm font-medium text-[var(--text-primary)]">Stage {index + 1}</div>
                      <div className="text-xs text-[var(--text-muted)]">Day {index + 1}+</div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-black/[0.05]">
                      <div className="h-full rounded-full bg-[#3b4652] transition-all" style={{ width: `${progress}%` }} />
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

        <section className="overflow-hidden rounded-lg border border-black/10 bg-white xl:sticky xl:top-5">
          <div className="flex items-center gap-3 border-b border-black/8 px-5 py-4">
            <ShieldCheck className="h-5 w-5 text-[var(--text-secondary)]" />
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Conversation & safety</h2>
              <p className="text-sm text-[var(--text-secondary)]">Engagement targets and mailbox protection</p>
            </div>
          </div>

          <div className="space-y-6 p-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="warmup-reply-rate-target">Reply target</Label>
                <span className="text-sm font-semibold text-[var(--text-primary)]">
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
                className="h-2 w-full cursor-pointer accent-[#303a45]"
              />
              <div className="flex justify-between text-xs text-[var(--text-muted)]"><span>0%</span><span>100%</span></div>
            </div>

            <div className="space-y-3 border-t border-black/8 pt-5">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="warmup-thread-rate">Continue existing threads</Label>
                <span className="text-sm font-semibold text-[var(--text-primary)]">
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
                className="h-2 w-full cursor-pointer accent-[#303a45]"
              />
              <div className="flex justify-between text-xs text-[var(--text-muted)]"><span>New threads</span><span>Existing threads</span></div>
            </div>

            <div className="grid gap-4 border-t border-black/8 pt-5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <div className="space-y-2">
                <Label>Maximum thread depth</Label>
                <Stepper
                  value={settings.maxThreadDepth}
                  min={1}
                  max={10}
                  label="Maximum thread depth"
                  onChange={(maxThreadDepth) => setSettings((current) => ({ ...current, maxThreadDepth }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Mailbox receiving cap</Label>
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

            <div className="flex items-center justify-between gap-4 border-t border-black/8 pt-5">
              <div>
                <div className="text-sm font-medium text-[var(--text-primary)]">Automated health actions</div>
                <div className="mt-0.5 text-xs text-[var(--text-muted)]">Pause risky warmup activity automatically</div>
              </div>
              <Switch
                checked={settings.healthActionsEnabled}
                onCheckedChange={(healthActionsEnabled) =>
                  setSettings((current) => ({ ...current, healthActionsEnabled }))
                }
              />
            </div>

            <div className="border-t border-black/8 pt-5">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-[var(--text-primary)]">Mailbox readiness</span>
                <span className="text-[var(--text-secondary)]">{warmedPercent}% warmed</span>
              </div>
              <Progress value={warmedPercent} className="bg-black/[0.06]" />
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {[
                  ['Auto', overview?.autoEnabled ?? 0],
                  ['Cold', overview?.cold ?? 0],
                  ['Active', overview?.activeMailboxes ?? 0],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md bg-black/[0.03] px-2 py-2">
                    <div className="text-base font-semibold text-[var(--text-primary)]">{isLoading ? '—' : value}</div>
                    <div className="text-[11px] uppercase text-[var(--text-muted)]">{label}</div>
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
