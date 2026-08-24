'use client'

import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { AlertCircle, CheckCircle2, FileSpreadsheet, UploadCloud } from 'lucide-react'
import { ColumnMapping } from '@/lib/csv-parser/column-detector'
import {
  MAX_CSV_FILE_SIZE_BYTES,
  MAX_CSV_FILE_SIZE_LABEL,
  MAX_CSV_ROW_COUNT,
  MAX_CSV_ROW_COUNT_LABEL,
  csvFileSizeLimitError,
  csvRowLimitError,
} from '@/lib/csv-upload-limits'

interface UploadResult {
  id: string
  originalName: string
  rowCount: number
  headers: string[]
  detectedMapping: ColumnMapping
  preview: Record<string, string>[]
}

interface CsvUploaderProps {
  onUploadComplete: (result: UploadResult) => void
}

export function CsvUploader({ onUploadComplete }: CsvUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a .csv file only.')
      return
    }

    if (file.size > MAX_CSV_FILE_SIZE_BYTES) {
      setError(`${csvFileSizeLimitError()}.`)
      return
    }

    let parsed: Papa.ParseResult<Record<string, string>>
    try {
      parsed = Papa.parse<Record<string, string>>(await file.text(), {
        header: true,
        skipEmptyLines: true,
        preview: MAX_CSV_ROW_COUNT + 1,
      })
    } catch {
      setError('Could not read the CSV file.')
      return
    }

    if (parsed.data.length > MAX_CSV_ROW_COUNT) {
      setError(`${csvRowLimitError()}.`)
      return
    }

    setError(null)
    setUploading(true)
    setProgress(20)

    try {
      const formData = new FormData()
      formData.append('file', file)

      setProgress(50)
      const res = await fetch('/api/csv/upload', { method: 'POST', body: formData })
      setProgress(80)

      if (!res.ok) {
        const { error: msg } = await res.json()
        throw new Error(msg || 'Upload failed')
      }

      const data: UploadResult = await res.json()
      setProgress(100)
      setTimeout(() => {
        setUploading(false)
        setProgress(0)
        onUploadComplete(data)
      }, 400)
    } catch (err) {
      setUploading(false)
      setProgress(0)
      setError(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          const f = e.dataTransfer.files[0]
          if (f) handleFile(f)
        }}
        className={`uneevo-card rounded-[24px] p-10 md:p-14 text-center cursor-pointer transition-all duration-200 border-2 border-dashed ${
          isDragging
            ? 'border-[#ee382b] bg-[#ee382b]/05 shadow-[0_10px_30px_rgba(238,56,43,0.08)]'
            : 'border-[#121316]/12 bg-[#faf8f4] hover:bg-white hover:border-[#121316]/24'
        } ${uploading ? 'pointer-events-none opacity-70' : ''}`}
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-xs border border-[#121316]/06 text-[#ee382b] mb-4">
          <UploadCloud className="h-8 w-8" />
        </div>

        <h3 className="zoho-puvi-headline text-lg sm:text-xl font-bold text-[#121316] mb-1">
          {uploading ? 'Processing & Ingesting Dataset...' : 'Drop your prospect CSV file here'}
        </h3>
        <p className="text-xs sm:text-sm text-[#62605c] mb-2">
          or click to browse from your device (standard <strong className="text-[#121316]">.csv</strong> format)
        </p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#121316]/05 text-[11px] font-mono text-[#8a8780]">
          <span>Limit: {MAX_CSV_FILE_SIZE_LABEL}</span>
          <span>•</span>
          <span>Max {MAX_CSV_ROW_COUNT_LABEL} contacts</span>
        </div>

        {/* Progress bar */}
        {uploading && (
          <div className="mt-6 mx-auto max-w-xs space-y-1.5">
            <div className="h-2 w-full bg-[#121316]/08 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#ee382b] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-[11px] font-mono text-[#8a8780]">{progress}% uploaded</div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />

      {/* Error message */}
      {error && (
        <div className="p-4 rounded-[16px] bg-[#ee382b]/08 border border-[#ee382b]/20 flex items-center gap-3 text-xs text-[#ee382b]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

