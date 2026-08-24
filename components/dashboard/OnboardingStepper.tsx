'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Mail,
  FileSpreadsheet,
  Megaphone,
} from 'lucide-react'

type OnboardingProps = {
  hasMailAccounts: boolean
  hasCsvFiles: boolean
  hasCampaigns: boolean
}

export function OnboardingStepper({
  hasMailAccounts,
  hasCsvFiles,
  hasCampaigns,
}: OnboardingProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const steps = [
    {
      id: 'step-mailbox',
      title: 'Connect a sender mailbox',
      desc: 'Link Gmail, Zoho, or SMTP to start warming and outbound delivery.',
      completed: hasMailAccounts,
      href: '/mail-accounts',
      actionLabel: 'Add Mailbox',
      icon: Mail,
    },
    {
      id: 'step-csv',
      title: 'Import your lead contact list',
      desc: 'Upload a CSV of verified prospects with company and email columns.',
      completed: hasCsvFiles,
      href: '/csv',
      actionLabel: 'Upload CSV',
      icon: FileSpreadsheet,
    },
    {
      id: 'step-campaign',
      title: 'Create and launch your first sequence',
      desc: 'Compose email templates, attach schedule, and assign senders.',
      completed: hasCampaigns,
      href: '/campaigns/new',
      actionLabel: 'New Campaign',
      icon: Megaphone,
    },
  ]

  const completedCount = steps.filter((s) => s.completed).length
  const progressPercent = Math.round((completedCount / steps.length) * 100)

  // If all steps completed and user dismissed, hide completely
  if (dismissed || (completedCount === steps.length && collapsed)) {
    return null
  }

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-[#121316]/10 bg-gradient-to-r from-[#fefbf6] via-[#faf6ee] to-[#f6f2e9] p-6 shadow-[0_12px_36px_rgba(0,0,0,0.04)] transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#121316] text-white shadow-xs">
            <Sparkles className="h-5 w-5 text-[#e6c184]" />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#ee382b] uppercase block mb-0.5">
              STEP 00 — ONBOARDING
            </span>
            <div className="flex items-center gap-2">
              <h3 className="zoho-puvi-headline text-base sm:text-lg font-bold text-[#121316]">
                Getting Started Checklist
              </h3>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#121316]/08 text-[#121316]">
                {completedCount} of {steps.length} completed
              </span>
            </div>
            <p className="text-xs text-[#52504b] mt-0.5">
              Complete these 3 foundational steps to start generating replies.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mini Progress Bar */}
          <div className="hidden md:flex items-center gap-2.5 bg-white/80 px-3.5 py-1.5 rounded-full border border-[#121316]/08 shadow-xs">
            <div className="h-2 w-24 rounded-full bg-[#121316]/10 overflow-hidden">
              <div
                className="h-full bg-[#121316] transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-[#121316]">
              {progressPercent}%
            </span>
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 text-[#62605c] hover:text-[#121316] rounded-full hover:bg-black/5 transition"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Stepper Body */}
      {!collapsed && (
        <div className="mt-6 grid gap-3.5 md:grid-cols-3 pt-5 border-t border-[#121316]/08">
          {steps.map((step, idx) => {
            const Icon = step.icon
            return (
              <div
                key={step.id}
                className={`relative flex flex-col justify-between rounded-[20px] border p-5 transition-all duration-300 ${
                  step.completed
                    ? 'border-[#0f8a5f]/25 bg-[#0f8a5f]/[0.04]'
                    : 'border-[#121316]/08 bg-white/90 hover:bg-white hover:border-[#121316]/15 hover:shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-[8px] ${
                          step.completed
                            ? 'bg-[#0f8a5f]/15 text-[#0f8a5f]'
                            : 'bg-[#121316]/06 text-[#62605c]'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-[11px] font-mono font-bold text-[#62605c]">
                        STEP 0{idx + 1}
                      </span>
                    </div>

                    {step.completed ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0f8a5f] bg-[#0f8a5f]/10 px-2.5 py-0.5 rounded-full border border-[#0f8a5f]/20">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Done
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#62605c] bg-[#121316]/06 px-2.5 py-0.5 rounded-full">
                        <Circle className="h-3 w-3" />
                        Pending
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-[#121316] leading-snug">
                    {step.title}
                  </h4>
                  <p className="mt-1.5 text-xs text-[#52504b] leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                {!step.completed && (
                  <div className="mt-5 pt-1">
                    <Link
                      href={step.href}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#121316] hover:text-[#ee382b] transition-colors"
                    >
                      <span>{step.actionLabel}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
