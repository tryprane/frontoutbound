'use client'

import { useState } from 'react'
import { TrendingUp, Send, Flame, ShieldCheck } from 'lucide-react'

export type DailyDataPoint = {
  dayLabel: string
  dateString: string
  outboundCount: number
  warmupCount: number
}

type Props = {
  dailyData: DailyDataPoint[]
  totalSentWeek: number
  totalWarmupWeek: number
}

export function OutboundVelocityChart({
  dailyData,
  totalSentWeek,
  totalWarmupWeek,
}: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const maxDaily = Math.max(
    ...dailyData.map((d) => d.outboundCount + d.warmupCount),
    10 // baseline scale
  )

  const activePoint = hoveredIdx !== null ? dailyData[hoveredIdx] : null

  return (
    <div className="uneevo-card relative overflow-hidden p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase block">
              DELIVERY VELOCITY
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0f8a5f] bg-[#0f8a5f]/10 px-2.5 py-0.5 rounded-full border border-[#0f8a5f]/20">
              <TrendingUp className="h-3 w-3" />
              Live Pulse
            </span>
          </div>
          <h3 className="zoho-puvi-headline text-lg sm:text-xl font-bold text-[#121316]">
            7-Day Delivery & Warmup Volume
          </h3>
        </div>

        {/* Aggregate summary pills */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-[#121316]/06 border border-[#121316]/08 px-3.5 py-1.5 rounded-xl">
            <div className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-[#121316] text-white shadow-xs">
              <Send className="h-3 w-3" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono font-bold text-[#62605c]">Campaigns</div>
              <div className="text-xs font-mono font-bold tabular-nums text-[#121316]">
                {totalSentWeek} sent
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-[#fde9b0]/50 border border-[#b7791f]/20 px-3.5 py-1.5 rounded-xl">
            <div className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-[#fde9b0] text-[#5c4211] shadow-xs">
              <Flame className="h-3 w-3" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono font-bold text-[#8a5c0a]">Warmup</div>
              <div className="text-xs font-mono font-bold tabular-nums text-[#121316]">
                {totalWarmupWeek} emails
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Canvas / Interactive Bars */}
      <div className="relative pt-4 pb-2">
        {/* Dynamic Tooltip */}
        <div className="h-7 mb-2 flex items-center justify-center">
          {activePoint ? (
            <div className="inline-flex items-center gap-3 rounded-full border border-[#121316]/10 bg-[#121316] px-4 py-1 text-xs text-white shadow-lg animate-fade-in">
              <span className="font-bold text-[#e6c184]">{activePoint.dateString}</span>
              <span>•</span>
              <span className="tabular-nums">
                Outbound: <strong>{activePoint.outboundCount}</strong>
              </span>
              <span>•</span>
              <span className="tabular-nums">
                Warmup: <strong>{activePoint.warmupCount}</strong>
              </span>
            </div>
          ) : (
            <div className="text-xs font-medium text-[#62605c]">
              Hover over daily bars to inspect sending distribution
            </div>
          )}
        </div>

        {/* Bar Columns */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4 h-40 items-end px-2">
          {dailyData.map((d, index) => {
            const total = d.outboundCount + d.warmupCount
            const outboundHeightPercent = total > 0 ? (d.outboundCount / maxDaily) * 100 : 0
            const warmupHeightPercent = total > 0 ? (d.warmupCount / maxDaily) * 100 : 0
            const isHovered = hoveredIdx === index

            return (
              <div
                key={d.dateString}
                className="group flex flex-col items-center h-full justify-end cursor-pointer"
                onMouseEnter={() => setHoveredIdx(index)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Visual Bar Stack */}
                <div
                  className={`w-full max-w-[36px] flex flex-col justify-end rounded-t-[10px] overflow-hidden transition-all duration-300 ${
                    isHovered ? 'ring-2 ring-[#121316]/20 -translate-y-1' : ''
                  }`}
                  style={{ height: '100%' }}
                >
                  <div className="w-full flex flex-col justify-end h-full">
                    {/* Warmup portion (top) */}
                    {warmupHeightPercent > 0 && (
                      <div
                        className="w-full bg-[#e6c184] hover:bg-[#d8b06d] transition-all rounded-t-[6px]"
                        style={{ height: `${Math.max(warmupHeightPercent, 4)}%` }}
                        title={`${d.warmupCount} warmup emails`}
                      />
                    )}
                    {/* Outbound portion (bottom) */}
                    {outboundHeightPercent > 0 && (
                      <div
                        className="w-full bg-[#121316] hover:bg-[#2c323d] transition-all"
                        style={{ height: `${Math.max(outboundHeightPercent, 4)}%` }}
                        title={`${d.outboundCount} outbound emails`}
                      />
                    )}
                    {/* Zero baseline state */}
                    {total === 0 && (
                      <div className="w-full h-1.5 bg-[#121316]/10 rounded-full my-1 group-hover:bg-[#121316]/25 transition-colors" />
                    )}
                  </div>
                </div>

                {/* Day Label */}
                <div className="mt-3 text-center">
                  <div
                    className={`text-xs font-semibold transition-colors ${
                      isHovered ? 'text-[#121316]' : 'text-[#62605c]'
                    }`}
                  >
                    {d.dayLabel}
                  </div>
                  <div className="text-[10px] font-mono font-bold text-[#62605c] tabular-nums">
                    {total}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend & Health Footer */}
      <div className="mt-4 pt-4 border-t border-[#121316]/08 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#52504b]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-[#121316]" />
            <span>Outbound Campaigns</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-[#e6c184]" />
            <span>Warmup Exchanges</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[#0f8a5f] font-semibold">
          <ShieldCheck className="h-4 w-4 text-[#0f8a5f]" />
          <span>Sender reputations optimal across active pools</span>
        </div>
      </div>
    </div>
  )
}
