export type CampaignSenderAccountPreference = 'random' | 'gmail' | 'zoho' | 'outlook'

const DAY_MS = 24 * 60 * 60 * 1000
const MIN_INTERVAL_MS = 60_000
const DEFAULT_ANYTIME_WINDOW_MS = 24 * 60 * 60 * 1000
const DEFAULT_JITTER_RATIO = 0.35

function getCalendarDayTimestamp(value: Date, timeZone?: string | null): number {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone || 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(value)
    const read = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0)
    return Date.UTC(read('year'), read('month') - 1, read('day'))
  } catch {
    return Date.UTC(value.getFullYear(), value.getMonth(), value.getDate())
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function parseClockValue(value: string | null | undefined, fallback: string): number {
  const tryParse = (input: string): number | null => {
    const match = /^(\d{2}):(\d{2})$/.exec(input.trim())
    if (!match) return null
    const hour = Number(match[1])
    const minute = Number(match[2])
    if (hour > 23 || minute > 59) return null
    return hour * 60 + minute
  }

  return tryParse(value ?? '') ?? tryParse(fallback) ?? 9 * 60
}

function getZonedParts(timeZone: string, now: Date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const formattedParts = formatter.formatToParts(now)
  const read = (type: string) => Number(formattedParts.find((part) => part.type === type)?.value || 0)

  return {
    weekday: formattedParts.find((part) => part.type === 'weekday')?.value.toLowerCase() || 'mon',
    minutes: read('hour') * 60 + read('minute'),
  }
}

export function normalizeSenderAccountPreference(input: string | null | undefined): CampaignSenderAccountPreference {
  return input === 'gmail' || input === 'zoho' || input === 'outlook' ? input : 'random'
}

export function preferenceMatchesAccountType(
  preference: CampaignSenderAccountPreference,
  accountType: string | null | undefined
): boolean {
  if (preference === 'random') return true
  return accountType === preference
}

export function preferencesOverlap(
  left: CampaignSenderAccountPreference,
  right: CampaignSenderAccountPreference
): boolean {
  return left === 'random' || right === 'random' || left === right
}

export function getGradualSendingPercent(
  gradualSendingEnabled: boolean,
  activatedAt: Date | string | null | undefined,
  now = new Date(),
  timeZone?: string | null
): number {
  if (!gradualSendingEnabled) return 100
  if (!activatedAt) return 20

  const activationDate = typeof activatedAt === 'string' ? new Date(activatedAt) : activatedAt
  const ageDays = Math.max(
    0,
    Math.floor((getCalendarDayTimestamp(now, timeZone) - getCalendarDayTimestamp(activationDate, timeZone)) / DAY_MS)
  )

  return Math.min(100, 20 + ageDays * 20)
}

export type CampaignWindowState = {
  allowed: boolean
  remainingMinutes: number
  remainingMs: number
}

export function getCampaignWindowState(
  campaign: {
    schedulingMode: string
    timezone?: string | null
    businessHoursStart?: string | null
    businessHoursEnd?: string | null
  },
  now = new Date()
): CampaignWindowState {
  if (campaign.schedulingMode !== 'BUSINESS_HOURS') {
    return {
      allowed: true,
      remainingMinutes: Math.floor(DEFAULT_ANYTIME_WINDOW_MS / 60_000),
      remainingMs: DEFAULT_ANYTIME_WINDOW_MS,
    }
  }

  const timeZone = campaign.timezone || 'Asia/Kolkata'
  let parts: { weekday: string; minutes: number }

  try {
    parts = getZonedParts(timeZone, now)
  } catch {
    parts = getZonedParts('Asia/Kolkata', now)
  }

  if (parts.weekday.startsWith('sat') || parts.weekday.startsWith('sun')) {
    return { allowed: false, remainingMinutes: 0, remainingMs: 0 }
  }

  const startMinutes = parseClockValue(campaign.businessHoursStart, '09:00')
  const endMinutes = parseClockValue(campaign.businessHoursEnd, '17:00')

  if (parts.minutes < startMinutes || parts.minutes > endMinutes) {
    return { allowed: false, remainingMinutes: 0, remainingMs: 0 }
  }

  const remainingMinutes = Math.max(0, endMinutes - parts.minutes)
  return {
    allowed: true,
    remainingMinutes,
    remainingMs: Math.max(MIN_INTERVAL_MS, remainingMinutes * 60_000),
  }
}

export function isWithinCampaignWindow(
  campaign: {
    schedulingMode: string
    timezone?: string | null
    businessHoursStart?: string | null
    businessHoursEnd?: string | null
  },
  now = new Date()
): boolean {
  return getCampaignWindowState(campaign, now).allowed
}

export function getFairDailyAllowance(input: {
  totalCapacity: number
  gradualSendingEnabled: boolean
  activatedAt: Date | string | null | undefined
  timeZone?: string | null
  competingCampaignCount: number
  now?: Date
}): number {
  const totalCapacity = Math.max(0, input.totalCapacity)
  if (totalCapacity === 0) return 0

  const rampPercent = getGradualSendingPercent(
    input.gradualSendingEnabled,
    input.activatedAt,
    input.now,
    input.timeZone
  )
  const rampedCapacity = Math.floor((totalCapacity * rampPercent) / 100)

  return Math.max(1, rampedCapacity)
}

export function computeJitteredDelay(baseMs: number, ratio = DEFAULT_JITTER_RATIO): number {
  const normalizedBase = Math.max(MIN_INTERVAL_MS, Math.floor(baseMs))
  const clampedRatio = clamp(ratio, 0, 0.8)
  const min = normalizedBase * (1 - clampedRatio)
  const max = normalizedBase * (1 + clampedRatio)
  return Math.max(MIN_INTERVAL_MS, Math.floor(min + Math.random() * (max - min)))
}

export function getWarmupParticipationWeight(account: {
  warmupStatus: 'COLD' | 'WARMING' | 'WARMED' | 'PAUSED'
  warmupStage?: number | null
}) {
  if (account.warmupStatus === 'WARMED') return 1
  if (account.warmupStatus === 'WARMING') {
    const stage = account.warmupStage ?? 0
    if (stage >= 4) return 0.5
    if (stage >= 3) return 0.35
    return 0
  }
  return 0
}

export type DayPlanInboxSlot = {
  accountId: string
  weight: number
  safeRemaining: number
  softThrottled: boolean
  lastSentAt: Date | null
}

export type CampaignDayPlan = {
  campaignAllowanceToday: number
  remainingAllowanceToday: number
  remainingWindowMs: number
  targetIntervalMs: number
  rampPercent: number
  inboxSlots: DayPlanInboxSlot[]
}

export function computeCampaignDayPlan(input: {
  campaign: {
    gradualSendingEnabled: boolean
    activatedAt: Date | string | null | undefined
    schedulingMode: string
    timezone?: string | null
    businessHoursStart?: string | null
    businessHoursEnd?: string | null
  }
  competingCampaignCount: number
  campaignSentToday: number
  rowsRemaining: number
  accounts: Array<{
    id: string
    dailyLimit: number
    sentToday: number
    warmupSentToday?: number
    warmupStatus: 'COLD' | 'WARMING' | 'WARMED' | 'PAUSED'
    warmupStage?: number | null
    mailboxHealthStatus: string
    mailboxHealthScore: number
    softThrottleUntil?: Date | null
    lastSentAt?: Date | null
  }>
  now?: Date
}): CampaignDayPlan {
  const now = input.now ?? new Date()
  const windowState = getCampaignWindowState(input.campaign, now)
  const rampPercent = getGradualSendingPercent(
    input.campaign.gradualSendingEnabled,
    input.campaign.activatedAt,
    now,
    input.campaign.timezone
  )

  const inboxSlots = input.accounts
    .map((account) => {
      const safeRemaining = Math.max(
        0,
        account.dailyLimit - Math.max(account.sentToday, 0)
      )
      const warmupWeight = getWarmupParticipationWeight(account)
      const healthWeight =
        account.mailboxHealthStatus === 'healthy'
          ? 1
          : account.mailboxHealthStatus === 'at_risk'
            ? 0.35
            : account.mailboxHealthStatus === 'warming'
              ? 0.6
              : 0
      const healthScoreWeight = clamp((account.mailboxHealthScore || 0) / 100, 0.2, 1)
      const softThrottled = Boolean(account.softThrottleUntil && account.softThrottleUntil > now)
      const throttleWeight = softThrottled ? 0.2 : 1
      const weight = safeRemaining > 0 ? safeRemaining * warmupWeight * healthWeight * healthScoreWeight * throttleWeight : 0

      return {
        accountId: account.id,
        weight,
        safeRemaining,
        softThrottled,
        lastSentAt: account.lastSentAt ?? null,
      }
    })
    .filter((slot) => slot.safeRemaining > 0 && slot.weight > 0)

  const totalCapacity = inboxSlots.reduce((sum, slot) => sum + slot.safeRemaining, 0)
  const todayAllowance = Math.min(
    input.rowsRemaining,
    getFairDailyAllowance({
      totalCapacity,
      gradualSendingEnabled: input.campaign.gradualSendingEnabled,
      activatedAt: input.campaign.activatedAt,
      timeZone: input.campaign.timezone,
      competingCampaignCount: input.competingCampaignCount,
      now,
    })
  )

  const remainingAllowanceToday = Math.max(0, todayAllowance - input.campaignSentToday)
  const baseWindowMs = windowState.allowed ? windowState.remainingMs : 0
  const targetIntervalMs =
    remainingAllowanceToday > 0 && baseWindowMs > 0
      ? Math.max(MIN_INTERVAL_MS, Math.floor(baseWindowMs / remainingAllowanceToday))
      : MIN_INTERVAL_MS

  return {
    campaignAllowanceToday: todayAllowance,
    remainingAllowanceToday,
    remainingWindowMs: baseWindowMs,
    targetIntervalMs,
    rampPercent,
    inboxSlots,
  }
}
