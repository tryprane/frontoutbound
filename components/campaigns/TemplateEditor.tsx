'use client'

import { useMemo, useState } from 'react'
import { TemplateVariableOption } from '@/lib/csv-parser/column-detector'
import { Sparkles, Eye, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'

type TemplateMode = 'email' | 'whatsapp' | 'gdrive'

interface PreviewResult {
  subject?: string
  body?: string
  message?: string
  usedRow: Record<string, string | null>
}

interface TemplateEditorProps {
  mode: TemplateMode
  csvFileId: string
  subjectTemplate: string
  bodyTemplate: string
  messageTemplate: string
  onSubjectTemplateChange: (value: string) => void
  onBodyTemplateChange: (value: string) => void
  onMessageTemplateChange: (value: string) => void
  variables: TemplateVariableOption[]
}

export function TemplateEditor({
  mode,
  csvFileId,
  subjectTemplate,
  bodyTemplate,
  messageTemplate,
  onSubjectTemplateChange,
  onBodyTemplateChange,
  onMessageTemplateChange,
  variables,
}: TemplateEditorProps) {
  const [previewing, setPreviewing] = useState(false)
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [previewRowIndex, setPreviewRowIndex] = useState(0)

  const variableChips = useMemo(
    () =>
      variables.map((variable) => ({
        ...variable,
        token: `{{${variable.key}}}`,
      })),
    [variables]
  )

  const handlePreview = async (offset = 0) => {
    setPreviewing(true)
    setError(null)
    const nextIndex = Math.max(0, previewRowIndex + offset)
    setPreviewRowIndex(nextIndex)

    try {
      const res = await fetch('/api/campaigns/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvFileId,
          channel: mode,
          subjectTemplate,
          bodyTemplate,
          messageTemplate,
          rowIndex: nextIndex,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Preview failed')
      setPreviewResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed')
    } finally {
      setPreviewing(false)
    }
  }

  const renderVariableButton = (
    variable: { key: string; label: string; token: string },
    onInsert: (token: string) => void
  ) => (
    <button
      key={variable.key}
      type="button"
      onClick={() => onInsert(variable.token)}
      className="inline-flex items-center gap-1 rounded-full border border-[#121316]/10 bg-white px-3 py-1 text-xs font-medium text-[#121316] transition-all hover:border-[#ee382b] hover:text-[#ee382b] hover:bg-[#ee382b]/05 shadow-2xs"
    >
      <span className="font-mono text-[11px] text-[#ee382b]">+</span>
      <span>{variable.label}</span>
    </button>
  )

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
      {/* Editor Column */}
      <div className="space-y-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#ee382b] mb-1">
            {mode === 'email' ? 'EMAIL TEMPLATE COMPOSER' : mode === 'gdrive' ? 'SHARE NOTE COMPOSER' : 'WHATSAPP TEMPLATE'}
          </div>
          <p className="text-xs text-[#62605c]">
            {mode === 'gdrive'
              ? 'Delivered as the note of the Drive share email notification. Google generates the subject line automatically.'
              : 'Insert mapped contact variables to dynamically personalize each sequence message.'}
          </p>
        </div>

        {mode === 'email' ? (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#121316]">Subject line</label>
                <span className="text-[11px] font-mono text-[#8a8780]">Click tags below to insert</span>
              </div>
              <input
                value={subjectTemplate}
                onChange={(event) => onSubjectTemplateChange(event.target.value)}
                placeholder="Quick idea for {{companyName}}"
                className="w-full rounded-[14px] border border-[#121316]/12 bg-[#faf8f4] px-4 py-3 text-sm text-[#121316] transition focus:border-[#ee382b] focus:bg-white focus:outline-none"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {variableChips.map((variable) =>
                  renderVariableButton(variable, (token) =>
                    onSubjectTemplateChange(`${subjectTemplate}${token}`)
                  )
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#121316]">Message body</label>
              </div>
              <textarea
                value={bodyTemplate}
                onChange={(event) => onBodyTemplateChange(event.target.value)}
                placeholder={'Hi {{firstName}},\n\nI noticed {{companyName}} and wanted to share one idea.\n\n{{Personalization}}'}
                rows={8}
                className="w-full rounded-[16px] border border-[#121316]/12 bg-[#faf8f4] p-4 text-sm text-[#121316] leading-relaxed transition focus:border-[#ee382b] focus:bg-white focus:outline-none"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {variableChips.map((variable) =>
                  renderVariableButton(variable, (token) =>
                    onBodyTemplateChange(`${bodyTemplate}${token}`)
                  )
                )}
              </div>
            </div>
          </div>
        ) : mode === 'gdrive' ? (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#121316]">Share notification note</label>
              </div>
              <textarea
                value={bodyTemplate}
                onChange={(event) => onBodyTemplateChange(event.target.value)}
                placeholder={'Hi {{firstName}},\n\nI put together a short breakdown for {{companyName}} and shared it here.\n\nHappy to walk you through it if useful.'}
                rows={8}
                className="w-full rounded-[16px] border border-[#121316]/12 bg-[#faf8f4] p-4 text-sm text-[#121316] leading-relaxed transition focus:border-[#ee382b] focus:bg-white focus:outline-none"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {variableChips.map((variable) =>
                  renderVariableButton(variable, (token) =>
                    onBodyTemplateChange(`${bodyTemplate}${token}`)
                  )
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#121316]">Message</label>
              </div>
              <textarea
                value={messageTemplate}
                onChange={(event) => onMessageTemplateChange(event.target.value)}
                placeholder={'Hi {{firstName}}, I was checking out {{companyName}} and wanted to share one quick idea.'}
                rows={8}
                className="w-full rounded-[16px] border border-[#121316]/12 bg-[#faf8f4] p-4 text-sm text-[#121316] leading-relaxed transition focus:border-[#ee382b] focus:bg-white focus:outline-none"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {variableChips.map((variable) =>
                  renderVariableButton(variable, (token) =>
                    onMessageTemplateChange(`${messageTemplate}${token}`)
                  )
                )}
              </div>
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={() => handlePreview()}
            disabled={
              previewing ||
              !csvFileId ||
              (mode === 'email' || mode === 'gdrive' ? !bodyTemplate.trim() : !messageTemplate.trim())
            }
            className="inline-flex items-center gap-2 rounded-full bg-[#121316] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-black disabled:opacity-50"
          >
            <Eye className="h-4 w-4" />
            <span>{previewing ? 'Rendering Row...' : 'Preview with Sample Contact'}</span>
          </button>
        </div>
      </div>

      {/* Live Preview Column */}
      <div className="space-y-4">
        {error && (
          <div className="p-4 rounded-[16px] bg-[#ee382b]/08 border border-[#ee382b]/20 text-xs text-[#ee382b] flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {previewResult ? (
          <div className="uneevo-card p-6 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#121316]/08 pb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#ee382b]">
                LIVE RENDER PREVIEW
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePreview(-1)}
                  disabled={previewRowIndex === 0 || previewing}
                  className="p-1 rounded-md border border-[#121316]/10 text-[#62605c] hover:text-[#121316] hover:bg-[#faf8f4] disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="font-mono text-xs text-[#121316] font-bold">
                  Row {previewRowIndex + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handlePreview(1)}
                  disabled={previewing}
                  className="p-1 rounded-md border border-[#121316]/10 text-[#62605c] hover:text-[#121316] hover:bg-[#faf8f4] disabled:opacity-40"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="text-[11px] font-mono text-[#8a8780] bg-[#faf8f4] p-2.5 rounded-[10px] border border-[#121316]/06 overflow-x-auto whitespace-nowrap">
              {Object.entries(previewResult.usedRow)
                .filter(([, value]) => value)
                .map(([key, value]) => `${key}: "${value}"`)
                .join(' · ') || 'No mapped fields'}
            </div>

            {mode === 'email' ? (
              <div className="space-y-3">
                <div>
                  <div className="text-[11px] font-bold text-[#8a8780] uppercase tracking-wider mb-1">
                    Subject
                  </div>
                  <div className="text-sm font-bold text-[#121316]">
                    {previewResult.subject}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[#8a8780] uppercase tracking-wider mb-1">
                    Body Content
                  </div>
                  <div className="text-xs text-[#121316] leading-relaxed bg-[#faf8f4] p-4 rounded-[14px] border border-[#121316]/06 whitespace-pre-wrap">
                    {previewResult.body}
                  </div>
                </div>
              </div>
            ) : mode === 'gdrive' ? (
              <div className="space-y-3">
                <div>
                  <div className="text-[11px] font-bold text-[#8a8780] uppercase tracking-wider mb-1">
                    Share Note
                  </div>
                  <div className="text-xs text-[#121316] leading-relaxed bg-[#faf8f4] p-4 rounded-[14px] border border-[#121316]/06 whitespace-pre-wrap">
                    {previewResult.body}
                  </div>
                  <p className="text-[11px] text-[#8a8780] mt-2">
                    Google delivers this directly with official branding from drive-shares-dm-noreply@google.com.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <div className="text-[11px] font-bold text-[#8a8780] uppercase tracking-wider mb-1">
                    Message
                  </div>
                  <div className="text-xs text-[#121316] leading-relaxed bg-[#faf8f4] p-4 rounded-[14px] border border-[#121316]/06 whitespace-pre-wrap">
                    {previewResult.message}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center rounded-[24px] border border-dashed border-[#121316]/16 bg-[#faf8f4] p-8 text-center">
            <Sparkles className="h-8 w-8 text-[#ee382b] mb-2" />
            <div className="text-xs font-bold text-[#121316]">Sample Preview</div>
            <p className="text-xs text-[#62605c] mt-1 max-w-xs">
              Click &quot;Preview with Sample Contact&quot; to test variables on row 1 of your dataset.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

