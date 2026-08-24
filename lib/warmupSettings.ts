export const WARMUP_SETTINGS_KEY = 'warmup:settings'

export function getWarmupSettingsKey(organizationId?: string | null) {
  return organizationId ? `${WARMUP_SETTINGS_KEY}:${organizationId}` : WARMUP_SETTINGS_KEY
}

export const DEFAULT_WARMUP_STAGE_COUNTS = [5, 8, 12, 18, 25, 40, 60]
export const DEFAULT_WARMUP_BUSINESS_HOURS_START = '08:00'
export const DEFAULT_WARMUP_BUSINESS_HOURS_END = '18:00'
export const DEFAULT_WARMUP_TIMEZONE = 'Asia/Kolkata'
export const DEFAULT_WARMUP_REPLY_RATE_TARGET = 0.35
/**
 * Share of sends that continue an existing thread rather than opening a cold one.
 *
 * A real mailbox is mostly ongoing conversations with a small tail of new ones;
 * the previous 0.25 produced the opposite shape — 75% brand-new subject lines to
 * counterparts the account was already mid-conversation with (audit §2.4).
 */
export const DEFAULT_WARMUP_THREAD_CONTINUATION_RATE = 0.65
export const DEFAULT_WARMUP_MAX_THREAD_DEPTH = 4
/**
 * Ceiling on warmup mail a single mailbox may receive per day, across the whole
 * pool. Independent of that mailbox's own sending limit (audit §2.8).
 */
export const DEFAULT_WARMUP_RECIPIENT_DAILY_INBOUND_CAP = 30
export const DEFAULT_WARMUP_HEALTH_ACTIONS_ENABLED = true

export interface WarmupSettings {
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

export const DEFAULT_WARMUP_SETTINGS: WarmupSettings = {
  globalEnabled: true,
  stageCounts: DEFAULT_WARMUP_STAGE_COUNTS,
  businessHoursStart: DEFAULT_WARMUP_BUSINESS_HOURS_START,
  businessHoursEnd: DEFAULT_WARMUP_BUSINESS_HOURS_END,
  weekdaysOnly: true,
  timezone: DEFAULT_WARMUP_TIMEZONE,
  replyRateTarget: DEFAULT_WARMUP_REPLY_RATE_TARGET,
  threadContinuationRate: DEFAULT_WARMUP_THREAD_CONTINUATION_RATE,
  maxThreadDepth: DEFAULT_WARMUP_MAX_THREAD_DEPTH,
  recipientDailyInboundCap: DEFAULT_WARMUP_RECIPIENT_DAILY_INBOUND_CAP,
  healthActionsEnabled: DEFAULT_WARMUP_HEALTH_ACTIONS_ENABLED,
}

function normalizeTimeValue(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(trimmed) ? trimmed : fallback
}

function normalizeTimezone(value: unknown) {
  if (typeof value !== 'string') return DEFAULT_WARMUP_TIMEZONE
  const trimmed = value.trim()
  return trimmed || DEFAULT_WARMUP_TIMEZONE
}

function normalizeRate(value: unknown, fallback: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(1, Math.max(0, Number(parsed.toFixed(2))))
}

function normalizeDepth(value: unknown) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return DEFAULT_WARMUP_MAX_THREAD_DEPTH
  return Math.max(1, Math.min(10, Math.round(parsed)))
}

function normalizeInboundCap(value: unknown) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return DEFAULT_WARMUP_RECIPIENT_DAILY_INBOUND_CAP
  return Math.max(1, Math.min(500, Math.round(parsed)))
}

export function normalizeWarmupStageCounts(stageCounts?: unknown): number[] {
  if (!Array.isArray(stageCounts) || stageCounts.length === 0) {
    return DEFAULT_WARMUP_STAGE_COUNTS
  }

  return stageCounts
    .slice(0, DEFAULT_WARMUP_STAGE_COUNTS.length)
    .map((value, index) => {
      const parsed = Number(value)
      if (!Number.isFinite(parsed)) {
        return DEFAULT_WARMUP_STAGE_COUNTS[index]
      }
      return Math.max(1, Math.round(parsed))
    })
}

export function parseWarmupSettingsValue(value?: string | null): WarmupSettings {
  if (!value) return DEFAULT_WARMUP_SETTINGS

  try {
    const parsed = JSON.parse(value) as Partial<WarmupSettings>
    return {
      globalEnabled:
        typeof parsed.globalEnabled === 'boolean'
          ? parsed.globalEnabled
          : DEFAULT_WARMUP_SETTINGS.globalEnabled,
      stageCounts: normalizeWarmupStageCounts(parsed.stageCounts),
      businessHoursStart: normalizeTimeValue(parsed.businessHoursStart, DEFAULT_WARMUP_BUSINESS_HOURS_START),
      businessHoursEnd: normalizeTimeValue(parsed.businessHoursEnd, DEFAULT_WARMUP_BUSINESS_HOURS_END),
      weekdaysOnly:
        typeof parsed.weekdaysOnly === 'boolean'
          ? parsed.weekdaysOnly
          : DEFAULT_WARMUP_SETTINGS.weekdaysOnly,
      timezone: normalizeTimezone(parsed.timezone),
      replyRateTarget: normalizeRate(parsed.replyRateTarget, DEFAULT_WARMUP_REPLY_RATE_TARGET),
      threadContinuationRate: normalizeRate(
        parsed.threadContinuationRate,
        DEFAULT_WARMUP_THREAD_CONTINUATION_RATE
      ),
      maxThreadDepth: normalizeDepth(parsed.maxThreadDepth),
      recipientDailyInboundCap: normalizeInboundCap(parsed.recipientDailyInboundCap),
      healthActionsEnabled:
        typeof parsed.healthActionsEnabled === 'boolean'
          ? parsed.healthActionsEnabled
          : DEFAULT_WARMUP_SETTINGS.healthActionsEnabled,
    }
  } catch {
    return DEFAULT_WARMUP_SETTINGS
  }
}

export function serializeWarmupSettings(settings: WarmupSettings): string {
  return JSON.stringify({
    globalEnabled: settings.globalEnabled,
    stageCounts: normalizeWarmupStageCounts(settings.stageCounts),
    businessHoursStart: normalizeTimeValue(settings.businessHoursStart, DEFAULT_WARMUP_BUSINESS_HOURS_START),
    businessHoursEnd: normalizeTimeValue(settings.businessHoursEnd, DEFAULT_WARMUP_BUSINESS_HOURS_END),
    weekdaysOnly: Boolean(settings.weekdaysOnly),
    timezone: normalizeTimezone(settings.timezone),
    replyRateTarget: normalizeRate(settings.replyRateTarget, DEFAULT_WARMUP_REPLY_RATE_TARGET),
    threadContinuationRate: normalizeRate(
      settings.threadContinuationRate,
      DEFAULT_WARMUP_THREAD_CONTINUATION_RATE
    ),
    maxThreadDepth: normalizeDepth(settings.maxThreadDepth),
    recipientDailyInboundCap: normalizeInboundCap(settings.recipientDailyInboundCap),
    healthActionsEnabled: Boolean(settings.healthActionsEnabled),
  })
}

export function recommendedLimitFromStage(stage: number, stageCounts = DEFAULT_WARMUP_STAGE_COUNTS): number {
  const plan = normalizeWarmupStageCounts(stageCounts)
  const index = Math.max(0, Math.min(stage, plan.length - 1))
  return plan[index]
}
