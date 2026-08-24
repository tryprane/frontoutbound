'use client'

import Link from 'next/link'
import {
  Send,
  Flame,
  FileSpreadsheet,
  Megaphone,
  ArrowRight,
  Clock,
  CheckCircle2,
} from 'lucide-react'

export type ActivityItem = {
  id: string
  type: 'sent' | 'warmup' | 'csv' | 'campaign'
  title: string
  detail: string
  timeAgo: string
  status?: string
}

type Props = {
  activities: ActivityItem[]
}

export function RecentActivityFeed({ activities }: Props) {
  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'sent':
        return <Send className="h-3.5 w-3.5" />
      case 'warmup':
        return <Flame className="h-3.5 w-3.5 text-[#5c4211]" />
      case 'csv':
        return <FileSpreadsheet className="h-3.5 w-3.5" />
      case 'campaign':
        return <Megaphone className="h-3.5 w-3.5" />
    }
  }

  const getIconBg = (type: ActivityItem['type']) => {
    switch (type) {
      case 'sent':
        return 'bg-[#1a1d23] text-white'
      case 'warmup':
        return 'bg-[#fde9b0] text-[#5c4211]'
      case 'csv':
        return 'bg-[#ebe8e1] text-[var(--text-primary)]'
      case 'campaign':
        return 'bg-[#2c323d] text-white'
    }
  }

  return (
    <div className="uneevo-card relative flex flex-col justify-between p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
      <div>
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase block mb-1">
              REAL-TIME
            </span>
            <h3 className="zoho-puvi-headline text-lg sm:text-xl font-bold text-[#121316]">
              Operational Stream
            </h3>
          </div>
          <Link
            href="/sent"
            className="text-xs font-bold text-[#62605c] hover:text-[#ee382b] flex items-center gap-1 group transition-colors"
          >
            <span>View all</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Activity Items List */}
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#121316]/06 text-[#62605c] mb-3">
              <Clock className="h-6 w-6" />
            </div>
            <div className="text-sm font-bold text-[#121316]">
              No recent dispatches yet
            </div>
            <p className="text-xs text-[#52504b] mt-1 max-w-[240px]">
              When sequences start sending or warmup triggers, events will stream here live.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activities.map((item) => (
              <div
                key={item.id}
                className="group flex items-start gap-3 rounded-[16px] border border-[#121316]/06 bg-[#faf8f4] p-3.5 transition-all hover:border-[#121316]/12 hover:bg-white hover:shadow-xs"
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-[10px] flex-shrink-0 mt-0.5 shadow-xs ${getIconBg(
                    item.type
                  )}`}
                >
                  {getIcon(item.type)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#121316] truncate">
                      {item.title}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-[#62605c] flex-shrink-0">
                      {item.timeAgo}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#52504b] truncate mt-0.5">
                    {item.detail}
                  </div>
                </div>

                {item.status && (
                  <div className="flex-shrink-0 text-[#0f8a5f] mt-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-[#121316]/08 flex items-center justify-between text-xs text-[#62605c]">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="h-2 w-2 rounded-full bg-[#0f8a5f] animate-pulse" />
          Queue processor running
        </span>
        <Link
          href="/responses"
          className="hover:text-[#ee382b] font-bold transition-colors"
        >
          Check responses →
        </Link>
      </div>
    </div>
  )
}
