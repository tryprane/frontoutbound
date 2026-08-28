'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Upload, Check, ArrowRight, FileSpreadsheet, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react'
import { CsvUploader } from '@/components/csv/CsvUploader'
import { ColumnMapper } from '@/components/csv/ColumnMapper'
import { CsvPreviewTable } from '@/components/csv/CsvPreviewTable'
import { ColumnMapping, describeColumnMapping } from '@/lib/csv-parser/column-detector'

type UploadResult = {
  id: string
  originalName: string
  rowCount: number
  headers: string[]
  detectedMapping: ColumnMapping
  preview: Record<string, string>[]
}

type WizardStep = 'upload' | 'map' | 'done'

export default function UploadCsvPage() {
  const router = useRouter()
  const [step, setStep] = useState<WizardStep>('upload')
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)

  const steps = [
    { key: 'upload', label: '1. Upload CSV' },
    { key: 'map', label: '2. Map Columns' },
    { key: 'done', label: '3. Complete' },
  ]

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Top Floating Actions Bar */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <Link
          href="/csv"
          className="inline-flex items-center gap-1.5 rounded-full border border-[#121316]/10 bg-white/90 backdrop-blur-md px-4 py-2 text-xs font-semibold text-[#121316] shadow-sm transition-all hover:bg-white hover:shadow-md active:scale-95 ml-auto"
        >
          <span>← Back to CSV files</span>
        </Link>
      </div>

      {/* Step Indicator Pill Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {steps.map((s, i) => {
          const isActive = s.key === step
          const isDone = steps.findIndex((x) => x.key === step) > i
          return (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#121316] text-white border-[#121316] shadow-xs'
                    : isDone
                    ? 'bg-[#0f8a5f]/10 text-[#0f8a5f] border-[#0f8a5f]/20'
                    : 'bg-[#faf8f4] text-[#62605c] border-[#121316]/08'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#0f8a5f]" />
                ) : (
                  <span className="font-mono text-[11px]">{i + 1}</span>
                )}
                <span>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <ChevronRight className="h-4 w-4 text-[#8a8780] shrink-0" />
              )}
            </div>
          )
        })}
      </div>

      {/* Step: Upload */}
      {step === 'upload' && (
        <div className="uneevo-card rounded-[28px] border border-[#121316]/08 bg-white p-8 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          <CsvUploader
            onUploadComplete={(result) => {
              setUploadResult(result)
              setStep('map')
            }}
          />
        </div>
      )}

      {/* Step: Map columns */}
      {step === 'map' && uploadResult && (
        <div className="space-y-6">
          {/* File summary bar */}
          <div className="uneevo-card p-5 rounded-[22px] border border-[#121316]/08 bg-white flex items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#121316]/06 text-[#121316]">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold text-[#121316] text-sm">{uploadResult.originalName}</div>
                <div className="text-xs text-[#62605c] font-mono mt-0.5">
                  {uploadResult.rowCount.toLocaleString()} rows • {uploadResult.headers.length} columns detected
                </div>
              </div>
            </div>
            <div className="inline-flex items-center gap-1 text-xs font-bold text-[#0f8a5f] bg-[#0f8a5f]/10 px-3 py-1 rounded-full border border-[#0f8a5f]/20">
              <Check className="h-3.5 w-3.5" />
              <span>Parsed successfully</span>
            </div>
          </div>

          {/* Preview Table Container */}
          <div className="uneevo-card p-6 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
            <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase block mb-1">
              DATASET PREVIEW
            </span>
            <h3 className="zoho-puvi-headline text-lg font-bold text-[#121316] mb-4">
              First 5 Rows of Prospect Data
            </h3>
            <CsvPreviewTable
              headers={uploadResult.headers}
              rows={uploadResult.preview}
              highlightColumns={
                Object.fromEntries(
                  Object.entries(uploadResult.detectedMapping)
                    .filter(([, entry]) => entry.type !== 'ignore')
                    .map(([header, entry]) => [
                      header,
                      {
                        label: describeColumnMapping(entry, header),
                        color: entry.type === 'custom' ? '#ee382b' : '#121316',
                      },
                    ])
                ) as Record<string, { label: string; color: string }>
              }
            />
          </div>

          {/* Column Mapper Container */}
          <div className="uneevo-card p-6 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
            <ColumnMapper
              csvFileId={uploadResult.id}
              headers={uploadResult.headers}
              currentMapping={uploadResult.detectedMapping}
              preview={uploadResult.preview}
              onMappingSaved={() => setStep('done')}
            />
          </div>
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && uploadResult && (
        <div className="uneevo-card rounded-[28px] border border-[#121316]/08 bg-white p-12 sm:p-16 text-center shadow-[0_10px_30px_rgba(0,0,0,0.03)] animate-fade-in">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0f8a5f]/15 text-[#0f8a5f] shadow-xs mx-auto mb-4">
            <Sparkles className="h-8 w-8" />
          </div>
          <span className="text-xs font-bold tracking-widest text-[#0f8a5f] uppercase block mb-1">
            IMPORT COMPLETE
          </span>
          <h2 className="zoho-puvi-headline text-2xl font-bold text-[#121316] mb-2">
            Dataset Ready for Sequences!
          </h2>
          <p className="text-sm text-[#62605c] max-w-md mx-auto mb-8">
            <strong className="text-[#121316] font-bold">{uploadResult.originalName}</strong> was imported with{' '}
            <strong className="font-mono text-[#121316] font-bold">
              {uploadResult.rowCount.toLocaleString()} prospects
            </strong>
            . Columns are mapped and verified.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <button
              className="inline-flex items-center gap-2 rounded-full bg-[#ee382b] px-7 py-3 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(238,56,43,0.22)] transition-all hover:bg-[#d92b1f] hover:shadow-[0_10px_28px_rgba(238,56,43,0.32)]"
              onClick={() => router.push('/campaigns/new')}
            >
              <span>Create campaign with this list</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-full border border-[#121316]/12 bg-white px-6 py-3 text-sm font-semibold text-[#121316] transition-all hover:bg-[#faf8f4] hover:shadow-xs"
              onClick={() => router.push('/csv')}
            >
              <span>View all datasets</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
