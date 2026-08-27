'use client'

import { useState } from 'react'
import {
  Mail,
  Clock,
  ArrowDown,
  Sparkles,
  Eye,
  CheckCircle,
  ShieldAlert,
  FileText,
  Edit3,
  HardDrive,
  MessageCircle,
} from 'lucide-react'

export interface SequenceStepItem {
  stepNumber: number
  subjectTemplate?: string | null
  bodyTemplate?: string | null
  delayDays: number
  stopOnReply?: boolean
}

interface Props {
  channel: 'EMAIL' | 'WHATSAPP' | 'GDRIVE'
  sequenceEnabled?: boolean
  steps?: SequenceStepItem[]
  subjectTemplate?: string | null
  bodyTemplate?: string | null
  messageTemplate?: string | null
  onEditSequence?: () => void
}

export function CampaignSequenceTree({
  channel,
  sequenceEnabled,
  steps,
  subjectTemplate,
  bodyTemplate,
  messageTemplate,
  onEditSequence,
}: Props) {
  const [selectedStepIdx, setSelectedStepIdx] = useState<number>(0)

  const isEmail = channel === 'EMAIL'
  const isWhatsApp = channel === 'WHATSAPP'
  const isDrive = channel === 'GDRIVE'

  // Build unified normalized sequence list
  const normalizedSteps: SequenceStepItem[] =
    isEmail && sequenceEnabled && steps && steps.length > 0
      ? steps
      : [
          {
            stepNumber: 1,
            subjectTemplate: subjectTemplate || (isDrive ? 'GDrive Share Invitation' : isWhatsApp ? 'WhatsApp Message' : 'Cold Outreach Initial Pitch'),
            bodyTemplate: bodyTemplate || messageTemplate || 'No message content defined yet.',
            delayDays: 0,
            stopOnReply: true,
          },
        ]

  const activeStep = normalizedSteps[selectedStepIdx] || normalizedSteps[0]

  return (
    <div className="uneevo-card p-6 md:p-7 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase block">
              CADENCE ROADMAP
            </span>
            <span className="text-[11px] font-bold text-[#121316] bg-[#121316]/08 px-2.5 py-0.5 rounded-full">
              {normalizedSteps.length} Step{normalizedSteps.length > 1 ? 's' : ''} in Cadence
            </span>
          </div>
          <h3 className="zoho-puvi-headline text-lg sm:text-xl font-bold text-[#121316]">
            Multi-Step Sequence Flow & Triggers
          </h3>
        </div>

        {onEditSequence && (
          <button
            type="button"
            onClick={onEditSequence}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#121316]/12 bg-white px-4 py-2 text-xs font-semibold text-[#121316] hover:bg-[#faf8f4] transition shadow-2xs"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Edit Cadence</span>
          </button>
        )}
      </div>

      {/* Grid: Left Sequence Stepper (40%), Right Active Step Inspection (60%) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.4fr] gap-6 items-start">
        {/* Left: Step Sequence Visual Chain */}
        <div className="space-y-4">
          {normalizedSteps.map((step, idx) => {
            const isSelected = selectedStepIdx === idx

            return (
              <div key={step.stepNumber} className="space-y-3">
                {/* Delay connector if step > 1 */}
                {idx > 0 && (
                  <div className="flex items-center gap-3 pl-5 py-1">
                    <div className="flex flex-col items-center">
                      <div className="w-0.5 h-4 bg-[#121316]/15" />
                      <ArrowDown className="h-3.5 w-3.5 text-[#ee382b]" />
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-[#fde9b0]/60 border border-[#b7791f]/20 px-3 py-1 text-[11px] font-mono font-bold text-[#5c4211]">
                      <Clock className="h-3 w-3" />
                      <span>Wait {step.delayDays} day{step.delayDays > 1 ? 's' : ''} · If no reply</span>
                    </div>
                  </div>
                )}

                {/* Step Card */}
                <div
                  onClick={() => setSelectedStepIdx(idx)}
                  className={`rounded-[18px] p-4 border transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'border-[#121316] bg-[#faf8f4] shadow-md ring-2 ring-[#121316]/10'
                      : 'border-[#121316]/08 bg-white hover:border-[#121316]/20 hover:bg-[#faf8f4]/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-[8px] text-xs font-bold ${
                          isSelected ? 'bg-[#121316] text-white' : 'bg-[#121316]/08 text-[#121316]'
                        }`}
                      >
                        {step.stepNumber}
                      </div>
                      <span className="text-xs font-bold text-[#121316]">
                        {idx === 0 ? 'Step 1: Initial Pitch' : `Step ${step.stepNumber}: Follow-up #${idx}`}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#0f8a5f] bg-[#0f8a5f]/10 px-2 py-0.5 rounded-full font-bold">
                      Stop on reply
                    </span>
                  </div>

                  {step.subjectTemplate && (
                    <div className="text-xs font-semibold text-[#121316] truncate mb-1">
                      {step.subjectTemplate}
                    </div>
                  )}

                  <div className="text-[11px] text-[#62605c] line-clamp-2 leading-relaxed">
                    {step.bodyTemplate || 'No template preview available'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right: Step Deep Inspector & Live Preview */}
        <div className="rounded-[20px] bg-[#faf8f4] border border-[#121316]/08 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#121316]/08 pb-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-[#ee382b]" />
              <span className="text-xs font-bold text-[#121316] uppercase tracking-wider">
                Step {activeStep.stepNumber} Preview & Template
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#62605c]">
              {channel} Channel
            </span>
          </div>

          {/* Subject display */}
          {activeStep.subjectTemplate && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#8a8780] mb-1">
                Subject Line
              </div>
              <div className="p-3 rounded-[12px] bg-white border border-[#121316]/08 text-xs font-bold text-[#121316]">
                {activeStep.subjectTemplate}
              </div>
            </div>
          )}

          {/* Email Body preview */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#8a8780] mb-1">
              Message Template
            </div>
            <div className="p-4 rounded-[14px] bg-white border border-[#121316]/08 text-xs leading-relaxed text-[#121316] whitespace-pre-wrap max-h-64 overflow-y-auto font-sans">
              {activeStep.bodyTemplate}
            </div>
          </div>

          {/* Guardrails note */}
          <div className="flex items-start gap-2.5 p-3 rounded-[12px] bg-white border border-[#121316]/06 text-[11px] text-[#62605c] leading-relaxed">
            <Sparkles className="h-4 w-4 text-[#ee382b] shrink-0 mt-0.5" />
            <div>
              <strong>Personalization Engine:</strong> Dynamic tokens like{' '}
              <code className="bg-[#121316]/06 px-1.5 py-0.5 rounded text-[#121316] font-mono text-[10px]">
                {'{{FirstName}}'}
              </code>{' '}
              and{' '}
              <code className="bg-[#121316]/06 px-1.5 py-0.5 rounded text-[#121316] font-mono text-[10px]">
                {'{{Company}}'}
              </code>{' '}
              are resolved in real-time from the attached CSV dataset per recipient.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
