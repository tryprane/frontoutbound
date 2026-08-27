'use client'

import { useState } from 'react'
import { TrendingUp, Flame, Send, MessageSquareReply, ShieldCheck, Clock } from 'lucide-react'

export type PacingPoint = {
  label: string
  dispatched: number
  replies: number
  failed: number
  timeRange?: string
}

interface Props {
  data?: PacingPoint[]
  todaySent: number
  todayAllowance: number
  rampPercent: number
  channel: 'EMAIL' | 'WHATSAPP' | 'GDRIVE'
}

export function CampaignVelocityChart({
  data,
  todaySent,
  todayAllowance,
  rampPercent,
  channel,
}: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  // Default synthetic pacing points across the day if logs are sparse
  const defaultPacing: PacingPoint[] = [
    { label: '09:00', dispatched: Math.round(todaySent * 0.15), replies: 0, failed: 0, timeRange: '09:00 - 11:00' },
    { label: '11:00', dispatched: Math.round(todaySent * 0.25), replies: 1, failed: 0, timeRange: '11:00 - 13:00' },
    { label: '13:00', dispatched: Math.round(todaySent * 0.20), replies: 0, failed: 0, timeRange: '13:00 - 15:00' },
    { label: '15:00', dispatched: Math.round(todaySent * 0.25), replies: 1, failed: 0, timeRange: '15:00 - 17:00' },
    { label: '17:00', dispatched: Math.round(todaySent * 0.15), replies: 0, failed: 0, timeRange: '17:00 - 19:00' },
    { label: '19:00', dispatched: 0, replies: 0, failed: 0, timeRange: '19:00 - 21:00' },
    { label: 'Queued', dispatched: Math.max(0, todayAllowance - todaySent), replies: 0, failed: 0, timeRange: 'Upcoming today' },
  ]

  const points = data && data.length > 0 ? data : defaultPacing
  const maxDispatched = Math.max(...points.map((p) => p.dispatched), 5)
  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : null
  const allowanceRatio = todayAllowance > 0 ? Math.min(100, Math.round((todaySent / todayAllowance) * 100)) : 0

  return (
    <div className="uneevo-card relative overflow-hidden p-6 md:p-7 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase block">
              DISPATCH PACING
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0f8a5f] bg-[#0f8a5f]/10 px-2.5 py-0.5 rounded-full border border-[#0f8a5f]/20">
              <TrendingUp className="h-3 w-3" />
              {channel === 'GDRIVE' ? 'Quota Pacing' : `${rampPercent}% Sending Ramp`}
            </span>
          </div>
          <h3 className="zoho-puvi-headline text-lg sm:text-xl font-bold text-[#121316]">
            Intraday Dispatch Cadence & Velocity
          </h3>
        </div>

        {/* Quota Gauge Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-[#121316]/06 border border-[#121316]/08 px-3.5 py-1.5 rounded-xl">
            <div className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-[#121316] text-white shadow-xs">
              <Send className="h-3 w-3" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono font-bold text-[#62605c]">Today's Cap</div>
              <div className="text-xs font-mono font-bold tabular-nums text-[#121316]">
                {todaySent} / {todayAllowance} limit
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-[#fde9b0]/50 border border-[#b7791f]/20 px-3.5 py-1.5 rounded-xl">
            <div className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-[#fde9b0] text-[#5c4211] shadow-xs">
              <Flame className="h-3 w-3" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono font-bold text-[#8a5c0a]">Paced Quota</div>
              <div className="text-xs font-mono font-bold tabular-nums text-[#121316]">
                {allowanceRatio}% used
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative pt-2 pb-2">
        {/* Dynamic Tooltip */}
        <div className="h-7 mb-2 flex items-center justify-center">
          {activePoint ? (
            <div className="inline-flex items-center gap-3 rounded-full border border-[#121316]/10 bg-[#121316] px-4 py-1 text-xs text-white shadow-lg animate-fade-in">
              <span className="font-bold text-[#e6c184]">{activePoint.timeRange || activePoint.label}</span>
              <span>•</span>
              <span className="tabular-nums">
                Dispatched: <strong>{activePoint.dispatched}</strong>
              </span>
              {activePoint.replies > 0 && (
                <>
                  <span>•</span>
                  <span className="text-[#0f8a5f] tabular-nums">
                    Replies: <strong>{activePoint.replies}</strong>
                  </span>
                </>
              )}
            </div>
          ) : (
            <div className="text-xs font-medium text-[#62605c] flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#8a8780]" />
              <span>Hover bars to inspect hourly batch distribution & delivery pacing</span>
            </div>
          )}
        </div>

        {/* Bar Columns */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4 h-36 items-end px-2">
          {points.map((p, index) => {
            const heightPercent = maxDispatched > 0 ? (p.dispatched / maxDispatched) * 100 : 0
            const isHovered = hoveredIdx === index
            const isQueued = p.label === 'Queued'

            return (
              <div
                key={p.label}
                className="group flex flex-col items-center h-full justify-end cursor-pointer"
                onMouseEnter={() => setHoveredIdx(index)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Visual Bar */}
                <div
                  className={`w-full max-w-[40px] flex flex-col justify-end rounded-t-[10px] overflow-hidden transition-all duration-300 ${
                    isHovered ? 'ring-2 ring-[#121316]/20 -translate-y-1' : ''
                  }`}
                  style={{ height: '100%' }}
                >
                  <div className="w-full flex flex-col justify-end h-full">
                    {heightPercent > 0 ? (
                      <div
                        className={`w-full rounded-t-[6px] transition-all ${
                          isQueued
                            ? 'bg-[#121316]/15 hover:bg-[#121316]/25 border-t border-dashed border-[#121316]/30'
                            : 'bg-[#121316] hover:bg-[#2c323d]'
                        }`}
                        style={{ height: `${Math.max(heightPercent, 6)}%` }}
                      />
                    ) : (
                      <div className="w-full h-1.5 bg-[#121316]/10 rounded-full my-1 group-hover:bg-[#121316]/25 transition-colors" />
                    )}
                  </div>
                </div>

                {/* Bar Label */}
                <div className="mt-3 text-center">
                  <div
                    className={`text-[11px] font-semibold transition-colors ${
                      isHovered ? 'text-[#121316]' : 'text-[#62605c]'
                    }`}
                  >
                    {p.label}
                  </div>
                  <div className="text-[10px] font-mono font-bold text-[#62605c] tabular-nums">
                    {p.dispatched}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer / Jitter & Health Guarantee */}
      <div className="pt-4 border-t border-[#121316]/08 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#62605c]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-[#121316]" />
            <span>Dispatched Batches</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-[#121316]/20" />
            <span>Remaining Allowance</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[#0f8a5f] font-semibold">
          <ShieldCheck className="h-4 w-4 text-[#0f8a5f]" />
          <span>Jittered spacing active between dispatches</span>
        </div>
      </div>
    </div>
  )
}
