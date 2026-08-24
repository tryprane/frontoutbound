'use client'

import { CheckCircle2, HardDrive, Mail } from 'lucide-react'

export type CampaignMode = 'email' | 'gdrive'

interface CampaignModeSelectorProps {
  value: CampaignMode
  onChange: (mode: CampaignMode) => void
}

const options: Array<{
  mode: CampaignMode
  icon: typeof Mail
  label: string
  desc: string
  tag: string
}> = [
  {
    mode: 'email',
    icon: Mail,
    label: 'Direct Email Campaign',
    desc: 'Launch pooled multi-mailbox outbound email sequences with template variables and automated follow-ups.',
    tag: 'STANDARD OUTBOUND',
  },
  {
    mode: 'gdrive',
    icon: HardDrive,
    label: 'Google Drive Share Outreach',
    desc: 'Share a Drive file with a personalized note — delivered directly by Google as an official share notification.',
    tag: 'GOOGLE PROTOCOL',
  },
]

export function CampaignModeSelector({ value, onChange }: CampaignModeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {options.map((opt) => {
        const selected = value === opt.mode
        const Icon = opt.icon
        return (
          <button
            key={opt.mode}
            type="button"
            onClick={() => onChange(opt.mode)}
            className={`group relative text-left p-6 rounded-[22px] border transition-all duration-200 ${
              selected
                ? 'border-[#ee382b] bg-white shadow-[0_12px_32px_rgba(238,56,43,0.08)] ring-1 ring-[#ee382b]/30'
                : 'border-[#121316]/08 bg-[#faf8f4] hover:bg-white hover:border-[#121316]/16 hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)]'
            }`}
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-[14px] transition-transform duration-200 group-hover:scale-105 ${
                  selected
                    ? 'bg-[#121316] text-white shadow-xs'
                    : 'bg-white text-[#121316] border border-[#121316]/08'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>

              {selected ? (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#ee382b]/10 border border-[#ee382b]/20 px-3 py-1 text-xs font-bold text-[#ee382b]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Selected</span>
                </div>
              ) : (
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8a8780]">
                  {opt.tag}
                </span>
              )}
            </div>

            <div className="text-base font-bold text-[#121316] mb-1 group-hover:text-[#ee382b] transition-colors">
              {opt.label}
            </div>
            <div className="text-xs sm:text-sm text-[#62605c] leading-relaxed">
              {opt.desc}
            </div>
          </button>
        )
      })}
    </div>
  )
}

